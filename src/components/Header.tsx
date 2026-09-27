import React from 'react';
import { FileSpreadsheet, Download, UploadCloud, RefreshCw } from 'lucide-react';

interface HeaderProps {
  currentTemplateName: string;
  onSelectPreset: (presetPath: string, presetName: string) => void;
  onOpenUploadModal: () => void;
  onExport: () => void;
  isExporting: boolean;
  activePreset: string | null;
  quotePresetPath: string;
  invoicePresetPath: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTemplateName,
  onSelectPreset,
  onOpenUploadModal,
  onExport,
  isExporting,
  activePreset,
  quotePresetPath,
  invoicePresetPath
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-inner">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
              Universal Template Filler
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline whitespace-nowrap">
              免伺服器 · 零 API Key · 純前端 Excel 佔位符單據引擎
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links / Template Selectors */}
        <nav className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60 overflow-x-auto max-w-xl">
          <button
            onClick={() => onSelectPreset(quotePresetPath, '商務報價單範本')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activePreset === quotePresetPath
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <span>📄</span>
            <span>商務報價單範本</span>
          </button>

          <button
            onClick={() => onSelectPreset(invoicePresetPath, '商業請款單範本')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activePreset === invoicePresetPath
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <span>📑</span>
            <span>商業請款單範本</span>
          </button>

          <button
            onClick={onOpenUploadModal}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activePreset === 'custom'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>自訂範本上傳</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onExport}
            disabled={isExporting}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
            title="將目前填寫數值寫回 Excel 並匯出下載"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>正在產生 XLSX...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>📥 匯出並下載 XLSX</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
