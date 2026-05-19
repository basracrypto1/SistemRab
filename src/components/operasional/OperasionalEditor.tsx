import { useState, useEffect } from "react";
import { RABRecord, RABItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save, FileDown } from "lucide-react";
import { OperasionalTable } from "./OperasionalTable";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/export-excel";
import { HistoryTable } from "../dashboard/HistoryTable";

interface OperasionalEditorProps {
  initialData?: RABRecord;
  onSave: (record: RABRecord, silent?: boolean) => void;
  onDelete: (id: string) => void;
  records: RABRecord[];
  onEdit: (record: RABRecord) => void;
  onDuplicate: (record: RABRecord) => void;
}

export function OperasionalEditor({ initialData, onSave, onDelete, records, onEdit, onDuplicate }: OperasionalEditorProps) {
  const [record, setRecord] = useState<RABRecord>(initialData || {
    id: crypto.randomUUID(),
    type: 'operasional-harian',
    namaSPPG: "SPPG BANGKALAN KAMAL 3",
    namaYayasan: "YAYASAN HARAPAN TUNAS SEMESTA",
    hari: new Date().toLocaleDateString('id-ID', { weekday: 'long' }),
    tanggal: new Date().toLocaleDateString('id-ID'),
    items: [],
    total: 0,
    createdAt: Date.now(),
  });

  useEffect(() => {
    if (initialData) {
      setRecord(initialData);
    }
  }, [initialData]);

  const [isSaving, setIsSaving] = useState(false);

  const totalDisplay = (record.items || []).reduce((sum, item) => sum + (item.qty * item.harga), 0);
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({ ...record, total: totalDisplay });
      toast.success("RAB Operasional berhasil disimpan!");
    } catch (error) {
      toast.error("Gagal menyimpan RAB.");
    } finally {
      setIsSaving(false);
    }
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
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-600">
              <FileDown size={20} />
            </div>
            Operasional Harian
          </h2>
          <p className="text-sm text-muted-foreground font-medium mt-1">Pengelolaan operasional dan logistik harian.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white border-none shadow-md overflow-hidden print:shadow-none print:border print:border-black">
          <div className="print:block hidden">
            <div className="classic-excel-header">Operasional harian</div>
            <div className="classic-excel-subheader">{record.namaSPPG}</div>
            <div className="classic-excel-subheader">{record.namaYayasan}</div>
            <div className="classic-excel-info-row">Hari : {record.hari}, {record.tanggal}</div>
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
          </div>
          
          <div className="p-6">
            <OperasionalTable items={record.items} onItemsChange={(items) => setRecord({ ...record, items })} />
          </div>

          <div className="p-4 border-t bg-secondary/10 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
             <div className="flex items-center gap-2 sm:gap-4">
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest px-2 sm:px-3"
                >
                  Template operasional
                </Button>
             </div>
             <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
                <div className="text-center sm:text-right">
                   <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest block">Total anggaran</span>
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
        type="operasional-harian" 
        onEdit={onEdit} 
        onDelete={onDelete} 
        onDuplicate={onDuplicate}
        title="Riwayat Operasional Harian"
        description="Daftar laporan operasional yang telah disimpan sebelumnya."
      />
    </div>
  );
}
