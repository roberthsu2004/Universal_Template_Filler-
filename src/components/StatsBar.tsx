import React from 'react';
import { LoadedTemplate } from '../types';
import { RotateCcw, Trash2, Search, SlidersHorizontal, Sparkles, FileJson, FileSpreadsheet, Layers, Calculator, Image as ImageIcon } from 'lucide-react';

interface StatsBarProps {
  template: LoadedTemplate | null;
  searchKeyword: string;
  onSearchChange: (val: string) => void;
  filterMode: 'all' | 'unfilled' | 'filled';
  onFilterChange: (mode: 'all' | 'unfilled' | 'filled') => void;
  onResetDefaults: () => void;
  onClearAll: () => void;
  onOpenJsonModal: () => void;
  onOpenHelperModal: () => void;
  onDownloadRawTemplate: () => void;
  filledCount: number;
  totalCount: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  template,
  searchKeyword,
  onSearchChange,
  filterMode,
  onFilterChange,
  onResetDefaults,
  onClearAll,
  onOpenJsonModal,
  onOpenHelperModal,
  onDownloadRawTemplate,
  filledCount,
  totalCount
}) => {
  if (!template) return null;

  const fileSizeKb = (template.sizeBytes / 1024).toFixed(1);
  const percentComplete = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Template Overview Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight truncate">
                  {template.fileName}
                </h1>
                <span className="text-xs text-slate-500 font-medium">
                  ({fileSizeKb} KB)
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-600 font-medium">
                  {template.source === 'preset' ? '系統內建標準範本' : '使用者上傳範本'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                <span>工作表：{template.stats.sheetNames.join(', ')}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{template.stats.uniqueVariables} 項獨立變數</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{template.stats.totalPlaceholders} 處儲存格錨點</span>
                {template.stats.formulaCells > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <Calculator className="w-3 h-3 inline" />
                      <span className="font-mono tabular-nums">{template.stats.formulaCells}</span> 條公式完整保護
                    </span>
                  </>
                )}
                {template.stats.imageCount > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-indigo-700 font-medium flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 inline" />
                      <span className="font-mono tabular-nums">{template.stats.imageCount}</span> 個 Logo 圖層保留
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Helper Links */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
            <button
              onClick={onDownloadRawTemplate}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="下載原始含有佔位符語法的 Excel 範本檔"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>下載原始範本檔</span>
            </button>
            <button
              onClick={onOpenHelperModal}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>佔位符語法小幫手</span>
            </button>
            <button
              onClick={onOpenJsonModal}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileJson className="w-3.5 h-3.5 text-blue-600" />
              <span>資料暫存 / JSON 備份</span>
            </button>
          </div>
        </div>

        {/* Toolbar & Progress Bar Row */}
        <div className="pt-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search & Filter Controls */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <div className="relative min-w-[220px] max-w-xs flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="搜尋變數名稱或預設值..."
                value={searchKeyword}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg outline-none transition-colors"
              />
              {searchKeyword && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter segmented controls */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200/60">
              <button
                onClick={() => onFilterChange('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                全部 ({totalCount})
              </button>
              <button
                onClick={() => onFilterChange('filled')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  filterMode === 'filled'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                已填寫 ({filledCount})
              </button>
              <button
                onClick={() => onFilterChange('unfilled')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  filterMode === 'unfilled'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                未填寫 ({totalCount - filledCount})
              </button>
            </div>
          </div>

          {/* Reset / Clear / Progress */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-medium">填寫進度</span>
              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>
              <span className="font-mono tabular-nums text-slate-700 font-semibold">{percentComplete}%</span>
            </div>

            <div className="h-4 w-px bg-slate-200" aria-hidden="true" />

            <button
              onClick={onResetDefaults}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="將所有變數還原回範本所定義的原始預設值"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重設預設值</span>
            </button>

            <button
              onClick={onClearAll}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="清空所有欄位數值"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>清空欄位</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
