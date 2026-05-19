import { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/dashboard/Stats';
import { RABEditor } from './components/rab/RABEditor';
import { RekapEditor } from './components/rekap/RekapEditor';
import { OperasionalEditor } from './components/operasional/OperasionalEditor';
import { useRABStore } from './hooks/use-rab-store';
import { RABRecord } from './lib/types';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { initAuth, googleSignIn, logout as authLogout } from './lib/auth';
import { User } from 'firebase/auth';
import { getSpreadsheetId } from './lib/sheets';
import { Database } from 'lucide-react';
import { Button } from './components/ui/button';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor' | 'operasional' | 'rekap' | 'history' | 'templates'>('dashboard');
  const [editingRecord, setEditingRecord] = useState<RABRecord | undefined>(undefined);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const { records, saveRecord, deleteRecord, getStats, syncStatus, isSyncing } = useRABStore(accessToken);
  const stats = useMemo(() => getStats(), [records]);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setUser(user);
        setAccessToken(token);
        setIsConnecting(false);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setIsConnecting(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (isConnecting) return;
    
    try {
      setIsConnecting(true);
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        toast.success("Berhasil terhubung ke Google Sheets");
      }
    } catch (error: any) {
      if (error.code !== 'auth/cancelled-popup-request') {
        toast.error("Gagal menghubungkan ke Google Sheets");
      }
      setIsConnecting(false);
    } finally {
      // We don't set isConnecting to false here because initAuth will handle it 
      // via the observer if successful, but we need it for errors.
      // However, if the result was null (already signing in), we should reset it.
    }
  };

  const handleLogout = async () => {
    await authLogout();
    setUser(null);
    setAccessToken(null);
    toast.info("Terputus dari Google Sheets");
  };

  const handleEdit = (record: RABRecord) => {
    setEditingRecord(record);
    if (record.type === 'rekap-sekolah') {
      setActiveTab('rekap');
    } else if (record.type === 'operasional-harian') {
      setActiveTab('operasional');
    } else {
      setActiveTab('editor');
    }
  };

  const handleCreateNew = () => {
    setEditingRecord(undefined);
    setActiveTab('editor');
  };

  const handleSave = async (record: RABRecord, silent = false) => {
    try {
      if (!silent) toast.loading("Menyimpan ke Cloud...", { id: 'save-toast' });
      await saveRecord(record);
      if (!silent) {
        toast.success("Data berhasil tersimpan di Cloud", { id: 'save-toast' });
        setActiveTab('dashboard');
        setEditingRecord(undefined);
      }
    } catch (error: any) {
      if (!silent) {
        const errorMsg = error.message || "Gagal sinkron ke Cloud";
        toast.error(`${errorMsg}. Data tersimpan secara lokal.`, { id: 'save-toast', duration: 5000 });
      }
    }
  };

  const handleDelete = (id: string) => {
    deleteRecord(id);
    toast.success("RAB telah dihapus");
  };

  const handleDuplicate = (record: RABRecord) => {
    const duplicated = {
      ...record,
      id: crypto.randomUUID(),
      tanggal: new Date().toLocaleDateString('id-ID'),
      createdAt: Date.now()
    };
    saveRecord(duplicated);
    toast.success("RAB telah diduplikasi");
  };

  return (
    <div className="flex min-h-screen bg-background transition-colors duration-300">
      <Sidebar 
        activeTab={activeTab} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        setActiveTab={(tab) => {
          setActiveTab(tab as any);
          if (tab === 'dashboard') setEditingRecord(undefined);
          setIsSidebarOpen(false);
        }} 
      />
      
      <main className="flex-1 lg:ml-64 overflow-hidden flex flex-col h-screen w-full">
        <header className="h-16 bg-card border-b flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-secondary rounded-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
            <h1 className="text-lg md:text-xl font-display font-black text-foreground tracking-tight capitalize">{activeTab.replace('-', ' ')}</h1>
          </div>
          <div className="flex items-center gap-4">
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
          <div className="max-w-6xl mx-auto w-full">
            {!user && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Database size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300">Cloud Tidak Terhubung</h3>
                    <p className="text-xs text-amber-700/80 dark:text-amber-400/80">Data saat ini hanya tersimpan secara lokal di browser ini. Login untuk simpan ke Spreadsheet.</p>
                  </div>
                </div>
                <Button 
                  onClick={handleLogin} 
                  variant="outline" 
                   disabled={isConnecting}
                  className="border-amber-200 hover:bg-amber-100 dark:border-amber-900 text-amber-700 dark:text-amber-300"
                >
                   {isConnecting ? "Menghubungkan..." : "Hubungkan Sekarang"}
                </Button>
              </motion.div>
            )}
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' ? (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Dashboard 
                    records={records} 
                    stats={stats} 
                    onEdit={handleEdit} 
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onCreateNew={handleCreateNew}
                  />
                </motion.div>
              ) : activeTab === 'editor' ? (
                <motion.div
                  key="editor"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <RABEditor 
                    initialData={editingRecord} 
                    onSave={handleSave} 
                    records={records}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                  />
                </motion.div>
              ) : activeTab === 'operasional' ? (
                <motion.div
                  key="operasional"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <OperasionalEditor 
                    initialData={editingRecord} 
                    onSave={handleSave} 
                    records={records}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                  />
                </motion.div>
              ) : activeTab === 'rekap' ? (
                <motion.div
                  key="rekap"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <RekapEditor 
                    initialData={editingRecord} 
                    onSave={handleSave} 
                    records={records}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex items-center justify-center text-muted-foreground italic"
                >
                  Fitur {activeTab} akan segera hadir.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <Toaster position="top-center" closeButton richColors />
    </div>
  );
}
