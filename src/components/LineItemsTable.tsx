import React from 'react';
import { LineItem } from '../types';
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Calculator,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

interface LineItemsTableProps {
  items: LineItem[];
  onChangeItems: (items: LineItem[]) => void;
  onResetDefaultItems: () => void;
  taxRate?: number; // 預設 0.05
}

export const LineItemsTable: React.FC<LineItemsTableProps> = ({
  items,
  onChangeItems,
  onResetDefaultItems,
  taxRate = 0.05
}) => {
  const handleAddItem = () => {
    const newItem: LineItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: '',
      spec: '',
      unit: '式',
      qty: 1,
      price: 0
    };
    onChangeItems([...items, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof LineItem, value: any) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          [field]: field === 'qty' || field === 'price' ? Number(value) || 0 : value
        };
      }
      return item;
    });
    onChangeItems(updated);
  };

  const handleDeleteItem = (id: string) => {
    if (items.length <= 1) {
      // 若只剩一筆，清空內容或保留一筆空白
      const updated = items.map((it) => (it.id === id ? { ...it, name: '', spec: '', qty: 1, price: 0 } : it));
      onChangeItems(updated);
      return;
    }
    onChangeItems(items.filter((item) => item.id !== id));
  };

  const handleDuplicateItem = (index: number) => {
    const target = items[index];
    const cloned: LineItem = {
      ...target,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: `${target.name} (複製)`
    };
    const newItems = [...items];
    newItems.splice(index + 1, 0, cloned);
    onChangeItems(newItems);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    const temp = newItems[index - 1];
    newItems[index - 1] = newItems[index];
    newItems[index] = temp;
    onChangeItems(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    const temp = newItems[index + 1];
    newItems[index + 1] = newItems[index];
    newItems[index] = temp;
    onChangeItems(newItems);
  };

  // 計算小計與稅額
  const subtotal = items.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.price) || 0), 0);
  const tax = Math.round(subtotal * taxRate);
  const grandTotal = subtotal + tax;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Header Bar */}
      <div className="px-6 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-400" />
              <span>明細項目表格 (Line Items)</span>
            </h2>
            <span className="text-xs text-blue-200 font-mono tabular-nums bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
              共 {items.length} 項
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            可自由新增或刪除項目（支援單項或多項），匯出時系統將自動動態調整 Excel 列數與計算公式
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onResetDefaultItems}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            title="還原為原始範本預設項目"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>還原預設明細</span>
          </button>

          <button
            type="button"
            onClick={handleAddItem}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>新增項目</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-3 text-center w-12">#</th>
              <th className="py-3 px-3 min-w-[180px]">項目名稱 <span className="text-rose-500">*</span></th>
              <th className="py-3 px-3 min-w-[200px]">規格說明 / 交付項目</th>
              <th className="py-3 px-2 text-center w-20">單位</th>
              <th className="py-3 px-3 text-right w-24">數量</th>
              <th className="py-3 px-3 text-right w-32">單價 (TWD)</th>
              <th className="py-3 px-3 text-right w-36">金額 (TWD)</th>
              <th className="py-3 px-3 text-center w-28">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="max-w-xs mx-auto">
                    <p className="mb-3 text-sm">目前無任何項目明細</p>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>新增第一筆項目</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const itemTotal = (Number(item.qty) || 0) * (Number(item.price) || 0);
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50/20 transition-colors group"
                  >
                    {/* Index */}
                    <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-400 font-semibold">
                      {String(index + 1).padStart(2, '0')}
                    </td>

                    {/* Item Name */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                        placeholder="請輸入項目名稱 (例如：資安檢測...)"
                        className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-200 focus:border-blue-500 rounded-md outline-none transition-colors font-medium"
                      />
                    </td>

                    {/* Specification / Description */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={item.spec}
                        onChange={(e) => handleUpdateItem(item.id, 'spec', e.target.value)}
                        placeholder="規格說明或交付內容..."
                        className="w-full px-2.5 py-1.5 text-xs text-slate-700 bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-200 focus:border-blue-500 rounded-md outline-none transition-colors"
                      />
                    </td>

                    {/* Unit */}
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                        placeholder="式"
                        className="w-16 text-center px-1.5 py-1.5 text-xs text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-200 focus:border-blue-500 rounded-md outline-none transition-colors"
                      />
                    </td>

                    {/* Quantity */}
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.qty === 0 ? '' : item.qty}
                        onChange={(e) => handleUpdateItem(item.id, 'qty', e.target.value)}
                        placeholder="1"
                        className="w-20 text-right px-2 py-1.5 text-xs font-mono tabular-nums text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-200 focus:border-blue-500 rounded-md outline-none transition-colors font-semibold"
                      />
                    </td>

                    {/* Unit Price */}
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.price === 0 ? '' : item.price}
                        onChange={(e) => handleUpdateItem(item.id, 'price', e.target.value)}
                        placeholder="0"
                        className="w-28 text-right px-2 py-1.5 text-xs font-mono tabular-nums text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-200 focus:border-blue-500 rounded-md outline-none transition-colors font-semibold"
                      />
                    </td>

                    {/* Row Total (Calculated) */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-800">
                      {formatCurrency(itemTotal)}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded cursor-pointer"
                          title="上移"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === items.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded cursor-pointer"
                          title="下移"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateItem(index)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                          title="複製項目"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title={items.length <= 1 ? '清空此項' : '刪除此項目'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer: Subtotal / Tax / Grand Total */}
      <div className="border-t border-slate-200 bg-slate-50/70 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              匯出時 Excel 會套用原生公式 <code className="font-mono text-slate-700">=SUM(...)</code> 與 <code className="font-mono text-slate-700">=E*F</code> 自動計算
            </span>
          </div>

          <div className="flex flex-col items-end gap-1.5 text-xs text-slate-600 shrink-0">
            <div className="flex items-center justify-between w-64">
              <span>小計 (未稅 Subtotal)：</span>
              <span className="font-mono tabular-nums font-semibold text-slate-800">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between w-64 text-slate-500">
              <span>營業稅 (VAT 5%)：</span>
              <span className="font-mono tabular-nums font-medium text-slate-700">
                {formatCurrency(tax)}
              </span>
            </div>
            <div className="flex items-center justify-between w-64 pt-1.5 border-t border-slate-200 text-sm font-bold text-blue-900">
              <span>總計金額 (含稅 Grand Total)：</span>
              <span className="font-mono tabular-nums text-base text-blue-700">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
