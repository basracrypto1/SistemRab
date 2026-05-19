import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RABTable } from "./RABTable";
import { RABRecord, RABItem } from "@/lib/types";
import { FileDown, Save, Share2, Upload, Trash2, History, Sparkles } from "lucide-react";
import { exportToExcel } from "@/lib/export-excel";
import { toast } from "sonner";
import { motion } from "motion/react";
import { HistoryTable } from "../dashboard/HistoryTable";

interface RABEditorProps {
  initialData?: RABRecord;
  onSave: (record: RABRecord, silent?: boolean) => void;
  onDelete: (id: string) => void;
  records: RABRecord[];
  onEdit: (record: RABRecord) => void;
  onDuplicate: (record: RABRecord) => void;
}

export function RABEditor({ initialData, onSave, onDelete, records, onEdit, onDuplicate }: RABEditorProps) {
  const [record, setRecord] = useState<RABRecord>(initialData || {
    id: crypto.randomUUID(),
    type: 'bahan-baku',
    namaSPPG: "SPPG BANGKALAN KAMAL 3",
    namaYayasan: "YAYASAN HARAPAN TUNAS SEMESTA",
    hari: new Date().toLocaleDateString('id-ID', { weekday: 'long' }),
    tanggal: new Date().toLocaleDateString('id-ID'),
    menuMakanan: "",
    items: [],
    paguHarian: 20396000,
    total: 0,
    createdAt: Date.now()
  });

  useEffect(() => {
    if (initialData) {
      setRecord(initialData);
    }
  }, [initialData]);

  const [isSaving, setIsSaving] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);

  const handleAIGenerate = async () => {
    if (!record.menuMakanan) {
      toast.error("Mohon isi Menu Makanan terlebih dahulu sebagai panduan AI");
      return;
    }

    setIsAILoading(true);
    try {
      const response = await fetch("/api/gemini/generate-rab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          menu: record.menuMakanan,
          budget: record.paguHarian
        }),
      });

      if (!response.ok) throw new Error("Gagal memanggil AI");
      
      const suggestedItems = await response.json();
      
      const newItems: RABItem[] = suggestedItems.map((item: any) => ({
        id: crypto.randomUUID(),
        uraian: item.uraian,
        qty: item.qty,
        satuan: item.satuan,
        harga: item.harga,
        keterangan: item.keterangan || "Saran AI"
      }));

      setRecord(prev => ({
        ...prev,
        items: [...prev.items, ...newItems]
      }));
      
      toast.success(`Berhasil menambahkan ${newItems.length} item saran AI`);
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghubungkan ke RAB AI");
    } finally {
      setIsAILoading(false);
    }
  };

  const totalDisplay = (record.items || []).reduce((acc, item) => acc + (item.qty * item.harga), 0);

  const handleSave = () => {
    if (!record.namaSPPG || !record.menuMakanan) {
      toast.error("Mohon isi Identitas dan Menu Makanan");
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      onSave({ ...record, total: totalDisplay });
      setIsSaving(false);
      toast.success("RAB Berhasil disimpan");
    }, 500);
  };

  const handleExportExcel = () => {
    exportToExcel(record);
    onSave({ ...record, total: totalDisplay }, true);
    toast.success("Excel Berhasil di-export & Tersimpan di Cloud");
  };

  return (
    <div className="space-y-8 pb-20 print:p-0 print:space-y-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 md:p-6 rounded-2xl border shadow-sm ring-1 ring-border print:hidden">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-black text-foreground tracking-tight flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <FileDown size={20} />
            </div>
            Bahan Baku Harian
          </h2>
          <p className="text-sm text-muted-foreground font-medium mt-1">Pengelolaan belanja dapur harian.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white border-none shadow-md overflow-hidden print:shadow-none print:border print:border-black">
          <div className="print:block hidden">
            <div className="classic-excel-header">Rencana anggaran belanja (RAB) bahan baku harian</div>
            <div className="classic-excel-subheader">{record.namaSPPG}</div>
            <div className="classic-excel-subheader">{record.namaYayasan}</div>
            <div className="classic-excel-info-row">Hari : {record.hari}, {record.tanggal}</div>
            <div className="classic-excel-info-row underline">Menu : {record.menuMakanan}</div>
          </div>

          <div className="p-4 border-b bg-secondary/30 grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
            <div className="space-y-1">
              <Label htmlFor="namaSPPG" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nama SPPG</Label>
              <input 
                id="namaSPPG" 
                autoComplete="off"
                placeholder="Nama SPPG..." 
                value={record.namaSPPG}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                className="luxury-input w-full"
                onChange={(e) => setRecord({ ...record, namaSPPG: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="namaYayasan" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nama Yayasan</Label>
              <input 
                id="namaYayasan" 
                autoComplete="off"
                placeholder="Nama Yayasan..." 
                value={record.namaYayasan}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                className="luxury-input w-full"
                onChange={(e) => setRecord({ ...record, namaYayasan: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tanggal" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hari / Tanggal</Label>
              <div className="flex gap-2">
                 <input 
                  id="hari" 
                  autoComplete="off"
                  value={record.hari}
                  onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                  className="luxury-input w-24"
                  onChange={(e) => setRecord({ ...record, hari: e.target.value })}
                />
                <input 
                  id="tanggal" 
                  autoComplete="off"
                  value={record.tanggal}
                  onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                  className="luxury-input flex-1"
                  onChange={(e) => setRecord({ ...record, tanggal: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="paguHarian" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pagu harga belanja harian</Label>
              <div className="flex items-center gap-1 luxury-input-wrapper focus-within:ring-1 focus-within:ring-primary pl-2 h-10">
                <span className="text-muted-foreground text-xs font-mono">Rp.</span>
                <input 
                  id="paguHarian" 
                  type="number"
                  autoComplete="off"
                  value={record.paguHarian || 0}
                  onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                  className="luxury-input border-none focus:ring-0 w-full font-mono font-bold"
                  onChange={(e) => setRecord({ ...record, paguHarian: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="md:col-span-4 space-y-1">
              <Label htmlFor="menu" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Menu Makanan Utama</Label>
              <textarea 
                id="menu" 
                autoComplete="off"
                placeholder="Nasi Goreng, Ayam Bakar, dll..." 
                value={record.menuMakanan}
                className="luxury-input w-full h-16 resize-none"
                onChange={(e) => setRecord({ ...record, menuMakanan: e.target.value })}
              />
            </div>
          </div>
          
          <div className="p-6">
            <RABTable items={record.items} paguHarian={record.paguHarian || 0} onItemsChange={(items) => setRecord({ ...record, items })} />
          </div>
          <div className="p-4 border-t bg-secondary/10 flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-2 sm:gap-4">
                <Button 
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={isAILoading}
                  variant="outline" 
                  size="sm" 
                  className="bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700 text-[9px] sm:text-[10px] uppercase font-bold tracking-widest px-2 sm:px-3 gap-1.5"
                >
                  <Sparkles size={12} className={isAILoading ? "animate-pulse" : ""} />
                  {isAILoading ? "Menganalisa..." : "RAB AI Assistant"}
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest px-2 sm:px-3"
                >
                  Template menu
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest px-2 sm:px-3"
                >
                  Upload logo
                </Button>
             </div>
             <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
                <div className="text-center sm:text-right">
                   <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest block">Subtotal belanja</span>
                   <span className="text-xl font-bold font-mono">{totalDisplay.toLocaleString('id-ID')}</span>
                </div>
                 <div className="flex gap-2 w-full sm:w-auto">
                   <Button 
                     type="button"
                     onClick={handleExportExcel} 
                     className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-10 px-4 sm:px-6 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20"
                   >
                      <FileDown size={16} /> Excel
                   </Button>
                   <Button 
                     type="button"
                     onClick={handleSave} 
                     className="flex-1 sm:flex-initial bg-slate-900 border-none hover:bg-slate-800 text-white gap-2 h-10 px-4 sm:px-6 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-slate-900/20" 
                     disabled={isSaving}
                   >
                      <Save size={16} /> {isSaving ? "Saving..." : "Simpan"}
                   </Button>
                </div>
             </div>
          </div>
        </div>
      </div>

      <HistoryTable 
        records={records} 
        type="bahan-baku" 
        onEdit={onEdit} 
        onDelete={onDelete} 
        onDuplicate={onDuplicate}
        title="Riwayat Bahan Baku Harian"
        description="Daftar RAB bahan baku yang telah disimpan sebelumnya."
      />
    </div>
  );
}
