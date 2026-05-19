import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RABItem } from "@/lib/types";
import { formatIDR } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface OperasionalTableProps {
  items: RABItem[];
  onItemsChange: (items: RABItem[]) => void;
}

export function OperasionalTable({ items, onItemsChange }: OperasionalTableProps) {
  const addItem = () => {
    const newItem: RABItem = {
      id: crypto.randomUUID(),
      uraian: "",
      qty: 1,
      satuan: "-",
      harga: 0,
      keterangan: "-"
    };
    onItemsChange([...items, newItem]);
  };

  const removeItem = (id: string) => {
    onItemsChange(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof RABItem, value: any) => {
    onItemsChange(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const total = (items || []).reduce((acc, item) => acc + (item.qty * item.harga), 0);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="classic-excel-header print:hidden">OPERASIONAL HARIAN</div>
        <table className="classic-excel-table min-w-[800px]">
          <thead>
            <tr>
              <th className="w-12">No.</th>
              <th>Uraian</th>
              <th className="w-20">Qty</th>
              <th className="w-24">Satuan</th>
              <th className="w-36 text-right">Harga</th>
              <th className="w-36 text-right">Jumlah</th>
              <th className="w-40">Keterangan</th>
              <th className="w-10 border-none bg-transparent print:hidden"></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              { (items || []).map((item, index) => (
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
                      placeholder="Uraian kegiatan/barang..." 
                      value={item.uraian} 
                      onChange={(e) => updateItem(item.id, 'uraian', e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      className="w-full bg-transparent px-1 outline-none"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      min="0"
                      autoComplete="off"
                      value={item.qty} 
                      onChange={(e) => updateItem(item.id, 'qty', parseFloat(e.target.value) || 0)}
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      className="w-full bg-transparent px-1 text-center outline-none"
                    />
                  </td>
                  <td>
                    <input 
                      type="text"
                      autoComplete="off"
                      placeholder="Satuan" 
                      value={item.satuan} 
                      onChange={(e) => updateItem(item.id, 'satuan', e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      className="w-full bg-transparent px-1 text-center outline-none text-xs"
                    />
                  </td>
                  <td className="font-mono">
                    <div className="flex justify-between px-1">
                      <span>Rp.</span>
                      <input 
                        type="number" 
                        min="0"
                        autoComplete="off"
                        value={item.harga} 
                        onChange={(e) => updateItem(item.id, 'harga', parseFloat(e.target.value) || 0)}
                        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                        className="w-full bg-transparent text-right outline-none"
                      />
                    </div>
                  </td>
                  <td className="font-mono text-right bg-secondary/5">
                    <div className="flex justify-between px-1">
                       <span>Rp.</span>
                       <span className="font-bold">{ (item.qty * item.harga).toLocaleString('id-ID') }</span>
                    </div>
                  </td>
                  <td>
                    <input 
                      type="text"
                      autoComplete="off"
                      placeholder="Catatan..." 
                      value={item.keterangan} 
                      onChange={(e) => updateItem(item.id, 'keterangan', e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      className="w-full bg-transparent px-1 outline-none text-xs"
                    />
                  </td>
                  <td className="border-none bg-transparent text-center">
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
              <td colSpan={5} className="text-center font-bold uppercase">total</td>
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
  );
}
