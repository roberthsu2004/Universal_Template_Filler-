import ExcelJS from 'exceljs';
import { LoadedTemplate, PlaceholderOccurrence, TemplateVariable, WorkbookStats, LineItem } from '../types';

export const PLACEHOLDER_REGEX = /\{\{\s*([^\|\}]+?)(?:\s*\|\s*([^\{\}]+?))?\s*\}\}/g;

/**
 * 判斷變數是否為動態明細項目表格之欄位
 */
export function isLineItemKey(key: string): boolean {
  return /^項目[一二三四五六七八九十0-9]+_/.test(key) ||
    /^(item|items)[0-9]*_/i.test(key) ||
    key.includes('項目名稱') && key !== '請款項目';
}

/**
 * 智慧判斷是否應該使用多行文字框 (Textarea)
 */
export function isMultilineField(key: string, defaultValue: string): boolean {
  if (defaultValue.includes('\n') || defaultValue.length > 35) return true;
  const multilineKeywords = ['條款', '備註', '說明', '地址', '規格', '內容', '帳戶資訊', '項目說明', '摘要', '簽約說明'];
  return multilineKeywords.some(kw => key.includes(kw));
}

/**
 * 依據變數名稱分類群組
 */
export function categorizeVariable(key: string): string {
  if (isLineItemKey(key)) {
    return '明細項目清單';
  }
  if (key.includes('公司') || key.includes('地址') || key.includes('電話') || key.includes('信箱') || key.includes('統編') && !key.includes('客戶') && !key.includes('受款')) {
    return '發布單位 / 基本資訊';
  }
  if (key.includes('客戶') || key.includes('受款') || key.includes('對象')) {
    return '對象與客戶資訊';
  }
  if (key.includes('單號') || key.includes('日期') || key.includes('期限') || key.includes('合約') || key.includes('發票')) {
    return '單據與日期設定';
  }
  if (key.includes('付款') || key.includes('銀行') || key.includes('帳號') || key.includes('戶名') || key.includes('帳戶')) {
    return '款項與帳戶資訊';
  }
  if (key.includes('備註') || key.includes('條款') || key.includes('簽') || key.includes('人') || key.includes('主管') || key.includes('會計')) {
    return '條款備註與簽核';
  }
  return '一般欄位';
}

/**
 * 從掃描到的變數中抽取預設的 LineItem 項目清單
 */
export function extractLineItemsFromVariables(variables: TemplateVariable[]): LineItem[] {
  const itemKeys = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '1', '2', '3', '4', '5'];
  const extracted: LineItem[] = [];

  itemKeys.forEach((keyNum, idx) => {
    const nameVar = variables.find(v => v.key === `項目${keyNum}_名稱`);
    const specVar = variables.find(v => v.key === `項目${keyNum}_規格`);
    const qtyVar = variables.find(v => v.key === `項目${keyNum}_數量`);
    const priceVar = variables.find(v => v.key === `項目${keyNum}_單價`);

    if (nameVar || priceVar) {
      extracted.push({
        id: `init_item_${idx + 1}`,
        name: nameVar?.defaultValue || `項目 ${idx + 1}`,
        spec: specVar?.defaultValue || '',
        unit: '式',
        qty: Number(qtyVar?.defaultValue) || 1,
        price: Number(priceVar?.defaultValue) || 0
      });
    }
  });

  if (extracted.length === 0) {
    // 預設示範項目
    return [
      {
        id: 'init_item_1',
        name: '雲端系統建置服務',
        spec: '基礎架構規劃與環境高可用性配置',
        unit: '式',
        qty: 1,
        price: 120000
      }
    ];
  }

  return extracted;
}

/**
 * 解析 Excel ArrayBuffer 並抽取所有佔位符
 */
export async function parseExcelTemplate(
  buffer: ArrayBuffer,
  fileName: string,
  source: 'preset' | 'custom'
): Promise<{ template: LoadedTemplate; variables: TemplateVariable[]; lineItems: LineItem[] }> {
  const wb = new ExcelJS.Workbook();
  const bufferCopy = buffer.slice(0);
  await wb.xlsx.load(bufferCopy);

  const occurrencesMap = new Map<string, { defaultValue: string; occurrences: PlaceholderOccurrence[] }>();
  let formulaCount = 0;
  let imageCount = 0;
  let hasItemTable = false;
  const sheetNames: string[] = [];

  wb.eachSheet((worksheet) => {
    sheetNames.push(worksheet.name);

    try {
      const images = worksheet.getImages();
      if (images && images.length) {
        imageCount += images.length;
      }
    } catch {
      // 容錯
    }

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const rowTxt = JSON.stringify(row.values || '');
      if (rowTxt.includes('項目名稱') && (rowTxt.includes('項次') || rowTxt.includes('單價') || rowTxt.includes('金額'))) {
        hasItemTable = true;
      }

      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        if (cell.formula || (cell.value && typeof cell.value === 'object' && 'formula' in cell.value)) {
          formulaCount++;
          return;
        }

        const cellText = extractCellText(cell.value);
        if (!cellText) return;

        const regex = new RegExp(PLACEHOLDER_REGEX.source, 'g');
        let match: RegExpExecArray | null;
        while ((match = regex.exec(cellText)) !== null) {
          const rawMatch = match[0];
          const key = match[1].trim();
          const defVal = match[2] ? match[2].trim() : '';

          if (isLineItemKey(key)) {
            hasItemTable = true;
          }

          if (!occurrencesMap.has(key)) {
            occurrencesMap.set(key, {
              defaultValue: defVal,
              occurrences: []
            });
          }

          const entry = occurrencesMap.get(key)!;
          if (!entry.defaultValue && defVal) {
            entry.defaultValue = defVal;
          }

          entry.occurrences.push({
            sheetName: worksheet.name,
            cellAddress: cell.address || `${getColLetter(colNumber)}${rowNumber}`,
            row: rowNumber,
            col: colNumber,
            rawMatch
          });
        }
      });
    });
  });

  const variables: TemplateVariable[] = Array.from(occurrencesMap.entries()).map(([key, data]) => {
    const isLineItem = isLineItemKey(key);
    return {
      key,
      defaultValue: data.defaultValue,
      currentValue: data.defaultValue,
      isMultiline: isMultilineField(key, data.defaultValue),
      occurrences: data.occurrences,
      group: categorizeVariable(key),
      isLineItemField: isLineItem
    };
  });

  const lineItems = extractLineItemsFromVariables(variables);

  const stats: WorkbookStats = {
    sheetCount: sheetNames.length,
    totalPlaceholders: variables.reduce((sum, v) => sum + v.occurrences.length, 0),
    uniqueVariables: variables.length,
    formulaCells: formulaCount,
    imageCount,
    sheetNames
  };

  const template: LoadedTemplate = {
    name: fileName.replace(/\.xlsx$/i, ''),
    fileName,
    source,
    buffer,
    sizeBytes: buffer.byteLength,
    loadedAt: new Date(),
    stats,
    hasItemTable
  };

  return { template, variables, lineItems };
}

function getColLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = '';
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter || 'A';
}

function extractCellText(value: ExcelJS.CellValue): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return '';
  if (typeof value === 'object') {
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map(rt => rt.text || '').join('');
    }
  }
  return '';
}

function processReplacement(
  originalStr: string,
  valuesMap: Record<string, string>
): { result: string | number; hasReplaced: boolean } {
  const trimmed = originalStr.trim();
  const singlePlaceholderRegex = /^\{\{\s*([^\|\}]+?)(?:\s*\|\s*([^\{\}]+?))?\s*\}\}$/;
  const singleMatch = trimmed.match(singlePlaceholderRegex);

  if (singleMatch) {
    const key = singleMatch[1].trim();
    const fallbackDef = singleMatch[2] ? singleMatch[2].trim() : '';
    const val = valuesMap[key] !== undefined ? valuesMap[key] : fallbackDef;

    const isCleanNumber = val !== '' &&
      !isNaN(Number(val)) &&
      !val.includes(' ') &&
      !val.includes('\n') &&
      !(val.length > 1 && val.startsWith('0') && !val.startsWith('0.'));

    if (isCleanNumber) {
      return { result: Number(val), hasReplaced: true };
    }
    return { result: val, hasReplaced: true };
  }

  let hasReplaced = false;
  const replaced = originalStr.replace(new RegExp(PLACEHOLDER_REGEX.source, 'g'), (_match, key, defVal) => {
    hasReplaced = true;
    const cleanKey = key.trim();
    if (valuesMap[cleanKey] !== undefined) {
      return valuesMap[cleanKey];
    }
    return defVal !== undefined ? defVal.trim() : '';
  });

  return { result: replaced, hasReplaced };
}

/**
 * 將使用者填寫數值及動態明細表格注入原始範本，產生填寫後的 Excel 檔案
 */
export async function generateFilledExcel(
  templateBuffer: ArrayBuffer,
  valuesMap: Record<string, string>,
  lineItems?: LineItem[]
): Promise<ArrayBuffer> {
  const exportWb = new ExcelJS.Workbook();
  await exportWb.xlsx.load(templateBuffer.slice(0));

  // 1. 動態處理項目明細表格 (若有提供 lineItems 且工作表中有項目明細區塊)
  if (lineItems && lineItems.length > 0) {
    let targetSheet: ExcelJS.Worksheet | null = null;
    let headerRowNumber = -1;
    let firstItemRowNumber = -1;

    exportWb.eachSheet((ws) => {
      if (targetSheet) return;
      ws.eachRow((row, rowNumber) => {
        if (headerRowNumber !== -1) return;
        const txts = row.values ? JSON.stringify(row.values) : '';
        if (txts.includes('項目名稱') && (txts.includes('項次') || txts.includes('單價') || txts.includes('金額'))) {
          headerRowNumber = rowNumber;
          firstItemRowNumber = rowNumber + 1;
          targetSheet = ws;
        }
      });
    });

    if (targetSheet && headerRowNumber > 0 && firstItemRowNumber > 0) {
      const ws = targetSheet as ExcelJS.Worksheet;
      let subtotalRowNumber = -1;

      // 尋找明細結束後的「小計」或「營業稅」列
      for (let r = firstItemRowNumber; r <= ws.rowCount + 5; r++) {
        const row = ws.getRow(r);
        const rowTxt = JSON.stringify(row.values || '');
        if (rowTxt.includes('小計') || rowTxt.includes('營業稅') || rowTxt.includes('總計')) {
          subtotalRowNumber = r;
          break;
        }
      }

      if (subtotalRowNumber > firstItemRowNumber) {
        const originalItemRowCount = subtotalRowNumber - firstItemRowNumber;
        const newCount = lineItems.length;

        // 複製範本原本儲存格樣式
        const sampleRow = ws.getRow(firstItemRowNumber);
        const colStyles: any[] = [];
        for (let c = 1; c <= 7; c++) {
          const cell = sampleRow.getCell(c);
          colStyles.push({
            font: cell.font ? { ...cell.font } : undefined,
            border: cell.border ? { ...cell.border } : undefined,
            alignment: cell.alignment ? { ...cell.alignment } : undefined,
            numFmt: cell.numFmt
          });
        }

        // 動態調整列數：縮減或擴充
        if (newCount < originalItemRowCount) {
          const diff = originalItemRowCount - newCount;
          ws.spliceRows(firstItemRowNumber + newCount, diff);
        } else if (newCount > originalItemRowCount) {
          const diff = newCount - originalItemRowCount;
          for (let i = 0; i < diff; i++) {
            ws.spliceRows(firstItemRowNumber + originalItemRowCount + i, 0, []);
          }
        }

        // 逐一寫入每筆項目
        let calculatedSubtotal = 0;
        lineItems.forEach((item, idx) => {
          const r = firstItemRowNumber + idx;
          const row = ws.getRow(r);
          row.height = 24;

          const qty = Number(item.qty) || 0;
          const price = Number(item.price) || 0;
          const itemTotal = qty * price;
          calculatedSubtotal += itemTotal;

          row.getCell(1).value = idx + 1;
          row.getCell(2).value = item.name;
          row.getCell(3).value = item.spec;
          row.getCell(4).value = item.unit || '式';
          row.getCell(5).value = qty;
          row.getCell(6).value = price;
          row.getCell(7).value = { formula: `=E${r}*F${r}`, result: itemTotal };

          for (let c = 1; c <= 7; c++) {
            const cell = row.getCell(c);
            const st = colStyles[c - 1];
            if (st) {
              if (st.font) cell.font = st.font;
              if (st.border) cell.border = st.border;
              if (st.alignment) cell.alignment = st.alignment;
              if (st.numFmt) cell.numFmt = st.numFmt;
            }
          }
        });

        // 重新連結小計與稅率公式
        const lastItemRow = firstItemRowNumber + newCount - 1;
        const newSubtotalRow = lastItemRow + 1;
        const newTaxRow = newSubtotalRow + 1;
        const newTotalRow = newTaxRow + 1;

        const calculatedTax = Math.round(calculatedSubtotal * 0.05);
        const calculatedGrandTotal = calculatedSubtotal + calculatedTax;

        const subtotalCell = ws.getCell(`G${newSubtotalRow}`);
        if (subtotalCell) {
          subtotalCell.value = {
            formula: `=SUM(G${firstItemRowNumber}:G${lastItemRow})`,
            result: calculatedSubtotal
          };
          subtotalCell.numFmt = '#,##0';
        }

        const taxCell = ws.getCell(`G${newTaxRow}`);
        if (taxCell) {
          taxCell.value = {
            formula: `=ROUND(G${newSubtotalRow}*0.05, 0)`,
            result: calculatedTax
          };
          taxCell.numFmt = '#,##0';
        }

        const totalCell = ws.getCell(`G${newTotalRow}`);
        if (totalCell) {
          totalCell.value = {
            formula: `=G${newSubtotalRow}+G${newTaxRow}`,
            result: calculatedGrandTotal
          };
          totalCell.numFmt = '#,##0';
        }
      }
    }
  }

  // 2. 替換工作簿其餘文字佔位符（非表格儲存格）
  exportWb.eachSheet((worksheet) => {
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        if (cell.formula || (cell.value && typeof cell.value === 'object' && 'formula' in cell.value)) {
          return;
        }

        if (typeof cell.value === 'string') {
          const { result, hasReplaced } = processReplacement(cell.value, valuesMap);
          if (hasReplaced) {
            cell.value = result;
          }
          return;
        }

        if (cell.value && typeof cell.value === 'object' && 'richText' in cell.value && Array.isArray((cell.value as any).richText)) {
          const rtList = (cell.value as any).richText;
          let changed = false;
          rtList.forEach((item: any) => {
            if (item && typeof item.text === 'string') {
              const { result, hasReplaced } = processReplacement(item.text, valuesMap);
              if (hasReplaced) {
                item.text = String(result);
                changed = true;
              }
            }
          });
          if (changed) {
            cell.value = { richText: rtList };
          }
        }
      });
    });
  });

  const outputBuffer = await exportWb.xlsx.writeBuffer();
  return outputBuffer as ArrayBuffer;
}
