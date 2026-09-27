import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { saveAs } from 'file-saver';
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Calculator,
  Image as ImageIcon,
  Check,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  HelpCircle,
  FileText,
  ListPlus
} from 'lucide-react';

import { LoadedTemplate, TemplateVariable, LineItem } from './types';
import {
  parseExcelTemplate,
  generateFilledExcel,
  extractLineItemsFromVariables
} from './utils/excelParser';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { VariableField } from './components/VariableField';
import { LineItemsTable } from './components/LineItemsTable';
import { TemplateUploader } from './components/TemplateUploader';
import { PlaceholderHelperModal } from './components/PlaceholderHelperModal';
import { JsonDataModal } from './components/JsonDataModal';

const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
const QUOTE_TEMPLATE_PATH = `${baseUrl}商務報價單範本.xlsx`;
const INVOICE_TEMPLATE_PATH = `${baseUrl}商業請款單範本.xlsx`;

export default function App() {
  const [currentTemplate, setCurrentTemplate] = useState<LoadedTemplate | null>(null);
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [activePreset, setActivePreset] = useState<string | null>(QUOTE_TEMPLATE_PATH);

  // UI state
  const [isLoadingTemplate, setIsLoadingTemplate] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'unfilled' | 'filled'>('all');
  const [activeGroupFilter, setActiveGroupFilter] = useState<string>('all');

  // Modals & Feedback
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isHelperModalOpen, setIsHelperModalOpen] = useState<boolean>(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  /**
   * 載入特定 URL 的 Excel 檔案
   */
  const loadPresetTemplate = useCallback(async (url: string, displayName: string) => {
    setIsLoadingTemplate(true);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`無法載入範本 (${response.status} ${response.statusText})`);
      }
      const buffer = await response.arrayBuffer();
      const fileName = url.split('/').pop() || `${displayName}.xlsx`;
      const { template, variables: parsedVars, lineItems: parsedItems } = await parseExcelTemplate(buffer, fileName, 'preset');

      setCurrentTemplate(template);
      setVariables(parsedVars);
      setLineItems(parsedItems);

      // 初始化非表格表單數值
      const initialValues: Record<string, string> = {};
      parsedVars.forEach((v) => {
        initialValues[v.key] = v.defaultValue;
      });
      setFormValues(initialValues);
      setActivePreset(url);
      showToast(`已成功載入「${template.name}」，共偵測到 ${parsedVars.length} 項變數，已啟用動態明細表格！`, 'success');
    } catch (err: any) {
      console.warn('Preset load failed:', err);
      showToast(`讀取預設範本「${displayName}」失敗：${err.message || '檔案可能尚未就緒'}，您可以上傳本機範本使用。`, 'error');
    } finally {
      setIsLoadingTemplate(false);
    }
  }, [showToast]);

  // 初次載入預設商務報價單範本
  useEffect(() => {
    loadPresetTemplate(QUOTE_TEMPLATE_PATH, '商務報價單範本');
  }, [loadPresetTemplate]);

  /**
   * 處理使用者自訂上傳 Excel
   */
  const handleCustomFileLoaded = useCallback(async (buffer: ArrayBuffer, fileName: string) => {
    setIsLoadingTemplate(true);
    try {
      const { template, variables: parsedVars, lineItems: parsedItems } = await parseExcelTemplate(buffer, fileName, 'custom');
      setCurrentTemplate(template);
      setVariables(parsedVars);
      setLineItems(parsedItems);

      const initialValues: Record<string, string> = {};
      parsedVars.forEach((v) => {
        initialValues[v.key] = v.defaultValue;
      });
      setFormValues(initialValues);
      setActivePreset('custom');

      if (parsedVars.length === 0) {
        showToast(`已載入「${fileName}」，但在工作表中未發現 {{變數名稱 | 預設值}} 佔位符語法。`, 'info');
      } else {
        showToast(`成功讀取自訂範本「${fileName}」！解析出 ${parsedVars.length} 個變數欄位。`, 'success');
      }
    } catch (err: any) {
      showToast(`解析自訂範本失敗：${err.message}`, 'error');
    } finally {
      setIsLoadingTemplate(false);
    }
  }, [showToast]);

  /**
   * 表單欄位異動處理
   */
  const handleFieldChange = (key: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  /**
   * 單一欄位還原為預設值
   */
  const handleResetSingleField = (key: string) => {
    const targetVar = variables.find((v) => v.key === key);
    if (targetVar) {
      setFormValues((prev) => ({
        ...prev,
        [key]: targetVar.defaultValue
      }));
    }
  };

  /**
   * 一鍵還原所有欄位與項目明細至預設值
   */
  const handleResetAllToDefaults = () => {
    const defaultsMap: Record<string, string> = {};
    variables.forEach((v) => {
      defaultsMap[v.key] = v.defaultValue;
    });
    setFormValues(defaultsMap);
    setLineItems(extractLineItemsFromVariables(variables));
    showToast('已將所有欄位與明細表格還原回範本原始預設值。', 'info');
  };

  /**
   * 一鍵清空所有欄位
   */
  const handleClearAllFields = () => {
    const emptyMap: Record<string, string> = {};
    variables.forEach((v) => {
      emptyMap[v.key] = '';
    });
    setFormValues(emptyMap);
    showToast('已清空所有欄位輸入數值。', 'info');
  };

  const handleDownloadRawTemplate = () => {
    if (!currentTemplate) return;
    const blob = new Blob([currentTemplate.buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, currentTemplate.fileName);
    showToast(`已下載原始範本檔「${currentTemplate.fileName}」`, 'info');
  };

  /**
   * 一鍵匯出並下載 XLSX
   */
  const handleExportXLSX = async () => {
    if (!currentTemplate) {
      showToast('目前沒有載入任何範本可供匯出。', 'error');
      return;
    }

    setIsExporting(true);
    try {
      const outputBuffer = await generateFilledExcel(currentTemplate.buffer, formValues, lineItems);

      // 檔名：填寫完成_[原範本名]_[YYYYMMDD].xlsx
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}${mm}${dd}`;
      const cleanBaseName = currentTemplate.name.replace(/範本/g, '').replace(/template/gi, '').trim() || currentTemplate.name;
      const downloadFileName = `填寫完成_${cleanBaseName}_${dateStr}.xlsx`;

      const blob = new Blob([outputBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      saveAs(blob, downloadFileName);
      showToast(`🎉 成功匯出「${downloadFileName}」！共包含 ${lineItems.length} 項明細，公式與圖層完整保留。`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`匯出失敗：${err.message || '產生 Excel 檔案時發生未預期錯誤'}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // 分離出非明細表格欄位，避免在下方卡片重複出現
  const nonItemVariables = useMemo(() => {
    return variables.filter((v) => !v.isLineItemField);
  }, [variables]);

  // 過濾後的非表格變數清單
  const filteredNonItemVariables = useMemo(() => {
    return nonItemVariables.filter((v) => {
      const val = formValues[v.key] ?? '';
      const isFilled = val.trim() !== '';

      if (filterMode === 'filled' && !isFilled) return false;
      if (filterMode === 'unfilled' && isFilled) return false;

      if (activeGroupFilter !== 'all' && v.group !== activeGroupFilter) return false;

      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const matchKey = v.key.toLowerCase().includes(kw);
        const matchDef = v.defaultValue.toLowerCase().includes(kw);
        const matchVal = val.toLowerCase().includes(kw);
        const matchLocation = v.occurrences.some((o) => o.cellAddress.toLowerCase().includes(kw));
        if (!matchKey && !matchDef && !matchVal && !matchLocation) return false;
      }

      return true;
    });
  }, [nonItemVariables, formValues, filterMode, activeGroupFilter, searchKeyword]);

  // 取得群組清單（排除明細項目清單群組）
  const allGroups = useMemo(() => {
    const set = new Set<string>();
    nonItemVariables.forEach((v) => {
      if (v.group && v.group !== '明細項目清單') set.add(v.group);
    });
    return Array.from(set);
  }, [nonItemVariables]);

  const hasItemTable = currentTemplate?.hasItemTable || lineItems.length > 0;

  // 填寫進度統計
  const filledCount = useMemo(() => {
    const fieldsFilled = nonItemVariables.filter((v) => (formValues[v.key] ?? '').trim() !== '').length;
    const itemsFilled = lineItems.filter((it) => it.name.trim() !== '').length;
    return fieldsFilled + itemsFilled;
  }, [nonItemVariables, formValues, lineItems]);

  const totalCount = nonItemVariables.length + lineItems.length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Top Header */}
      <Header
        currentTemplateName={currentTemplate?.name || '無範本'}
        onSelectPreset={loadPresetTemplate}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onExport={handleExportXLSX}
        isExporting={isExporting}
        activePreset={activePreset}
        quotePresetPath={QUOTE_TEMPLATE_PATH}
        invoicePresetPath={INVOICE_TEMPLATE_PATH}
      />

      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-fade-in shadow-xl">
          <div
            className={`px-4 py-3 rounded-xl border flex items-center gap-3 ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-emerald-50 border-emerald-700'
                : toast.type === 'error'
                  ? 'bg-rose-900 text-rose-50 border-rose-700'
                  : 'bg-slate-900 text-slate-100 border-slate-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />
            )}
            <span className="text-xs font-medium leading-relaxed">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-auto text-slate-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {isLoadingTemplate ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <h2 className="text-base font-bold text-slate-900 mb-1">正在載入並解析 Excel 範本與表格結構...</h2>
            <p className="text-xs text-slate-500 max-w-sm">
              純前端載入 ExcelJS 工作簿，即時掃描儲存格內所有佔位符語法並保護圖層與公式。
            </p>
          </div>
        ) : !currentTemplate ? (
          /* Empty / Failed State */
          <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 max-w-md mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">尚未載入 Excel 範本</h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              您可以點擊上方預載按鈕切換內建的「商務報價單」或「商業請款單」，也可以立即上傳自己的自訂範本。
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadPresetTemplate(QUOTE_TEMPLATE_PATH, '商務報價單範本')}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                載入商務報價單範本
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                上傳本機範本
              </button>
            </div>
          </div>
        ) : (
          /* Populated Form View */
          <>
            <StatsBar
              template={currentTemplate}
              searchKeyword={searchKeyword}
              onSearchChange={setSearchKeyword}
              filterMode={filterMode}
              onFilterChange={setFilterMode}
              onResetDefaults={handleResetAllToDefaults}
              onClearAll={handleClearAllFields}
              onOpenJsonModal={() => setIsJsonModalOpen(true)}
              onOpenHelperModal={() => setIsHelperModalOpen(true)}
              onDownloadRawTemplate={handleDownloadRawTemplate}
              filledCount={filledCount}
              totalCount={totalCount}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Form Area (8 cols on lg) */}
                <div className="lg:col-span-8 space-y-8">
                  {/* 1. 動態明細項目表格 (Line Items Table) - 當有項目表格時優先以表格呈現 */}
                  {hasItemTable && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ListPlus className="w-5 h-5 text-blue-600" />
                          <h3 className="text-base font-bold text-slate-900 tracking-tight">
                            明細項目表格編輯區
                          </h3>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          目前項目：{lineItems.length} 項
                        </span>
                      </div>

                      <LineItemsTable
                        items={lineItems}
                        onChangeItems={setLineItems}
                        onResetDefaultItems={() => setLineItems(extractLineItemsFromVariables(variables))}
                      />
                    </div>
                  )}

                  {/* 2. 單據基本資訊與條款設定區 */}
                  {nonItemVariables.length > 0 && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-slate-700" />
                          <h3 className="text-base font-bold text-slate-900 tracking-tight">
                            單據其他欄位與條款設定
                          </h3>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          共 {nonItemVariables.length} 欄位
                        </span>
                      </div>

                      {/* Category Filter Pills (Interactive Segmented controls) */}
                      {allGroups.length > 1 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                          <button
                            onClick={() => setActiveGroupFilter('all')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                              activeGroupFilter === 'all'
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
                            }`}
                          >
                            所有分區 ({nonItemVariables.length})
                          </button>
                          {allGroups.map((grp) => {
                            const countInGrp = nonItemVariables.filter((v) => v.group === grp).length;
                            return (
                              <button
                                key={grp}
                                onClick={() => setActiveGroupFilter(grp)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                                  activeGroupFilter === grp
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
                                }`}
                              >
                                <span>{grp}</span>
                                <span className="ml-1 opacity-70 font-mono text-[11px]">({countInGrp})</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Variables List */}
                      {filteredNonItemVariables.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                          <h4 className="text-sm font-bold text-slate-800 mb-1">查無符合條件的欄位</h4>
                          <p className="text-xs text-slate-500 mb-3">
                            請嘗試清除搜尋關鍵字或切換篩選模式。
                          </p>
                          <button
                            onClick={() => {
                              setSearchKeyword('');
                              setFilterMode('all');
                              setActiveGroupFilter('all');
                            }}
                            className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            重設篩選條件
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredNonItemVariables.map((variable) => (
                            <VariableField
                              key={variable.key}
                              variable={variable}
                              value={formValues[variable.key] ?? ''}
                              onChange={handleFieldChange}
                              onReset={handleResetSingleField}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Sidebar Control & Summary Area (4 cols on lg) */}
                <div className="lg:col-span-4 space-y-6 sticky top-20">
                  {/* Primary Download Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-blue-600" />
                        <span>產出檔案與匯出</span>
                      </h3>
                      <span className="text-[11px] font-mono tabular-nums text-slate-500">
                        {filledCount} / {totalCount} 已填
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      點擊下方按鈕將表單與明細表格數值注入 Excel 儲存格，並保留所有原有圖表、Logo 圖片與試算表公式。
                    </p>

                    <button
                      onClick={handleExportXLSX}
                      disabled={isExporting}
                      className="w-full py-3 px-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isExporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>正在注入數值並打包...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>📥 匯出並下載 XLSX</span>
                        </>
                      )}
                    </button>

                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                      <div className="flex items-center justify-between">
                        <span>預定下載檔名：</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80 font-mono text-[11px] text-slate-700 truncate select-all">
                        {`填寫完成_${currentTemplate.name.replace(/範本/g, '').trim() || '單據'}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`}
                      </div>
                    </div>
                  </div>

                  {/* Template Capabilities & Invariant Guarantees */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                    <h3 className="text-xs font-bold text-slate-900 tracking-wider text-slate-700 uppercase mb-3 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>動態明細與公式機制</span>
                    </h3>

                    <ul className="space-y-2.5 text-xs text-slate-600">
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <span>
                          <strong>動態增減項目</strong>：支援 1 筆或多筆項目，系統在匯出時動態擴充或修剪 Excel 列數。
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <span>
                          <strong>公式自動連動</strong>：小計 <code className="font-mono text-slate-800">=SUM</code> 與營業稅 <code className="font-mono text-slate-800">=ROUND(*0.05)</code> 範圍會隨項目數量自動重設。
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <span>
                          <strong>樣式與圖層傳承</strong>：每列邊框、欄寬、對齊與 Logo 圖層完整保留無缺。
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Drag and Drop Quick Upload Area */}
                  <div
                    onClick={() => setIsUploadModalOpen(true)}
                    className="p-4 bg-slate-100/70 hover:bg-blue-50/50 border border-dashed border-slate-300 hover:border-blue-400 rounded-2xl transition-all cursor-pointer text-center group"
                  >
                    <UploadCloud className="w-6 h-6 text-slate-500 group-hover:text-blue-600 mx-auto mb-2 transition-colors" />
                    <span className="text-xs font-bold text-slate-800 block mb-0.5">
                      載入其他自訂 Excel 範本
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      支援含有 {'{{變數 | 預設值}}'} 的任意工作表
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Modals */}
      <TemplateUploader
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFileLoaded={handleCustomFileLoaded}
      />

      <PlaceholderHelperModal
        isOpen={isHelperModalOpen}
        onClose={() => setIsHelperModalOpen(false)}
      />

      <JsonDataModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        currentValues={formValues}
        lineItems={lineItems}
        onApplyJson={(newVals, newItems) => {
          setFormValues((prev) => ({
            ...prev,
            ...newVals
          }));
          if (newItems && newItems.length > 0) {
            setLineItems(newItems);
          }
          showToast('成功套用外部 JSON 資料！', 'success');
        }}
        templateName={currentTemplate?.name || 'template'}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Universal Template Filler</span>
            <span>·</span>
            <span>純前端 ExcelJS 佔位符模板填寫器</span>
          </div>
          <div>
            <span>免伺服器 · 零 API Key · 本機安全運算</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
