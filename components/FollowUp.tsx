
import React, { useState, useEffect, useMemo } from 'react';
import { 
  RotateCw, Search, List, Package, 
  Edit3, Loader2, ExternalLink, FileText,
  TrendingUp, Truck, MapPin, ChevronRight
} from 'lucide-react';
import { AWBRecord, AWBStatus, FilterState, User } from '../types';
import { storageService, getApiUrl, formatDate } from '../services/storageService';
import AWBModal from './AWBModal';

interface FollowUpProps {
  filters: FilterState;
}

const FollowUp: React.FC<FollowUpProps> = ({ filters }) => {
  const [records, setRecords] = useState<AWBRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AWBRecord | undefined>();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('auth_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch {
        setCurrentUser(null);
      }
    }
    loadData();
  }, []);

  const hasCRUDPermission = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return currentUser.allowedViews?.some(v => String(v).toLowerCase() === 'follow-up');
  }, [currentUser]);

  const loadData = async () => {
    if (!getApiUrl()) return;
    setLoading(true);
    try {
      const data = await storageService.getRecords();
      setRecords(data);
    } catch (err) {
      console.error("Erro na Matriz:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const s = searchTerm.toLowerCase();
      const fornecedor = String(r.Fornecedor || r.fornecedor || '').toLowerCase();
      const awb = String(r.AWB || r.awbNumber || '').toLowerCase();
      const nfs = String(r["NF's"] || r.nfs || '').toLowerCase();
      const marca = String(r.Marca || r.marca || '').toLowerCase();
      
      const matchesSearch = fornecedor.includes(s) || awb.includes(s) || nfs.includes(s) || marca.includes(s);
      const currentStatus = (r.Status || r.status) as AWBStatus;
      const matchesStatus = filters.statuses.length === 0 || filters.statuses.includes(currentStatus);
      
      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, filters.statuses]);

  const getStatusStyle = (status: string) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('EM TR')) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    if (s.includes('OK') || s.includes('ENTREGUE')) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (s.includes('DISPONIVEL')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (s.includes('ATRASADO')) return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    return 'bg-slate-800/10 text-slate-500 border-slate-800/20';
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#050a14]">
      <header className="px-8 py-6 flex items-center justify-between border-b border-slate-900 bg-[#0c1425]">
        <div className="flex items-center gap-4">
           <div className="p-2.5 bg-blue-600/10 rounded-xl border border-blue-500/20">
             <TrendingUp size={20} className="text-blue-500" />
           </div>
           <div>
             <h1 className="text-sm font-[900] text-white tracking-[0.2em] uppercase italic">Central de Follow-UP</h1>
             <p className="text-[7px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-0.5">Gestão de Status e Fluxo</p>
           </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group min-w-[320px]">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
            <input 
              type="text" 
              placeholder="PESQUISAR CARGA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#050a14] border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-[10px] font-black text-white focus:border-blue-500 outline-none transition-all uppercase tracking-widest placeholder:text-slate-800"
            />
          </div>
          <button onClick={loadData} className="p-2 text-slate-500 hover:text-white transition-all">
            <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRecords.map((r) => (
            <div key={r.id} className="bg-[#0c1425] border border-slate-800 rounded-[32px] p-6 hover:border-blue-500/30 transition-all flex flex-col gap-4 shadow-xl group">
               <div className="flex justify-between items-start">
                  <span className={`px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${getStatusStyle(String(r.status || r.Status))}`}>
                    {r.status || r.Status}
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setEditingRecord(r); setIsModalOpen(true); }}
                      className="p-2 text-slate-500 hover:text-blue-500 transition-colors"
                    >
                      <Edit3 size={14} />
                    </button>
                    <a href={r.rastreio || r.Rastreio || '#'} target="_blank" rel="noreferrer" className="p-2 text-slate-500 hover:text-emerald-500 transition-colors">
                      <ExternalLink size={14} />
                    </a>
                  </div>
               </div>
               
               <div>
                  <h3 className="text-white font-black text-lg font-mono tracking-tight">{r.awbNumber || r.AWB}</h3>
                  <p className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1 mt-1">
                    <Truck size={10} /> {r.fornecedor || r.Fornecedor}
                  </p>
               </div>

               <div className="bg-[#050a14]/50 rounded-2xl p-4 border border-slate-900/50 space-y-2 mt-2">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-slate-600 font-bold uppercase">Marca</span>
                    <span className="text-blue-400 font-black">{r.marca || r.Marca}</span>
                  </div>
                  <div className="flex justify-between text-[9px]">
                    <span className="text-slate-600 font-bold uppercase">Saída</span>
                    <span className="text-white font-bold">{formatDate(r.saida || r.Saída)}</span>
                  </div>
                  <div className="flex justify-between text-[9px]">
                    <span className="text-slate-600 font-bold uppercase">Material</span>
                    <span className="text-slate-400 font-bold truncate max-w-[100px]">{r.material || r.Material || '-'}</span>
                  </div>
               </div>

               <button 
                onClick={() => { setEditingRecord(r); setIsModalOpen(true); }}
                className="mt-4 w-full py-3 bg-slate-900 hover:bg-slate-800 rounded-xl text-[9px] font-black text-slate-400 hover:text-white uppercase tracking-widest border border-slate-800 transition-all flex items-center justify-center gap-2"
               >
                 Ver Detalhes <ChevronRight size={12} />
               </button>
            </div>
          ))}
        </div>
      </main>

      <AWBModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingRecord(undefined); }} 
        onSave={loadData} 
        editingRecord={editingRecord} 
      />
    </div>
  );
};

export default FollowUp;
