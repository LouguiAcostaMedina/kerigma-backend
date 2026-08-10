import type { Response } from 'express';
import * as XLSX from 'xlsx';

export interface ExcelSheet {
  name: string;
  rows: Record<string, unknown>[];
}

export function parseExcelBuffer(buffer: Buffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return [];
  }
  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
}

export function buildExcelBuffer(sheets: ExcelSheet[]): Buffer {
  const workbook = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const data = sheet.rows.length > 0 ? sheet.rows : [{ Información: 'Sin datos para exportar' }];
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  }
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

export function sendExcelResponse(res: Response, buffer: Buffer, filename: string): void {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(buffer);
}
