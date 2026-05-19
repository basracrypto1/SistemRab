import { RABRecord } from './types';

const RAW_DATA_SHEET_NAME = 'RAW_DATA_STORAGE';
const CONFIG_KEY = 'google_sheets_db_id';
const DEFAULT_SPREADSHEET_ID = '1kGF7VExdSb8PNM9JAmI3330Vp8LTajHOw7C8e-qf0QI';

const MONTHS_ID = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
];

export const getSpreadsheetId = () => {
  const savedId = localStorage.getItem(CONFIG_KEY);
  if (savedId === '1rXhoLNI70CWlF9kyuH7JZeLMJGKo2_muQqWERCh-5rI') {
    // Clean up old default if it exists
    localStorage.removeItem(CONFIG_KEY);
    return DEFAULT_SPREADSHEET_ID;
  }
  return savedId && savedId !== 'null' ? savedId : DEFAULT_SPREADSHEET_ID;
};
export const setSpreadsheetId = (id: string) => localStorage.setItem(CONFIG_KEY, id);

const getIndonesianDateName = (dateStr: string) => {
  // Assuming dateStr is DD/MM/YYYY
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  const day = parts[0];
  const month = parseInt(parts[1]) - 1;
  return `${day} ${MONTHS_ID[month] || parts[1]}`;
};

export async function initSheetsDatabase(accessToken: string): Promise<string> {
  const spreadsheetId = getSpreadsheetId();
  
  // Check if spreadsheet is accessible and if RAW_DATA_STORAGE exists
  try {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.ok) {
      const data = await response.json();
      const hasRawSheet = data.sheets.some((s: any) => s.properties.title === RAW_DATA_SHEET_NAME);
      
      if (!hasRawSheet) {
        // Create the Raw Data Sheet if it doesn't exist in the provided spreadsheet
        const addSheetResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{ addSheet: { properties: { title: RAW_DATA_SHEET_NAME } } }]
          }),
        });

        if (!addSheetResponse.ok) {
          const errorData = await addSheetResponse.json();
          throw new Error(`Failed to create RAW_DATA_STORAGE: ${errorData.error?.message || addSheetResponse.statusText}`);
        }

        // Initialize headers
        const headers = [
          'id', 'type', 'namaSPPG', 'namaYayasan', 'hari', 'tanggal', 
          'menuMakanan', 'items', 'rekapItems', 'paguHarian', 'total', 
          'logoUrl', 'createdAt'
        ];

        const headerResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${RAW_DATA_SHEET_NAME}!A1:M1?valueInputOption=RAW`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: [headers] }),
        });

        if (!headerResponse.ok) {
           const errorData = await headerResponse.json();
           throw new Error(`Failed to initialize headers: ${errorData.error?.message || headerResponse.statusText}`);
        }
      }
      return spreadsheetId;
    } else {
      const errorData = await response.json();
      throw new Error(`Cloud Access Error: ${errorData.error?.message || response.statusText}`);
    }
  } catch (e: any) {
    console.error('Error checking spreadsheet', e);
    throw e;
  }

  // Fallback: If for some reason we can't access the provided ID, 
  // and it's not the default ID, we might have a problem. 
  // But for this user request, we stick to their ID.
  return spreadsheetId;
}

export async function saveRecordToSheets(accessToken: string, record: RABRecord): Promise<void> {
  const spreadsheetId = await initSheetsDatabase(accessToken);
  
  // 1. Save to Raw Data for App History (Always Append to keep history)
  const row = [
    record.id, record.type, record.namaSPPG, record.namaYayasan, record.hari, record.tanggal,
    record.menuMakanan || '', JSON.stringify(record.items), JSON.stringify(record.rekapItems || []),
    record.paguHarian || 0, record.total, record.logoUrl || '', record.createdAt
  ];

  const appendRawRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${RAW_DATA_SHEET_NAME}!A1:append?valueInputOption=RAW`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [row] }),
  });
  if (!appendRawRes.ok) {
    const errorData = await appendRawRes.json();
    throw new Error(`Append raw error: ${errorData.error?.message || appendRawRes.statusText}`);
  }

  // 2. Create/Update Formatted Report Sheet
  const typeDisplay = record.type === 'bahan-baku' ? 'RAB' : (record.type === 'rekap-sekolah' ? 'REKAP' : 'OPS');
  const timestamp = new Date().getTime().toString().slice(-4);
  const sheetTitle = `${typeDisplay} - ${getIndonesianDateName(record.tanggal)} (${timestamp})`;
  
  // Get spreadsheet details to check if sheet exists
  const ssResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const ssData = await ssResponse.json();
  let sheet = ssData.sheets.find((s: any) => s.properties.title === sheetTitle);
  let sheetId: number;

  if (!sheet) {
    const addSheetRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{ addSheet: { properties: { title: sheetTitle } } }]
      }),
    });
    const addSheetData = await addSheetRes.json();
    sheetId = addSheetData.replies[0].addSheet.properties.sheetId;
  } else {
    sheetId = sheet.properties.sheetId;
    // Clear existing content to refresh (though with timestamp it's unlikely to exist)
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetTitle}!A1:G500:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  // BUILD THE REPORT GRID (Values only first)
  const getDisplayTitle = (type: string) => {
    switch (type) {
      case 'rekap-sekolah': return 'REKAPITULASI SEKOLAH';
      case 'operasional-harian': return 'OPERASIONAL HARIAN';
      default: return 'RENCANA ANGGARAN BELANJA (RAB) BAHAN BAKU HARIAN';
    }
  };

  const rows: any[][] = [
    [getDisplayTitle(record.type)],
    [record.namaSPPG],
    [record.namaYayasan],
    [`HARI : ${(record.hari || '').toUpperCase()}, ${record.tanggal}`],
  ];

  if (record.type === 'bahan-baku') {
    rows.push([`MENU : ${(record.menuMakanan || '').toUpperCase()}`]);
  }

  const tableHeaderRowIdx = rows.length;
  const headerLabels = record.type === 'rekap-sekolah' 
    ? ['NO', 'TANGGAL / SEKOLAH', 'KLASTER', 'JUMLAH SISWA', 'PAGU HARGA', 'JUMLAH', '']
    : ['NO', 'URAIAN', 'QTY', 'SATUAN', 'HARGA', 'JUMLAH', 'KETERANGAN'];
  rows.push(headerLabels);

  const items = record.type === 'rekap-sekolah' ? (record.rekapItems || []) : record.items;
  let computedTotal = 0;
  
  items.forEach((item: any, index: number) => {
    if (record.type === 'rekap-sekolah') {
      const lineTotal = (item.jumlahSiswa || 0) * (item.paguHarga || 0);
      computedTotal += lineTotal;
      rows.push([
        index + 1, (item.sekolah || '').toUpperCase(), (item.klaster || '').toUpperCase(),
        item.jumlahSiswa, item.paguHarga, lineTotal, (item.keterangan || '').toUpperCase()
      ]);
    } else {
      const lineTotal = (item.qty || 0) * (item.harga || 0);
      computedTotal += lineTotal;
      rows.push([
        index + 1, (item.uraian || '').toUpperCase(), item.qty, (item.satuan || '').toUpperCase(),
        item.harga, lineTotal, (item.keterangan || '').toUpperCase()
      ]);
    }
  });

  const footerStartIdx = rows.length;
  if (record.type === 'rekap-sekolah' || record.type === 'operasional-harian') {
    rows.push(['TOTAL', '', '', '', '', computedTotal, '']);
  } else {
    rows.push(['TOTAL', '', '', '', '', computedTotal, '']);
    rows.push(['PAGU HARGA BELANJA HARIAN', '', '', '', '', record.paguHarian || 0, '']);
    rows.push(['SISA', '', '', '', '', (record.paguHarian || 0) - computedTotal, '']);
  }

  // Update Values
  const valuesRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetTitle}!A1?valueInputOption=RAW`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: rows }),
  });

  if (!valuesRes.ok) {
    const errorData = await valuesRes.json();
    throw new Error(`Failed to save report values: ${errorData.error?.message || valuesRes.statusText}`);
  }

  // STYLE THE SHEET (Batch Update)
  const BLUE_COLOR = { red: 0.65, green: 0.85, blue: 0.97 };
  const requests: any[] = [
    // Column Widths
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 50 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 }, properties: { pixelSize: 250 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 2, endIndex: 4 }, properties: { pixelSize: 80 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 4, endIndex: 6 }, properties: { pixelSize: 150 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 6, endIndex: 7 }, properties: { pixelSize: 150 }, fields: 'pixelSize' } },
    
    // Headers Merging
    { mergeCells: { range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 7 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 7 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: 7 }, mergeType: 'MERGE_ALL' } },
    { mergeCells: { range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 0, endColumnIndex: 7 }, mergeType: 'MERGE_ALL' } },
  ];

  if (record.type === 'bahan-baku') {
    requests.push({ mergeCells: { range: { sheetId, startRowIndex: 4, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: 7 }, mergeType: 'MERGE_ALL' } });
  }

  // Footer Merging
  for (let i = footerStartIdx; i < rows.length; i++) {
    requests.push({ mergeCells: { range: { sheetId, startRowIndex: i, endRowIndex: i+1, startColumnIndex: 0, endColumnIndex: 5 }, mergeType: 'MERGE_ALL' } });
  }

  // Base Styling (Alignment & Fonts & Colors)
  requests.push({
    repeatCell: {
      range: { sheetId, startRowIndex: 0, endRowIndex: rows.length, startColumnIndex: 0, endColumnIndex: 7 },
      cell: { userEnteredFormat: { textFormat: { fontSize: 10, fontFamily: 'Times New Roman' }, verticalAlignment: 'MIDDLE' } },
      fields: 'userEnteredFormat(textFormat,verticalAlignment)'
    }
  });

  // Apply Big Blue Headers (Rows 1-3)
  requests.push({
    repeatCell: {
      range: { sheetId, startRowIndex: 0, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: 7 },
      cell: { userEnteredFormat: { 
        backgroundColor: BLUE_COLOR, 
        horizontalAlignment: 'CENTER',
        textFormat: { bold: true, fontSize: 12, fontFamily: 'Times New Roman' } 
      }},
      fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,textFormat)'
    }
  });

  // Apply Table Header styling
  requests.push({
    repeatCell: {
      range: { sheetId, startRowIndex: tableHeaderRowIdx, endRowIndex: tableHeaderRowIdx + 1, startColumnIndex: 0, endColumnIndex: 7 },
      cell: { userEnteredFormat: { backgroundColor: BLUE_COLOR, horizontalAlignment: 'CENTER', textFormat: { bold: true, fontFamily: 'Times New Roman' } }},
      fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,textFormat)'
    }
  });

  // Apply Footer styling
  requests.push({
    repeatCell: {
      range: { sheetId, startRowIndex: footerStartIdx, endRowIndex: rows.length, startColumnIndex: 0, endColumnIndex: 7 },
      cell: { userEnteredFormat: { backgroundColor: BLUE_COLOR, textFormat: { bold: true, fontFamily: 'Times New Roman' } }},
      fields: 'userEnteredFormat(backgroundColor,textFormat)'
    }
  });

  // Borders for everyone
  requests.push({
    updateBorders: {
      range: { sheetId, startRowIndex: 0, endRowIndex: rows.length, startColumnIndex: 0, endColumnIndex: 7 },
      top: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
      bottom: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
      left: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
      right: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
      innerHorizontal: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
      innerVertical: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
    }
  });

  const batchUpdateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests }),
  });

  if (!batchUpdateRes.ok) {
    const errorData = await batchUpdateRes.json();
    throw new Error(`Failed to apply styling: ${errorData.error?.message || batchUpdateRes.statusText}`);
  }

}

export async function fetchRecordsFromSheets(accessToken: string): Promise<RABRecord[]> {
  const spreadsheetId = await initSheetsDatabase(accessToken);

  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${RAW_DATA_SHEET_NAME}!A2:M1000`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) return [];
  const data = await response.json();
  if (!data.values) return [];

  const rawRecords = data.values.map((row: any[]) => ({
    id: row[0], type: row[1], namaSPPG: row[2], namaYayasan: row[3], hari: row[4], tanggal: row[5],
    menuMakanan: row[6], items: JSON.parse(row[7] || '[]'),
    rekapItems: JSON.parse(row[8] || '[]'),
    paguHarian: parseFloat(row[9] || '0'), total: parseFloat(row[10] || '0'),
    logoUrl: row[11], createdAt: parseInt(row[12] || '0')
  }));

  // Filter to keep only the latest version of each record by ID
  const uniqueRecords: Record<string, RABRecord> = {};
  rawRecords.forEach((rec: RABRecord) => {
    uniqueRecords[rec.id] = rec; // Overwrites previous versions, keeping the one further down the sheet
  });

  return Object.values(uniqueRecords).sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteRecordFromSheets(accessToken: string, id: string): Promise<void> {
  const spreadsheetId = await initSheetsDatabase(accessToken);
  const records = await fetchRecordsFromSheets(accessToken);
  const index = records.findIndex(r => r.id === id);
  if (index === -1) return;

  const rowNumber = index + 2;
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${RAW_DATA_SHEET_NAME}!A${rowNumber}:M${rowNumber}:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
