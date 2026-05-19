import ExcelJS from 'exceljs';
import { RABRecord } from './types';

export const exportToExcel = async (record: RABRecord) => {
  const workbook = new ExcelJS.Workbook();
  
  const toSentenceCase = (text: any) => {
    if (typeof text !== 'string' || !text) return text || '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const getDisplayTitle = (type: string) => {
    switch (type) {
      case 'rekap-sekolah': return 'REKAPITULASI SEKOLAH';
      case 'operasional-harian': return 'OPERASIONAL HARIAN';
      case 'bahan-baku': return 'RENCANA ANGGARAN BELANJA (RAB) BAHAN BAKU HARIAN';
      default: return 'RENCANA ANGGARAN BELANJA (RAB)';
    }
  };

  const getSheetName = (type: string) => {
    switch (type) {
      case 'rekap-sekolah': return 'Rekap';
      case 'operasional-harian': return 'Operasional';
      case 'bahan-baku': return 'RAB';
      default: return 'Record';
    }
  };

  const sheetName = getSheetName(record.type);
  const worksheet = workbook.addWorksheet(sheetName, {
    pageSetup: { 
      orientation: 'landscape', 
      fitToPage: true, 
      fitToWidth: 1, 
      fitToHeight: 0, // auto
      paperSize: 9 // A4
    }
  });

  const BLUE_COLOR = 'FFA6D9F7';
  const BORDER_STYLE: Partial<ExcelJS.Borders> = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };

  // Define Columns
  worksheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'Uraian', key: 'uraian', width: 35 },
    { header: 'Qty', key: 'qty', width: 10 },
    { header: 'Satuan', key: 'satuan', width: 15 },
    { header: 'Harga', key: 'harga', width: 22 },
    { header: 'Jumlah', key: 'jumlah', width: 22 },
    { header: 'Keterangan', key: 'keterangan', width: 25 },
  ];

  // 1. Header Rows
  const titleRow = worksheet.getRow(1);
  titleRow.getCell(1).value = getDisplayTitle(record.type);
  worksheet.mergeCells('A1:G1');
  
  const sppgRow = worksheet.getRow(2);
  sppgRow.getCell(1).value = record.namaSPPG;
  worksheet.mergeCells('A2:G2');

  const yayasanRow = worksheet.getRow(3);
  yayasanRow.getCell(1).value = record.namaYayasan;
  worksheet.mergeCells('A3:G3');

  // Styling Headers
  [1, 2, 3].forEach(rowNum => {
    const row = worksheet.getRow(rowNum);
    row.height = 25;
    row.getCell(1).font = { bold: true, size: 14 };
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE_COLOR } };
    row.getCell(1).border = BORDER_STYLE;
  });

  // 2. Info Rows
  const hariRow = worksheet.getRow(4);
  hariRow.getCell(1).value = `HARI : ${(record.hari || '').toUpperCase()}, ${record.tanggal}`;
  worksheet.mergeCells('A4:G4');
  hariRow.getCell(1).alignment = { horizontal: 'center' };
  hariRow.getCell(1).font = { bold: true };
  hariRow.getCell(1).border = BORDER_STYLE;

  if (record.type === 'bahan-baku' || !record.type) {
    const menuRow = worksheet.getRow(5);
    menuRow.getCell(1).value = `MENU : ${(record.menuMakanan || '').toUpperCase()}`;
    worksheet.mergeCells('A5:G5');
    menuRow.getCell(1).alignment = { horizontal: 'center' };
    menuRow.getCell(1).font = { bold: true, italic: true };
    menuRow.getCell(1).border = BORDER_STYLE;
  }

  // 3. Table Header
  const startRow = record.type === 'rekap-sekolah' ? 5 : (record.type === 'operasional-harian' ? 5 : 6);
  const headerRow = worksheet.getRow(startRow);
  
  const headerLabels = record.type === 'rekap-sekolah' 
    ? ['NO', 'TANGGAL / SEKOLAH', 'KLASTER', 'JUMLAH SISWA', 'PAGU HARGA', 'JUMLAH', '']
    : ['NO', 'URAIAN', 'QTY', 'SATUAN', 'HARGA', 'JUMLAH', 'KETERANGAN'];

  headerRow.values = headerLabels;
  
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE_COLOR } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDER_STYLE;
  });

  // 4. Data Rows
  let currentRow = startRow + 1;
  const items = record.type === 'rekap-sekolah' ? (record.rekapItems || []) : record.items;
  let computedTotal = 0;

  items.forEach((item: any, index: number) => {
    const row = worksheet.getRow(currentRow);
    if (record.type === 'rekap-sekolah') {
      const lineTotal = (item.jumlahSiswa || 0) * (item.paguHarga || 0);
      computedTotal += lineTotal;
      row.values = [
        index + 1,
        (item.sekolah || '').toUpperCase(),
        (item.klaster || '').toUpperCase(),
        item.jumlahSiswa,
        item.paguHarga,
        lineTotal,
        (item.keterangan || '').toUpperCase()
      ];
    } else {
      const lineTotal = (item.qty || 0) * (item.harga || 0);
      computedTotal += lineTotal;
      row.values = [
        index + 1,
        (item.uraian || '').toUpperCase(),
        item.qty,
        (item.satuan || '').toUpperCase(),
        item.harga,
        lineTotal,
        (item.keterangan || '').toUpperCase()
      ];
    }
    
    row.eachCell((cell, colNumber) => {
      cell.border = BORDER_STYLE;
      if (colNumber === 1 || colNumber === 3 || colNumber === 4) {
        cell.alignment = { horizontal: 'center' };
      } else if (colNumber === 5 || colNumber === 6) {
        cell.alignment = { horizontal: 'right' };
        cell.numFmt = '_- "Rp"* #,##0_-; (Rp* #,##0); _- "Rp"* "-"_-; _-@_-';
      }
    });
    currentRow++;
  });

  // 5. Footer Rows
  const footerStart = currentRow;
  if (record.type === 'rekap-sekolah' || record.type === 'operasional-harian') {
    const totalRow = worksheet.getRow(footerStart);
    totalRow.getCell(1).value = 'TOTAL';
    worksheet.mergeCells(`A${footerStart}:E${footerStart}`);
    
    totalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE_COLOR } };
    totalRow.getCell(1).font = { bold: true };
    totalRow.getCell(1).alignment = { horizontal: 'center' };
    totalRow.getCell(1).border = BORDER_STYLE;
    
    totalRow.getCell(6).value = computedTotal;
    totalRow.getCell(6).numFmt = '_- "Rp"* #,##0_-';
    totalRow.getCell(6).font = { bold: true };
    totalRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE_COLOR } };
    totalRow.getCell(6).border = BORDER_STYLE;
    totalRow.getCell(6).alignment = { horizontal: 'right' };

    // Empty cell for Keterangan column
    totalRow.getCell(7).value = '';
    totalRow.getCell(7).border = BORDER_STYLE;
    totalRow.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE_COLOR } };
  } else {
    // RAB Default
    const rows = [
      { label: 'TOTAL', value: computedTotal },
      { label: 'PAGU HARGA BELANJA HARIAN', value: record.paguHarian || 0 },
      { label: 'SISA', value: (record.paguHarian || 0) - computedTotal }
    ];

    rows.forEach((r, idx) => {
      const row = worksheet.getRow(footerStart + idx);
      row.getCell(1).value = r.label;
      worksheet.mergeCells(`A${footerStart + idx}:E${footerStart + idx}`);
      
      row.getCell(1).alignment = { horizontal: 'center' };
      row.getCell(1).font = { bold: true };
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE_COLOR } };
      row.getCell(1).border = BORDER_STYLE;

      row.getCell(6).value = r.value;
      row.getCell(6).numFmt = '_- "Rp"* #,##0_-';
      row.getCell(6).font = { bold: true };
      row.getCell(6).border = BORDER_STYLE;
      row.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE_COLOR } };
      row.getCell(6).alignment = { horizontal: 'right' };

      // Empty cell for Keterangan column
      row.getCell(7).value = '';
      row.getCell(7).border = BORDER_STYLE;
      row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE_COLOR } };
    });
  }

  // After all content is added, set Font to Times New Roman for all cells
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      const currentFont = cell.font || {};
      cell.font = { ...currentFont, name: 'Times New Roman' };
    });
  });

  // Generate Buffer and Save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const safeTitle = getDisplayTitle(record.type).replace(/\s+/g, '_');
  anchor.download = `${safeTitle}_${record.tanggal.replace(/\//g, '-')}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

