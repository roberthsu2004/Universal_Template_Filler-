import React, { useState } from 'react';
import { FileJson, Copy, Check, Download, Upload, X, AlertCircle } from 'lucide-react';
import { LineItem } from '../types';

interface JsonDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentValues: Record<string, string>;
  lineItems?: LineItem[];
  onApplyJson: (newValues: Record<string, string>, newItems?: LineItem[]) => void;
  templateName: string;
}

export const JsonDataModal: React.FC<JsonDataModalProps> = ({
  isOpen,
  onClose,
  currentValues,
  lineItems,
  onApplyJson,
  templateName
}) => {
  const initialJson = () => {
    if (lineItems && lineItems.length > 0) {
      return JSON.stringify(
        {
          fields: currentValues,
          items: lineItems
        },
        null,
        2
      );
    }
    return JSON.stringify(currentValues, null, 2);
  };

  const [jsonText, setJsonText] = useState(initialJson);
  const [copySuccess, setCopySuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 1500);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `資料暫存_${templateName}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApply = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const parsed = JSON.parse(jsonText);
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('JSON 格式必須為合法物件結構');
      }

      let stringifiedFields: Record<string, string> = {};
      let parsedItems: LineItem[] | undefined = undefined;

      if ('fields' in parsed && typeof parsed.fields === 'object' && parsed.fields !== null) {
        Object.entries(parsed.fields).forEach(([k, v]) => {
          stringifiedFields[k] = String(v ?? '');
        });
        if ('items' in parsed && Array.isArray(parsed.items)) {
          parsedItems = parsed.items.map((it: any, idx: number) => ({
            id: it.id || `item_imported_${idx}`,
            name: String(it.name || ''),
            spec: String(it.spec || ''),
            unit: String(it.unit || '式'),
            qty: Number(it.qty) || 1,
            price: Number(it.price) || 0
          }));
        }
      } else {
        Object.entries(parsed).forEach(([k, v]) => {
          if (k !== 'items') {
            stringifiedFields[k] = String(v ?? '');
          }
        });
      }

      onApplyJson(stringifiedFields, parsedItems);
      setSuccessMsg('已成功套用 JSON 資料至表單與明細項目！');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (e: any) {
      setErrorMsg(`JSON 解析失敗：${e.message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
      setErrorMsg(null);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              表單資料暫存與 JSON 匯出/匯入
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            您可以將當前填寫的數值與明細表格項目下載為 JSON 備份檔，或貼上既有的 JSON 資料進行批次套用：
          </p>

          <textarea
            rows={10}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="w-full p-3 font-mono text-xs bg-slate-900 text-slate-100 rounded-xl outline-none border border-slate-800 focus:border-blue-500 resize-y"
            placeholder="{ ... }"
          />

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-700">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copySuccess ? '已複製' : '複製內容'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>下載 JSON</span>
              </button>

              <label className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>讀取本機 JSON</span>
                <input type="file" accept=".json,application/json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            套用至表單欄位
          </button>
        </div>
      </div>
    </div>
  );
};
