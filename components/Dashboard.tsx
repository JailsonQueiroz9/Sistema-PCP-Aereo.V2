
import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, RotateCw, Search, Trash2, Package,
  FileText, Edit3, Loader2, ExternalLink, ChevronDown,
  LayoutGrid, List, ChevronRight, Calendar, Box, Truck,
  Download, ArrowUpDown, ChevronUp, X
} from 'lucide-react';
import { AWBRecord, AWBStatus, FilterState, User } from '../types';
import { storageService, getApiUrl, formatDate } from '../services/storageService';
import AWBModal from './AWBModal';

interface DashboardProps {
  filters: FilterState;
}

type SortConfig = {
  key: keyof AWBRecord;
  direction: 'asc' | 'desc';
} | null;

const Dashboard: React.FC<DashboardProps> = ({ filters }) => {
  const [records, setRecords] = useState<AWBRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AWBRecord | undefined>();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [openDocsId, setOpenDocsId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>(() => {
    return (localStorage.getItem('dashboard_view_mode') as 'table' | 'grid') || 'table';
  });

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

  const toggleViewMode = (mode: 'table' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('dashboard_view_mode', mode);
  };

  const loadData = async () => {
    if (!getApiUrl()) return;
    setLoading(true);
    try {
      const data = await storageService.getRecords();
      setRecords(data);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente EXCLUIR este registro?')) return;
    setDeletingId(id);
    try {
      await storageService.deleteRecord(id);
      await loadData();
    } finally {
      setDeletingId(null);
    }
  };

  const handleSort = (key: keyof AWBRecord) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const hasFollowUpPermission = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return currentUser.allowedViews?.some(v => String(v).toLowerCase() === 'follow-up');
  }, [currentUser]);

  const getAllPDFs = (r: AWBRecord) => {
    const pdfs: string[] = [];
    const rawDocs = r.Documentos || r.documentos;
    if (rawDocs) {
      String(rawDocs).split('|').forEach(link => {
        const trimmed = link.trim();
        if (trimmed.startsWith('http')) pdfs.push(trimmed);
      });
    }
    for (let i = 1; i <= 11; i++) {
      const key = `PDF_${i}`;
      const val = r[key];
      if (val && String(val).trim().startsWith('http')) {
        pdfs.push(String(val).trim());
      }
    }
    return Array.from(new Set(pdfs));
  };

  const sortedAndFilteredRecords = useMemo(() => {
    let filtered = records.filter(r => {
      const s = searchTerm.toLowerCase();
      const fornecedor = String(r.fornecedor || r.Fornecedor || '').toLowerCase();
      const awb = String(r.awbNumber || r.AWB || '').toLowerCase();
      const nfs = String(r.nfs || r["NF's"] || '').toLowerCase();
      const marca = String(r.marca || r.Marca || '').toLowerCase();
      const status = String(r.status || r.Status || '').toLowerCase();
      const material = String(r.material || r.Material || '').toLowerCase();

      const searchableStr = `${fornecedor} ${awb} ${nfs} ${marca} ${status} ${material}`;
      const matchesSearch = searchableStr.includes(s);
      const currentStatus = (r.status || r.Status) as AWBStatus;
      const matchesStatus = filters.statuses.length === 0 || filters.statuses.includes(currentStatus);

      return matchesSearch && matchesStatus;
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = String(a[sortConfig.key] || '').toLowerCase();
        const bValue = String(b[sortConfig.key] || '').toLowerCase();
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [records, searchTerm, filters.statuses, sortConfig]);

  const getStatusStyle = (status: AWBStatus) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('TRANSITO')) return 'text-[#ffcc00] border-[#ffcc00] bg-[#ffcc00]/10';
    if (s.includes('DISPONIVEL')) return 'text-[#10b981] border-[#10b981] bg-[#10b981]/10';
    if (s.includes('ATRASADO')) return 'text-[#f43f5e] border-[#f43f5e] bg-[#f43f5e]/10';
    if (s.includes('ENTREGUE') || s.includes('OK')) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    return 'text-slate-400 border-slate-600 bg-slate-800/10';
  };

  const Th = ({ label, sortKey }: { label: string, sortKey: keyof AWBRecord }) => (
    <th
      className="px-2 py-6 font-black text-white cursor-pointer hover:bg-white/5 transition-colors group whitespace-nowrap"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-2">
        {label}
        {sortConfig?.key === sortKey ? (
          sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
        ) : (
          <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-40" />
        )}
      </div>
    </th>
  );

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#050a14]">

      <header className="px-10 py-8 flex items-center justify-between border-b border-slate-900 bg-[#0c1425]/50 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500 shadow-lg shadow-blue-500/10">
            <Package size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Painel de Monitoramento</h2>
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] mt-2">Logística Global AWB</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => toggleViewMode('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => toggleViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <LayoutGrid size={18} />
            </button>
          </div>

          <button onClick={loadData} className="p-3 bg-slate-900 border border-slate-800 text-slate-500 hover:text-white rounded-xl transition-all">
            <RotateCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>

          {hasFollowUpPermission && (
            <button
              onClick={() => { setEditingRecord(undefined); setIsModalOpen(true); }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl glow-blue flex items-center gap-3 transition-all active:scale-95"
            >
              <Plus size={18} /> Novo Embarque
            </button>
          )}
        </div>
      </header>

      <div className="px-10 py-6 border-b border-slate-900 flex items-center gap-6 bg-[#0c1425]/30">
        <div className="relative flex-1 group">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="PESQUISAR POR AWB, FORNECEDOR, NF OU MARCA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0d1425] border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-[11px] font-black text-white uppercase focus:border-blue-500 outline-none transition-all placeholder:text-slate-800"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Base Ativa</p>
            <p className="text-[10px] font-black text-emerald-500 uppercase">Online</p>
          </div>
          <div className="h-10 w-[1px] bg-slate-800 mx-2" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-900 px-4 py-2 rounded-lg">
            {sortedAndFilteredRecords.length} Resultados
          </p>
        </div>
      </div>

      <main className="flex-1 overflow-auto p-4 md:p-10 pb-64 custom-scrollbar relative">
        {loading && records.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <Loader2 size={40} className="text-blue-500 animate-spin" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Carregando Matriz de Dados...</p>
          </div>
        ) : sortedAndFilteredRecords.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-800 opacity-20">
            <Package size={80} strokeWidth={1} />
            <p className="text-[14px] font-black uppercase tracking-[1em] mt-8">Nenhum Registro</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-4 min-w-[1200px]">
              <thead>
                <tr className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black">
                  <Th label="Fornecedor" sortKey="Fornecedor" />
                  <Th label="Saída" sortKey="Saída" />
                  <Th label="NF's" sortKey="NF's" />
                  <Th label="AWB" sortKey="AWB" />
                  <Th label="Status" sortKey="Status" />
                  <Th label="Chegada" sortKey="Chegada" />
                  <Th label="Marca" sortKey="Marca" />
                  <Th label="Material" sortKey="Material" />
                  <Th label="Observação" sortKey="Observação" />
                  <th className="px-2 py-6 font-black text-white">Docs</th>
                  {hasFollowUpPermission && <th className="px-2 py-6 font-black text-white text-right">Ações</th>}
                </tr>
              </thead>
              <tbody>
                {sortedAndFilteredRecords.map((r) => {
                  const pdfs = getAllPDFs(r);
                  const status = (r.Status || r.status) as AWBStatus;
                  return (
                    <tr key={r.id || r.ID} className="group bg-[#0c1425]/40 hover:bg-[#0c1425] transition-all border border-slate-900 shadow-xl rounded-[20px]">
                      <td className="px-2 py-6 first:rounded-l-[24px]">
                        <span className="text-xs font-black text-white uppercase tracking-tight">{r.fornecedor || r.Fornecedor}</span>
                      </td>
                      <td className="px-2 py-6 text-xs font-bold text-slate-300">{formatDate(r.saida || r.Saída)}</td>
                      <td className="px-2 py-6 text-[11px] font-bold text-slate-400">{r.nfs || r["NF's"] || '-'}</td>
                      <td className="px-2 py-6">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-blue-500 font-mono tracking-tighter">{r.awbNumber || r.AWB}</span>
                          <a href={r.rastreio || r.Rastreio} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-900 rounded-lg text-slate-600 hover:text-emerald-500 transition-colors">
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </td>
                      <td className="px-2 py-6">
                        <span className={`status-badge ${getStatusStyle(status)}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-2 py-6 text-xs font-bold text-slate-300">{formatDate(r.chegada || r.Chegada)}</td>
                      <td className="px-2 py-6">
                        <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">{r.marca || r.Marca}</span>
                      </td>
                      <td className="px-2 py-6 max-w-[150px]">
                        <span className="text-[10px] font-bold text-slate-500 uppercase truncate block" title={r.material || r.Material}>{r.material || r.Material || '-'}</span>
                      </td>
                      <td className="px-2 py-6 max-w-[200px]">
                        <span className="text-[10px] font-bold text-slate-500 uppercase truncate block" title={r.observacao || r.Observação}>{r.observacao || r.Observação || '-'}</span>
                      </td>
                      <td className="px-2 py-6 relative">
                        <button
                          onClick={() => pdfs.length > 0 && setOpenDocsId(openDocsId === (r.id || r.ID) ? null : (r.id || r.ID))}
                          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${pdfs.length > 0
                              ? 'bg-slate-900 border-slate-800 text-emerald-500 hover:text-white hover:bg-emerald-600'
                              : 'bg-slate-950/50 border-slate-900 text-slate-800 cursor-not-allowed opacity-30'
                            }`}
                        >
                          <FileText size={18} />
                          {pdfs.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border border-[#050a14]">
                              {pdfs.length}
                            </span>
                          )}
                        </button>

                        {openDocsId === (r.id || r.ID) && pdfs.length > 0 && (
                          <div className="absolute right-0 top-full mt-4 w-64 bg-[#0c1425] border border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <div className="p-4 border-b border-slate-800 bg-emerald-600/5">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2">
                                <FileText size={12} /> Documentos ({pdfs.length})
                              </p>
                            </div>
                            <div className="max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1">
                              {pdfs.map((url, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => window.open(url, '_blank')}
                                  className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all text-left group"
                                >
                                  <div className="p-2 bg-slate-900 rounded-lg text-slate-600 group-hover:text-emerald-500 transition-colors">
                                    <Download size={14} />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] font-black text-white uppercase truncate">PDF ARQUIVO {idx + 1}</span>
                                    <span className="text-[8px] text-slate-600 font-bold truncate">{url.split('/').pop()?.substring(0, 30)}...</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                      {hasFollowUpPermission && (
                        <td className="px-2 py-6 last:rounded-r-[24px] text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setEditingRecord(r); setIsModalOpen(true); }}
                              className="p-3 text-slate-600 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"
                            >
                              <Edit3 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(r.id || r.ID)}
                              disabled={deletingId === (r.id || r.ID)}
                              className="p-3 text-slate-800 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all disabled:opacity-20"
                            >
                              {deletingId === (r.id || r.ID) ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {sortedAndFilteredRecords.map((r) => {
              const pdfs = getAllPDFs(r);
              const status = (r.Status || r.status) as AWBStatus;
              return (
                <div key={r.id || r.ID} className="bg-[#0c1425]/40 border border-slate-900 rounded-[32px] p-6 hover:bg-[#0c1425] transition-all flex flex-col gap-6 group relative shadow-2xl">
                  <div className="flex justify-between items-start">
                    <span className={`status-badge ${getStatusStyle(status)}`}>
                      {status}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => pdfs.length > 0 && setOpenDocsId(openDocsId === (r.id || r.ID) ? null : (r.id || r.ID))}
                        className={`p-2.5 rounded-xl border transition-all relative ${pdfs.length > 0 ? 'bg-slate-900 border-slate-800 text-emerald-500 hover:text-white hover:bg-emerald-600' : 'text-slate-800 border-slate-900 cursor-not-allowed'}`}
                      >
                        <FileText size={16} />
                        {openDocsId === (r.id || r.ID) && pdfs.length > 0 && (
                          <div className="absolute left-0 top-full mt-4 w-56 bg-[#0c1425] border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 origin-top-left">
                            {pdfs.map((url, idx) => (
                              <button key={idx} onClick={() => window.open(url, '_blank')} className="w-full p-4 flex items-center gap-3 hover:bg-white/5 text-left border-b border-slate-900 last:border-0">
                                <Download size={14} className="text-emerald-500" />
                                <span className="text-[9px] font-black text-white uppercase tracking-widest">DOC {idx + 1}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </button>
                      {hasFollowUpPermission && (
                        <>
                          <button onClick={() => { setEditingRecord(r); setIsModalOpen(true); }} className="p-2.5 text-slate-600 hover:text-blue-500 transition-colors"><Edit3 size={16} /></button>
                          <button onClick={() => handleDelete(r.id || r.ID)} className="p-2.5 text-slate-800 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xl font-black text-white font-mono italic tracking-tighter">{r.awbNumber || r.AWB}</h4>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                      <Truck size={12} className="text-blue-500" /> {r.fornecedor || r.Fornecedor}
                    </p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">NF: {r.nfs || r["NF's"] || '-'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-auto">
                    <div className="bg-[#050a14] p-4 rounded-2xl border border-slate-800">
                      <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Marca</p>
                      <p className="text-[10px] font-black text-blue-500 uppercase truncate">{r.marca || r.Marca || '-'}</p>
                    </div>
                    <div className="bg-[#050a14] p-4 rounded-2xl border border-slate-800">
                      <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Saída</p>
                      <p className="text-[10px] font-black text-slate-300 uppercase">{formatDate(r.saida || r.Saída)}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-900 pt-4 space-y-2">
                    <div className="flex justify-between items-center text-[8px] font-black text-slate-600 uppercase tracking-widest">
                      <span>Chegada</span>
                      <span className="text-slate-300">{formatDate(r.chegada || r.Chegada)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Material</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase truncate" title={r.material || r.Material}>{r.material || r.Material || '-'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {openDocsId && <div className="fixed inset-0 z-40" onClick={() => setOpenDocsId(null)} />}

      <AWBModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingRecord(undefined); }}
        onSave={loadData}
        editingRecord={editingRecord}
      />
    </div>
  );
};

export default Dashboard;