import { useState, useEffect, useCallback } from 'react';
import { RABRecord, Stats } from '../lib/types';
import { fetchRecordsFromSheets, saveRecordToSheets, deleteRecordFromSheets } from '../lib/sheets';

const STORAGE_KEY = 'rab_bahan_baku_records';

export function useRABStore(accessToken?: string | null) {
  const [records, setRecords] = useState<RABRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setRecords(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse records', e);
      }
    } else {
      // First time load with dummy data
      const dummyRecords: RABRecord[] = [
        {
          id: 'dummy-1',
          type: 'bahan-baku',
          namaSPPG: 'SPPG BANGKALAN KAMAL 3',
          namaYayasan: 'YAYASAN HARAPAN TUNAS SEMESTA',
          hari: 'Senin',
          tanggal: '18/05/2026',
          menuMakanan: 'Nasi Kuning Lengkap + Ayam Goreng',
          paguHarian: 20396000,
          total: 1250000,
          createdAt: Date.now() - 86400000 * 2,
          items: [
            { id: '1', uraian: 'Beras Ramos', qty: 25, satuan: 'kg', harga: 15000, keterangan: 'Kualitas Super' },
            { id: '2', uraian: 'Ayam Potong', qty: 10, satuan: 'kg', harga: 45000, keterangan: 'Segar' },
            { id: '3', uraian: 'Minyak Goreng', qty: 5, satuan: 'liter', harga: 18000, keterangan: 'Bimoli' },
            { id: '4', uraian: 'Tempe & Tahu', qty: 10, satuan: 'papan', harga: 12000, keterangan: '' },
            { id: '5', uraian: 'Sayur Mayur (Lengkap)', qty: 1, satuan: 'paket', harga: 200000, keterangan: 'Pasar Induk' },
          ]
        },
        {
          id: 'dummy-2',
          type: 'bahan-baku',
          namaSPPG: 'SPPG BANGKALAN KAMAL 3',
          namaYayasan: 'YAYASAN HARAPAN TUNAS SEMESTA',
          hari: 'Selasa',
          tanggal: '19/05/2026',
          menuMakanan: 'Nasi Putih + Daging Rendang + Nangka',
          paguHarian: 20396000,
          total: 2100000,
          createdAt: Date.now() - 86400000,
          items: [
            { id: '1', uraian: 'Beras Ramos', qty: 25, satuan: 'kg', harga: 15000, keterangan: '' },
            { id: '2', uraian: 'Daging Sapi', qty: 8, satuan: 'kg', harga: 140000, keterangan: 'Bagian Paha' },
            { id: '3', uraian: 'Santan Kelapa', qty: 10, satuan: 'butir', harga: 8000, keterangan: 'Parut' },
            { id: '4', uraian: 'Bumbu Rendang', qty: 1, satuan: 'paket', harga: 150000, keterangan: 'Komplit' },
            { id: '5', uraian: 'Nangka Muda', qty: 5, satuan: 'kg', harga: 20000, keterangan: '' },
          ]
        },
        {
          id: 'dummy-3',
          type: 'operasional-harian',
          namaSPPG: 'SPPG BANGKALAN KAMAL 3',
          namaYayasan: 'YAYASAN HARAPAN TUNAS SEMESTA',
          hari: 'Senin',
          tanggal: '18/05/2026',
          total: 11014000,
          createdAt: Date.now() - 43200000,
          items: [
            { id: 'o1', uraian: 'Upah Relawan', qty: 1, satuan: '-', harga: 5230000, keterangan: '-' },
            { id: 'o2', uraian: 'insentif kader POSYANDU', qty: 1, satuan: '-', harga: 351000, keterangan: '-' },
            { id: 'o3', uraian: 'Gas', qty: 10, satuan: '-', harga: 240000, keterangan: '-' },
            { id: 'o4', uraian: 'bensin', qty: 2, satuan: '-', harga: 150000, keterangan: '-' },
            { id: 'o5', uraian: 'Galon', qty: 25, satuan: '-', harga: 20000, keterangan: '-' },
            { id: 'o6', uraian: 'Sabun Cuci Piring (1.5)', qty: 10, satuan: '-', harga: 21000, keterangan: '-' },
          ]
        }
      ];
      setRecords(dummyRecords);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dummyRecords));
    }
  }, []);

  const syncFromCloud = useCallback(async () => {
    if (!accessToken) return;
    setIsSyncing(true);
    setSyncStatus('syncing');
    try {
      const cloudRecords = await fetchRecordsFromSheets(accessToken);
      setRecords(cloudRecords);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudRecords));
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (e) {
      console.error('Failed to sync from cloud', e);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      syncFromCloud();
    }
  }, [accessToken, syncFromCloud]);

  const saveRecord = async (record: RABRecord) => {
    const newRecords = [...records];
    const index = newRecords.findIndex(r => r.id === record.id);
    
    if (index >= 0) {
      newRecords[index] = record;
    } else {
      newRecords.push(record);
    }

    setRecords(newRecords);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));

    if (accessToken) {
      setSyncStatus('syncing');
      try {
        await saveRecordToSheets(accessToken, record);
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 3000);
      } catch (e) {
        setSyncStatus('error');
        console.error('Failed to save to cloud', e);
        throw e; // Rethrow to handle in UI
      }
    }
    return newRecords;
  };

  const deleteRecord = async (id: string) => {
    const newRecords = records.filter(r => r.id !== id);
    setRecords(newRecords);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));

    if (accessToken) {
      try {
        await deleteRecordFromSheets(accessToken, id);
      } catch (e) {
        console.error('Failed to delete from cloud', e);
      }
    }
  };

  const getStats = (): Stats => {
    const safeRecords = records || [];
    const totalPengeluaran = safeRecords.reduce((acc, r) => acc + (r.total || 0), 0);
    const totalItems = safeRecords.reduce((acc, r) => acc + (r.items?.length || 0) + (r.rekapItems?.length || 0), 0);
    
    // Group by month for chart
    const monthlyGroups: Record<string, number> = {};
    safeRecords.forEach(r => {
      const date = new Date(r.createdAt);
      const monthYear = date.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
      monthlyGroups[monthYear] = (monthlyGroups[monthYear] || 0) + (r.total || 0);
    });

    const monthlyData = Object.entries(monthlyGroups).map(([month, amount]) => ({
      month,
      amount
    }));

    return {
      totalPengeluaran,
      totalItems,
      totalRecords: records.length,
      monthlyData
    };
  };

  return {
    records,
    saveRecord,
    deleteRecord,
    getStats,
    isSyncing,
    syncStatus
  };
}
