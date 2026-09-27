export interface PlaceholderOccurrence {
  sheetName: string;
  cellAddress: string;
  row: number;
  col: number;
  rawMatch: string;
}

export interface TemplateVariable {
  key: string;
  defaultValue: string;
  currentValue: string;
  isMultiline: boolean;
  occurrences: PlaceholderOccurrence[];
  group?: string;
  isLineItemField?: boolean; // 標記是否屬於項目表格欄位
}

export interface LineItem {
  id: string;
  name: string;
  spec: string;
  unit: string;
  qty: number;
  price: number;
}

export interface WorkbookStats {
  sheetCount: number;
  totalPlaceholders: number;
  uniqueVariables: number;
  formulaCells: number;
  imageCount: number;
  sheetNames: string[];
}

export interface LoadedTemplate {
  name: string;
  fileName: string;
  source: 'preset' | 'custom';
  buffer: ArrayBuffer;
  sizeBytes: number;
  loadedAt: Date;
  stats: WorkbookStats;
  hasItemTable?: boolean;
}
