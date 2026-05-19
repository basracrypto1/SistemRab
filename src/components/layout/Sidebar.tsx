import { motion, AnimatePresence } from "motion/react";
import { LayoutDashboard, FileText, Settings, LogOut, Moon, Sun, History, UtensilsCrossed, X, Database, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { User } from 'firebase/auth';
import { getSpreadsheetId, setSpreadsheetId } from "@/lib/sheets";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Label } from "../ui/label";

interface SidebarProps {
  activeTab: string;
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
  user?: User | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

export function Sidebar({ activeTab, isOpen, onClose, setActiveTab, user, onLogin, onLogout }: SidebarProps) {
  const [isDark, setIsDark] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sheetId, setSheetId] = useState(getSpreadsheetId());

  const handleSaveSettings = () => {
    setSpreadsheetId(sheetId);
    setIsSettingsOpen(false);
    toast.success("ID Spreadsheet diperbarui! Refresh diperlukan untuk memuat data baru.");
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'editor', icon: FileText, label: 'Bahan Baku Harian' },
    { id: 'operasional', icon: FileText, label: 'Operasional Harian' },
    { id: 'rekap', icon: UtensilsCrossed, label: 'Rekap Sekolah' },
  ];

  const sidebarContent = (
    <aside className={cn(
      "w-64 bg-card border-r border-border h-screen flex flex-col p-4 fixed left-0 top-0 z-[60] transition-transform duration-300 lg:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex flex-col gap-4 px-2 mb-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-primary/20">
              S
            </div>
            <div>
              <h1 className="text-sm font-display font-black text-foreground tracking-tight leading-none">SPPG BANGKALAN</h1>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">KAMAL 3</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="lg:hidden p-2 text-muted-foreground hover:bg-secondary rounded-md"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setActiveTab(item.id);
            }}
            className={cn(
              "sidebar-link w-full text-left",
              activeTab === item.id && "active"
            )}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="pt-4 border-t border-border mt-auto space-y-4">
        <div className="flex items-center justify-between px-2">
          <Button 
            type="button"
            variant="ghost" 
            size="icon" 
            onClick={() => setIsDark(!isDark)} 
            className="rounded-full"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </Button>

          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button 
                type="button"
                variant="ghost" 
                size="icon" 
                className={cn("rounded-full", isSettingsOpen && "bg-secondary")}
              >
                <Settings size={20} />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Database size={20} className="text-primary" />
                  Konfigurasi Cloud
                </DialogTitle>
                <DialogDescription>
                  Hubungkan aplikasi ke Google Spreadsheet Anda sendiri.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="sheetId" className="text-xs font-bold uppercase tracking-wider">Spreadsheet ID</Label>
                  <Input 
                    id="sheetId"
                    value={sheetId}
                    onChange={(e) => setSheetId(e.target.value)}
                    placeholder="Masukkan Spreadsheet ID..."
                    className="font-mono text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Pastikan Anda memiliki akses tulis ke spreadsheet ini. Anda bisa menemukannya di URL Google Sheets: <code className="bg-muted px-1.5 py-0.5 rounded">https://docs.google.com/spreadsheets/d/<b>[ID_INI]</b>/edit</code>
                  </p>
                </div>
                <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 flex items-start gap-3">
                   <ExternalLink size={16} className="text-primary shrink-0 mt-0.5" />
                   <div>
                     <p className="text-xs font-semibold text-primary">Ingin pakai template baru?</p>
                     <p className="text-[10px] text-muted-foreground mt-1 leading-normal">
                       Buat spreadsheet baru, lalu copy ID-nya ke sini untuk memulai penyimpanan data yang bersih.
                     </p>
                   </div>
                </div>
              </div>
              <DialogFooter className="flex-row gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Batal</Button>
                <Button onClick={handleSaveSettings} className="gap-2">
                   <Check size={16} /> Simpan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {user && (
          <div className="mt-auto px-2">
            <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl mb-4 group ring-1 ring-border/50">
              <div className="size-9 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20 shrink-0 overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="size-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <Database size={18} className="text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{user.displayName || 'Google User'}</p>
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <div className="size-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)] shrink-0" />
                  <p className="text-[10px] text-muted-foreground truncate font-mono opacity-60">Synced to Cloud</p>
                </div>
              </div>
              <Button 
                type="button"
                variant="ghost" 
                size="icon" 
                onClick={onLogout}
                className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
              >
                <LogOut size={14} />
              </Button>
            </div>
          </div>
        )}

        <div className="text-center pb-2 px-4">
          <p className="text-[10px] text-muted-foreground font-medium italic leading-tight">
            Digitalization by<br />Fahrul Anam
          </p>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {sidebarContent}
    </>
  );
}
