import React, { useState } from 'react';
import { TemplateVariable } from '../types';
import { RotateCcw, X, MapPin, AlignLeft, Type, Copy, Check } from 'lucide-react';

interface VariableFieldProps {
  variable: TemplateVariable;
  value: string;
  onChange: (key: string, value: string) => void;
  onReset: (key: string) => void;
}

export const VariableField: React.FC<VariableFieldProps> = ({
  variable,
  value,
  onChange,
  onReset
}) => {
  const [copiedLocation, setCopiedLocation] = useState(false);
  const [forceMultiline, setForceMultiline] = useState<boolean | null>(null);

  const isMultiline = forceMultiline !== null ? forceMultiline : variable.isMultiline;
  const isModifiedFromDefault = value !== variable.defaultValue;

  const handleCopyLocation = () => {
    const locText = variable.occurrences.map(o => `${o.sheetName}!${o.cellAddress}`).join(', ');
    navigator.clipboard.writeText(locText);
    setCopiedLocation(true);
    setTimeout(() => setCopiedLocation(false), 1500);
  };

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      value.trim() === ''
        ? 'bg-amber-50/40 border-amber-200'
        : isModifiedFromDefault
          ? 'bg-white border-blue-200 shadow-xs'
          : 'bg-white border-slate-200 hover:border-slate-300'
    }`}>
      {/* Field Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-sm font-semibold text-slate-900 tracking-tight">
              {variable.key}
            </label>
            {isModifiedFromDefault && (
              <span className="text-[11px] font-medium text-blue-700">
                (已編輯)
              </span>
            )}
            {value.trim() === '' && (
              <span className="text-[11px] font-medium text-amber-700">
                (未填寫)
              </span>
            )}
          </div>

          {/* Cell Occurrence locations */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 flex-wrap">
            <button
              onClick={handleCopyLocation}
              title="複製儲存格座標"
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <MapPin className="w-3 h-3 text-slate-400" />
              <span className="font-mono tabular-nums">
                {variable.occurrences.map(o => `${o.cellAddress}`).join(', ')}
              </span>
              {copiedLocation ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-2.5 h-2.5 text-slate-400 opacity-60" />
              )}
            </button>
            <span aria-hidden="true">·</span>
            <span className="text-[11px] text-slate-400">
              共 {variable.occurrences.length} 處儲存格
            </span>
          </div>
        </div>

        {/* Quick action buttons for this field */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setForceMultiline(!isMultiline)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
            title={isMultiline ? '切換為單行輸入' : '切換為多行輸入'}
          >
            {isMultiline ? <Type className="w-3.5 h-3.5" /> : <AlignLeft className="w-3.5 h-3.5" />}
          </button>

          {isModifiedFromDefault && (
            <button
              type="button"
              onClick={() => onReset(variable.key)}
              className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
              title="還原為原始預設值"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {value && (
            <button
              type="button"
              onClick={() => onChange(variable.key, '')}
              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
              title="清空此欄位"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Input or Textarea */}
      <div className="relative">
        {isMultiline ? (
          <textarea
            rows={Math.min(6, Math.max(3, (value.match(/\n/g) || []).length + 2))}
            value={value}
            onChange={(e) => onChange(variable.key, e.target.value)}
            placeholder={variable.defaultValue ? `預設值：${variable.defaultValue}` : '請輸入內容...'}
            className="w-full px-3 py-2 text-sm text-slate-900 bg-slate-50/60 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg outline-none transition-colors font-sans leading-relaxed resize-y"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(variable.key, e.target.value)}
            placeholder={variable.defaultValue ? `預設值：${variable.defaultValue}` : '請輸入內容...'}
            className="w-full px-3 py-2 text-sm text-slate-900 bg-slate-50/60 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg outline-none transition-colors font-sans"
          />
        )}
      </div>

      {/* Field Footer with Default Value & Character Count */}
      <div className="flex items-center justify-between text-xs text-slate-400 mt-2 gap-2 flex-wrap">
        <div className="truncate max-w-[80%]">
          {variable.defaultValue ? (
            <span className="truncate">
              範本預設：
              <button
                type="button"
                onClick={() => onChange(variable.key, variable.defaultValue)}
                className="text-slate-500 hover:text-blue-600 hover:underline transition-colors ml-1 font-mono text-[11px] truncate max-w-xs inline-block align-bottom"
                title="點擊套用此預設值"
              >
                {variable.defaultValue.replace(/\n/g, ' ')}
              </button>
            </span>
          ) : (
            <span className="text-slate-400 italic">無範本預設值</span>
          )}
        </div>

        <span className="font-mono tabular-nums text-[11px] text-slate-400 shrink-0">
          {value.length} 字
        </span>
      </div>
    </div>
  );
};
