// @ts-nocheck
// Convert the same report tables into a real XLSX workbook, preserving numeric
// cells and merged headings instead of renaming HTML to .xls.
export async function downloadReportWorkbook(html: string, filename: string): Promise<void> {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'EVN PoleInspector';
  const sheet = workbook.addWorksheet('Dự toán toàn tuyến', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  sheet.columns = Array.from({ length: 17 }, (_, i) => ({ width: i === 1 ? 42 : i === 2 ? 22 : 17 }));
  const doc = new DOMParser().parseFromString(html, 'text/html');
  let rowNumber = 1;
  for (const element of doc.querySelectorAll('.title, .subtitle, .section-header, .kpi-box, table')) {
    if (element.tagName !== 'TABLE') {
      sheet.mergeCells(rowNumber, 1, rowNumber, 17);
      const cell = sheet.getCell(rowNumber, 1);
      cell.value = element.textContent?.trim() ?? '';
      cell.font = { name: 'Arial', bold: true, size: element.classList.contains('title') ? 16 : 11, color: { argb: 'FF0F172A' } };
      cell.alignment = { vertical: 'middle', wrapText: true };
      sheet.getRow(rowNumber++).height = 32;
      continue;
    }
    const occupied = new Set<string>();
    const startRow = rowNumber;
    const rows = Array.from(element.querySelectorAll('tr'));
    for (const [rowIndex, tr] of rows.entries()) {
      const targetRow = startRow + rowIndex;
      let column = 1;
      for (const td of tr.querySelectorAll(':scope > th, :scope > td')) {
        while (occupied.has(`${targetRow}:${column}`)) column++;
        const colspan = Math.max(1, Number(td.getAttribute('colspan')) || 1);
        const rowspan = Math.max(1, Number(td.getAttribute('rowspan')) || 1);
        const cell = sheet.getCell(targetRow, column);
        const text = (td.textContent ?? '').replace(/\s+/g, ' ').trim();
        const isNumber = td.classList.contains('num') || td.classList.contains('dec');
        cell.value = isNumber && text !== '' && Number.isFinite(Number(text)) ? Number(text) : text;
        cell.numFmt = td.classList.contains('dec') ? '#,##0.00' : '#,##0';
        const header = td.tagName === 'TH';
        cell.font = { name: 'Arial', size: 10, bold: header || td.classList.contains('bold') || tr.classList.contains('bold'), color: { argb: header ? 'FFFFFFFF' : 'FF0F172A' } };
        cell.alignment = { wrapText: true, vertical: 'middle', horizontal: isNumber ? 'right' : 'left' };
        cell.border = Object.fromEntries(['top', 'left', 'bottom', 'right'].map(side => [side, { style: 'thin', color: { argb: 'FFCBD5E1' } }]));
        if (header || tr.classList.contains('bg-gray')) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: header ? 'FF0F172A' : 'FFF1F5F9' } };
        for (let r = targetRow; r < targetRow + rowspan; r++) {
          for (let c = column; c < column + colspan; c++) occupied.add(`${r}:${c}`);
        }
        if (rowspan > 1 || colspan > 1) sheet.mergeCells(targetRow, column, targetRow + rowspan - 1, column + colspan - 1);
        column += colspan;
      }
      sheet.getRow(targetRow).height = rowIndex === 0 ? 42 : 34;
    }
    rowNumber += rows.length + 2;
  }
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
