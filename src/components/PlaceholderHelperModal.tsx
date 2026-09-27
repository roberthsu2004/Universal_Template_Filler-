import React, { useState } from 'react';
import { Sparkles, Copy, Check, X, FileSpreadsheet, Code2 } from 'lucide-react';

interface PlaceholderHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlaceholderHelperModal: React.FC<PlaceholderHelperModalProps> = ({
  isOpen,
  onClose
}) => {
  const [varName, setVarName] = useState('客戶名稱');
  const [defVal, setDefVal] = useState('台灣智匯數位科技');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generatedSyntax = defVal.trim()
    ? `{{${varName.trim()} | ${defVal.trim()}}}`
    : `{{${varName.trim()}}}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const samplePresets = [
    { name: '報價單號', val: 'QT-2026-001' },
    { name: '項目單價', val: '120000' },
    { name: '備註條款', val: '1. 本報價單自發布日起30天內有效。\n2. 匯款手續費由買方負擔。' },
    { name: '統一編號', val: '83294102' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">
              佔位符語法生成器與範本製作指南
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Syntax Generator Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              快速生成語法（請貼入 Excel 儲存格）：
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <span className="text-[11px] text-slate-500 font-medium">變數名稱 (Key)</span>
                <input
                  type="text"
                  value={varName}
                  onChange={(e) => setVarName(e.target.value)}
                  placeholder="例如：客戶聯絡人"
                  className="mt-1 w-full px-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-sans"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium">預設值 (Default Value)</span>
                <input
                  type="text"
                  value={defVal}
                  onChange={(e) => setDefVal(e.target.value)}
                  placeholder="例如：張經理"
                  className="mt-1 w-full px-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-sans"
                />
              </div>
            </div>

            {/* Generated Output */}
            <div className="flex items-center justify-between p-3 bg-slate-900 text-white rounded-lg gap-2">
              <code className="text-xs font-mono text-emerald-400 font-semibold select-all break-all">
                {generatedSyntax}
              </code>
              <button
                onClick={() => handleCopy(generatedSyntax)}
                className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '已複製' : '複製語法'}</span>
              </button>
            </div>
          </div>

          {/* Quick Preset Samples */}
          <div>
            <span className="text-xs font-semibold text-slate-700 block mb-2">常用語法範例：</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {samplePresets.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setVarName(item.name);
                    setDefVal(item.val);
                  }}
                  className="p-2.5 text-left border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 rounded-lg transition-all text-xs group cursor-pointer"
                >
                  <div className="font-medium text-slate-800 group-hover:text-blue-600">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                    {`{{${item.name} | ${item.val}}}`}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* How it works rule list */}
          <div className="text-xs text-slate-600 space-y-2 border-t border-slate-100 pt-4">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>Excel 範本製作原則：</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-500">
              <li>
                <strong>語法規則</strong>：使用 <code className="font-mono text-slate-700">{'{{變數名稱 | 預設值}}'}</code>，中間以豎線 <code className="font-mono text-slate-700">|</code> 分隔。
              </li>
              <li>
                <strong>純數字支援</strong>：若儲存格為單一變數且填入數字，匯出時將自動寫入數值型態，完美配合公式運算（例如 <code className="font-mono text-slate-700">=E17*F17</code>）。
              </li>
              <li>
                <strong>Logo 圖片與公式</strong>：原始 Excel 中的所有計算公式、圖層與頁首頁尾皆會完整保留。
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
