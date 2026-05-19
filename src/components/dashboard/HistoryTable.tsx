import { 
  History, 
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Calendar as CalendarIcon,
  TrendingUp,
  Plus,
  Package
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RABRecord } from "@/lib/types";
import { formatIDR } from "@/lib/utils";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HistoryTableProps {
  records: RABRecord[];
  type: 'bahan-baku' | 'operasional-harian' | 'rekap-sekolah';
  onEdit: (record: RABRecord) => void;
  onDelete: (id: string) => void;
  onDuplicate: (record: RABRecord) => void;
  title?: string;
  description?: string;
}

export function HistoryTable({ records, type, onEdit, onDelete, onDuplicate, title, description }: HistoryTableProps) {
  const filteredRecords = (records || [])
    .filter(r => r.type === type)
    .sort((a,b) => b.createdAt - a.createdAt);

  return (
    <Card className="border-none ring-1 ring-border shadow-md overflow-hidden bg-card mt-12 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="bg-primary/5 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History size={20} className="text-primary" />
          {title || "Riwayat Terakhir"}
        </CardTitle>
        <CardDescription className="text-xs">
          {description || "Akses cepat ke data sebelumnya."}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y max-h-[500px] overflow-y-auto custom-scrollbar">
          {filteredRecords.map((record) => (
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
                      : record.menuMakanan || "Tanpa Menu"}
                  </h4>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{record.hari}, {record.tanggal}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block mr-2">
                  <p className="text-sm font-mono font-bold leading-none">{formatIDR(record.total)}</p>
                  <p className="text-[9px] text-muted-foreground uppercase mt-1">
                    {record.type === 'rekap-sekolah' 
                      ? 'Rekapitulasi' 
                      : record.type === 'operasional-harian'
                      ? 'Operasional'
                      : `${record.items?.length || 0} Item`}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-transparent hover:border-border">
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => onEdit(record)} className="gap-2 cursor-pointer">
                      <Edit size={14} /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(record)} className="gap-2 cursor-pointer">
                      <Copy size={14} /> Duplikat
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(record.id)} className="text-destructive gap-2 cursor-pointer">
                      <Trash2 size={14} /> Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
          {filteredRecords.length === 0 && (
            <div className="p-16 text-center text-muted-foreground flex flex-col items-center gap-3">
               <Package className="opacity-10" size={64} />
               <div className="space-y-1">
                 <p className="text-sm font-bold">Belum ada riwayat</p>
                 <p className="text-xs">Data yang Anda simpan akan muncul di sini.</p>
               </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
