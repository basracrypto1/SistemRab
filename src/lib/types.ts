export interface RABItem {
  id: string;
  uraian: string;
  qty: number;
  satuan: string;
  harga: number;
  keterangan: string;
}

export interface RekapItem {
  id: string;
  sekolah: string;
  klaster: string;
  jumlahSiswa: number;
  paguHarga: number;
  keterangan?: string;
}

export interface RABRecord {
  id: string;
  type: 'bahan-baku' | 'rekap-sekolah' | 'operasional-harian';
  namaSPPG: string;
  namaYayasan: string;
  hari: string;
  tanggal: string;
  menuMakanan?: string;
  items: RABItem[];
  rekapItems?: RekapItem[];
  paguHarian?: number;
  total: number;
  logoUrl?: string;
  createdAt: number;
}

export interface Stats {
  totalPengeluaran: number;
  totalItems: number;
  totalRecords: number;
  monthlyData: { month: string; amount: number }[];
}
