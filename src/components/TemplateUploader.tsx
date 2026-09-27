import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, AlertCircle, X, CheckCircle2 } from 'lucide-react';

interface TemplateUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onFileLoaded: (buffer: ArrayBuffer, fileName: string) => void;
}

export const TemplateUploader: React.FC<TemplateUploaderProps> = ({
  isOpen,
  onClose,
  onFileLoaded
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFile = (file: File) => {
    setErrorMessage(null);

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setErrorMessage('僅支援 .xlsx 格式的 Excel 工作簿檔案，請確認副檔名。');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('檔案過大（超過 25MB），請選擇較小的 Excel 範本。');
      return;
    }

    setSelectedFileName(file.name);
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer || buffer.byteLength === 0) {
          throw new Error('檔案內容為空');
        }
        onFileLoaded(buffer, file.name);
        setIsLoading(false);
        onClose();
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(`載入 Excel 失敗：${err.message || '檔案格式可能損毀'}`);
      }
    };

    reader.onerror = () => {
      setIsLoading(false);
      setErrorMessage('讀取檔案時發生錯誤，請重新嘗試。');
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              上傳自訂 Excel 範本
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            系統將全自動掃描工作簿所有儲存格中的
            <code className="mx-1 px-1.5 py-0.5 bg-slate-100 text-blue-700 rounded font-mono text-[11px]">
              {'{{變數名稱 | 預設值}}'}
            </code>
            語法，並保留原有範本的圖片、樣式與公式。
          </p>

          {/* Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/70'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleProcessFile(e.target.files[0]);
                }
              }}
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
            />

            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-3">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            </div>

            <p className="text-sm font-semibold text-slate-800 mb-1">
              點擊選擇檔案，或將 .xlsx 檔案拖曳至此處
            </p>
            <p className="text-xs text-slate-400">
              支援 Microsoft Excel (.xlsx) 檔案，大小上限 25MB
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2.5 text-xs text-blue-700">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
              <span>正在分析 Excel 儲存格與佔位符結構，請稍候...</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            瀏覽本機檔案
          </button>
        </div>
      </div>
    </div>
  );
};
