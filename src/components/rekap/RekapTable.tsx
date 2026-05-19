import { Trash2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/utils";
import { RekapItem } from "@/lib/types";
import { motion, AnimatePresence } from "motion/react";

interface RekapTableProps {
  items: RekapItem[];
  onItemsChange: (items: RekapItem[]) => void;
}

export function RekapTable({ items, onItemsChange }: RekapTableProps) {
  const addItem = () => {
    const newItem: RekapItem = {
      id: crypto.randomUUID(),
      sekolah: "",
      klaster: "",
      jumlahSiswa: 0,
      paguHarga: 0,
    };
    onItemsChange([...items, newItem]);
  };

  const removeItem = (id: string) => {
    onItemsChange(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof RekapItem, value: string | number) => {
    onItemsChange(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const total = (items || []).reduce((sum, item) => sum + (item.jumlahSiswa * item.paguHarga), 0);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="classic-excel-table min-w-[800px]">
          <thead>
            <tr>
              <th className="w-10">NO</th>
              <th>TANGGAL / SEKOLAH</th>
              <th className="w-24">KLASTER</th>
              <th className="w-24">SISWA</th>
              <th className="w-32">PAGU HARGA</th>
              <th className="w-32">JUMLAH</th>
              <th className="w-32">KETERANGAN</th>
              <th className="w-10 border-none bg-transparent"></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {(items || []).map((item, index) => (
                <motion.tr 
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="group"
                >
                  <td className="text-center font-medium">{index + 1}</td>
                  <td>
                    <input 
                      type="text"
                      autoComplete="off"
                      placeholder="Nama Sekolah..." 
                      value={item.sekolah} 
                      onChange={(e) => updateItem(item.id, 'sekolah', e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      className="w-full bg-transparent px-1 outline-none"
                    />
                  </td>
                  <td>
                    <input 
                      type="text"
                      autoComplete="off"
                      placeholder="Klaster..." 
                      value={item.klaster} 
                      onChange={(e) => updateItem(item.id, 'klaster', e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      className="w-full bg-transparent px-1 text-center outline-none"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      min="0"
                      autoComplete="off"
                      value={item.jumlahSiswa} 
                      onChange={(e) => updateItem(item.id, 'jumlahSiswa', parseInt(e.target.value) || 0)}
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      className="w-full bg-transparent px-1 text-center outline-none"
                    />
                  </td>
                  <td className="font-mono">
                    <div className="flex justify-between px-1">
                      <span>Rp.</span>
                      <input 
                        type="number" 
                        min="0"
                        autoComplete="off"
                        value={item.paguHarga} 
                        onChange={(e) => updateItem(item.id, 'paguHarga', parseFloat(e.target.value) || 0)}
                        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                        className="w-full bg-transparent text-right outline-none"
                      />
                    </div>
                  </td>
                  <td className="font-mono text-right bg-secondary/5 font-bold">
                    <div className="flex justify-between px-1">
                       <span>Rp.</span>
                       <span>{(item.jumlahSiswa * item.paguHarga).toLocaleString('id-ID')}</span>
                    </div>
                  </td>
                  <td>
                    <input 
                      type="text"
                      autoComplete="off"
                      placeholder="Catatan..." 
                      value={item.keterangan || ''} 
                      onChange={(e) => updateItem(item.id, 'keterangan', e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      className="w-full bg-transparent px-1 outline-none text-xs"
                    />
                  </td>
                  <td className="p-1 text-center border-none bg-transparent">
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeItem(item.id);
                      }}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className="text-center font-bold">TOTAL</td>
              <td className="text-right font-mono font-bold">
                <div className="flex justify-between px-1">
                  <span>Rp.</span>
                  <span>{total.toLocaleString('id-ID')}</span>
                </div>
              </td>
              <td></td>
              <td className="border-none bg-transparent"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          type="button"
          onClick={addItem} 
          variant="outline" 
          size="sm" 
          className="rounded-lg gap-2 px-4 shadow-sm text-xs font-semibold"
        >
          <Plus size={14} />
          Tambah Baris
        </Button>
      </div>
    </div>
  );
}
