import { motion } from "motion/react";
import { 
  TrendingUp, 
  Package, 
  History, 
  Plus, 
  Calendar as CalendarIcon,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  Copy
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RABRecord, Stats } from "@/lib/types";
import { formatIDR } from "@/lib/utils";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardProps {
  records: RABRecord[];
  stats: Stats;
  onEdit: (record: RABRecord) => void;
  onDelete: (id: string) => void;
  onDuplicate: (record: RABRecord) => void;
  onCreateNew: () => void;
}

export function Dashboard({ records, stats, onEdit, onDelete, onDuplicate, onCreateNew }: DashboardProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-black text-foreground tracking-tight">Ringkasan Operasional</h2>
          <p className="text-muted-foreground font-medium italic opacity-80">"Kelola anggaran dapur dengan presisi dan efisiensi."</p>
        </div>
        <Button 
          type="button"
          onClick={onCreateNew} 
          className="rounded-full px-6 gap-2 shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
        >
          <Plus size={20} />
          Buat RAB Baru
        </Button>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
      >
        <motion.div variants={item}>
          <Card className="card p-4 border-none shadow-sm ring-1 ring-border">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1 block">Total Anggaran</span>
            <span className="text-2xl font-bold text-foreground">{formatIDR(stats.totalPengeluaran)}</span>
            <span className="text-[10px] text-emerald-600 mt-1 font-semibold">+2.4% dari kemarin (simulasi)</span>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="card p-4 border-none shadow-sm ring-1 ring-border">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1 block">Jumlah Item</span>
            <span className="text-2xl font-bold text-foreground">{stats.totalItems} Jenis</span>
            <span className="text-[10px] text-muted-foreground mt-1">Bahan Kering & Basah</span>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="card p-4 border-none shadow-sm ring-1 ring-border">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1 block">Rata-rata / RAB</span>
            <span className="text-2xl font-bold text-foreground">{formatIDR(stats.totalRecords > 0 ? stats.totalPengeluaran / stats.totalRecords : 0)}</span>
            <span className="text-[10px] text-muted-foreground mt-1">Efisiensi: Optimal</span>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="card p-4 border-none shadow-sm ring-1 ring-border">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1 block spirit uppercase">Status Validasi</span>
            <span className="text-2xl font-bold text-emerald-600">Siap Export</span>
            <span className="text-[10px] text-muted-foreground mt-1">Lengkap & Akurat</span>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <Card className="lg:col-span-3 border-none ring-1 ring-border shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display font-bold">
              <TrendingUp size={20} className="text-primary" />
              Tren Pengeluaran
            </CardTitle>
            <CardDescription>Visualisasi pengeluaran bulanan Anda.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.5 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }}
                  tickFormatter={(val) => `Rp${val/1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: 'var(--primary)', opacity: 0.05 }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  formatter={(val: number) => [formatIDR(val), 'Total']}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {stats.monthlyData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={`var(--primary)`} fillOpacity={0.8 - (index * 0.1)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-none ring-1 ring-border shadow-md overflow-hidden">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2 font-display font-bold">
              <History size={20} className="text-primary" />
              Riwayat Terakhir
            </CardTitle>
            <CardDescription>Akses cepat ke RAB sebelumnya.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[350px] overflow-y-auto">
              {records.sort((a,b) => b.createdAt - a.createdAt).map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-110">
                      {record.type === 'rekap-sekolah' 
                        ? <TrendingUp size={18} /> 
                        : record.type === 'operasional-harian'
                        ? <Plus size={18} />
                        : <CalendarIcon size={18} />
                      }
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm line-clamp-1">
                        {record.type === 'rekap-sekolah' 
                          ? `Rekap: ${record.rekapItems?.length || 0} Sekolah` 
                          : record.type === 'operasional-harian'
                          ? `Operasional: ${record.items?.length || 0} Item`
                          : record.menuMakanan}
                      </h4>
                      <p className="text-xs text-muted-foreground">{record.hari}, {record.tanggal}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right hidden sm:block mr-2">
                      <p className="text-sm font-mono font-bold">{formatIDR(record.total)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        {record.type === 'rekap-sekolah' 
                          ? 'Rekapitulasi' 
                          : record.type === 'operasional-harian'
                          ? 'Operasional'
                          : `${record.items?.length || 0} Item`}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(record)} className="gap-2">
                          <Edit size={14} /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(record)} className="gap-2">
                          <Copy size={14} /> Duplikat
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(record.id)} className="text-destructive gap-2">
                          <Trash2 size={14} /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
              {records.length === 0 && (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                   <Package className="opacity-10" size={64} />
                   <p className="text-sm">Belum ada riwayat RAB harian.</p>
                </div>
              )}
            </div>
          </CardContent>
          <div className="p-4 bg-muted/20 border-t flex justify-center">
            <Button 
              type="button"
              variant="link" 
              size="sm" 
              className="gap-1 text-muted-foreground hover:text-primary"
            >
              Lihat Semua Riwayat
              <ChevronRight size={14} />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
