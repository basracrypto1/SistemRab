import { useState, useMemo } from "react";
import { Plus, Trash2, Search, Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RABItem } from "@/lib/types";
import { formatIDR } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface RABTableProps {
  items: RABItem[];
  paguHarian: number;
  onItemsChange: (items: RABItem[]) => void;
}

export function RABTable({ items, paguHarian, onItemsChange }: RABTableProps) {
  const addItem = () => {
    const newItem: RABItem = {
      id: crypto.randomUUID(),
      uraian: "",
      qty: 0,
      satuan: "",
      harga: 0,
      keterangan: ""
    };
    onItemsChange([...items, newItem]);
  };

  const removeItem = (id: string) => {
    onItemsChange(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof RABItem, value: any) => {
    onItemsChange(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const total = useMemo(() => {
    return (items || []).reduce((acc, item) => acc + (item.qty * item.harga), 0);
  }, [items]);

  const sisa = paguHarian - total;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="classic-excel-header print:hidden">RAB BAHAN BAKU HARIAN</div>
        <table className="classic-excel-table min-w-[800px]">
          <thead>
            <tr>
              <th className="w-10">NO</th>
              <th>URAIAN</th>
              <th className="w-20">QTY</th>
              <th className="w-24">SATUAN</th>
              <th className="w-36">HARGA</th>
              <th className="w-40">JUMLAH</th>
              <th className="hidden sm:table-cell">KETERANGAN</th>
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
                      placeholder="Uraian bahan..." 
                      value={item.uraian} 
                      onChange={(e) => updateItem(item.id, 'uraian', e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      className="w-full bg-transparent px-1 outline-none uppercase text-xs"
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
                        value={item.harga} 
                        onChange={(e) => updateItem(item.id, 'harga', parseFloat(e.target.value) || 0)}
                        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                        className="w-full bg-transparent text-right outline-none"
                      />
                    </div>
                  </td>
                  <td className="font-mono text-right bg-secondary/5 font-bold">
                    <div className="flex justify-between px-1">
                      <span>Rp.</span>
                      <span>{(item.qty * item.harga).toLocaleString('id-ID')}</span>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell">
                    <input 
                      type="text"
                      autoComplete="off"
                      placeholder="Catatan..." 
                      value={item.keterangan} 
                      onChange={(e) => updateItem(item.id, 'keterangan', e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      className="w-full bg-transparent px-1 text-xs outline-none"
                    />
                  </td>
                  <td className="p-1 text-center border-none bg-transparent print:hidden">
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
              <td className="hidden sm:table-cell"></td>
              <td className="border-none bg-transparent print:hidden"></td>
            </tr>
            <tr>
              <td colSpan={5} className="text-center font-bold uppercase">Pagu Harga Belanja Harian</td>
              <td className="text-right font-mono font-bold">
                <div className="flex justify-between px-1">
                  <span>Rp.</span>
                  <span>{paguHarian.toLocaleString('id-ID')}</span>
                </div>
              </td>
              <td className="hidden sm:table-cell"></td>
              <td className="border-none bg-transparent print:hidden"></td>
            </tr>
            <tr>
              <td colSpan={5} className="text-center font-bold uppercase">Sisa</td>
              <td className="text-right font-mono font-bold">
                <div className="flex justify-between px-1">
                  <span>Rp.</span>
                  <span>{sisa.toLocaleString('id-ID')}</span>
                </div>
              </td>
              <td className="hidden sm:table-cell"></td>
              <td className="border-none bg-transparent print:hidden"></td>
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
        <Button 
          type="button"
          variant="ghost" 
          size="sm" 
          className="rounded-lg gap-2 text-xs font-semibold text-muted-foreground"
        >
          <Search size={14} />
          Cari Bahan
        </Button>
      </div>
    </div>
  );
}
