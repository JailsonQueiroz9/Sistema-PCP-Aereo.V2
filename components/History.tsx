
import React, { useState, useEffect, useMemo } from 'react';
import { 
  History as HistoryIcon, Search, Calendar, Filter, 
  ChevronDown, FileText, CheckCircle2, Loader2, Download, ExternalLink, RefreshCw
} from 'lucide-react';
import { AWBRecord, AWBStatus } from '../types';
import { storageService, formatDate } from '../services/storageService';

const History: React.FC = () => {
  const [records, setRecords] = useState<AWBRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDocsId, setOpenDocsId] = useState<string | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await storageService.getRecords();
      // Filtra registros que tenham status de finalização (ENTREGUE ou OK)
      // Normalizamos para maiúsculas e removemos espaços para garantir a comparação
      const finishedRecords = data.filter(r => {
        const s = String(r.status || r.Status || '').toUpperCase().trim();
        return s === 'ENTREGUE' || s === 'OK';
      });
      setRecords(finishedRecords);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filtered = useMemo(() => {
    return records.filter(r => {
      const search = searchTerm.toLowerCase();
      // Verifica todas as possíveis variações de nomes de campos da planilha
      const awb = String(r.awbNumber || r.AWB || '').toLowerCase();
      const provider = String(r.fornecedor || r.Fornecedor || '').toLowerCase();
      const nfs = String(r.nfs || r["NF's"] || '').toLowerCase();
      
      return awb.includes(search) || provider.includes(search) || nfs.includes(search);
    });
  }, [records, searchTerm]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#050a14]">
        <Loader2 size={40} className="text-emerald-500 animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 text-center px-6">
          Acessando Arquivos de Operação Concluída...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#050a14]">
      
      <header className="px-10 py-8 border-b border-slate-900 bg-[#0c1425]/50 flex items-center justify-between">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/10">
              <HistoryIcon size={24} />
           </div>
           <div>
             <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Arquivo de Operações</h2>
             <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] mt-2">Registros Finalizados e Histórico</p>
           </div>
        </div>

        <div className="flex items-center gap-4">
           <button 
            onClick={loadHistory}
            className="p-3 bg-slate-900 border border-slate-800 text-slate-500 hover:text-emerald-500 rounded-xl transition-all"
           >
              <RefreshCw size={18} />
           </button>
           <button className="px-6 py-3 bg-slate-900 border border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest rounded-xl hover:text-white transition-all flex items-center gap-3">
              <Download size={14} /> Exportar Log CSV
           </button>
        </div>
      </header>

      <div className="px-10 py-6 border-b border-slate-900 flex items-center gap-6">
        <div className="relative flex-1 group">
           <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
           <input 
            type="text" 
            placeholder="PESQUISAR POR AWB OU FORNECEDOR NO HISTÓRICO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0d1425] border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-xs font-bold text-white uppercase focus:border-emerald-500 outline-none transition-all"
           />
        </div>
        <div className="flex items-center gap-4">
           <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800">
              <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase shadow-lg shadow-emerald-600/20">Este Mês</button>
              <button className="px-4 py-2 text-slate-500 rounded-lg text-[9px] font-black uppercase hover:text-slate-300">Este Ano</button>
           </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-6">
             <div className="w-24 h-24 rounded-full bg-slate-900/50 flex items-center justify-center border border-slate-800/50">
                <HistoryIcon size={48} className="opacity-10" />
             </div>
             <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Nenhum registro finalizado encontrado</p>
                <p className="text-[8px] font-bold text-slate-700 uppercase tracking-widest mt-2">Os itens aparecem aqui após o status ser alterado para OK ou ENTREGUE</p>
             </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(r => {
              const docs = r.pdf_links || (r.documentos || r.Documentos ? String(r.documentos || r.Documentos).split('|').filter(l => l.trim().startsWith('http')) : []);
              const currentAwb = r.awbNumber || r.AWB || 'N/A';
              const currentProvider = r.fornecedor || r.Fornecedor || 'N/A';
              const currentBrand = r.marca || r.Marca || 'N/A';
              const finishDate = r.chegada || r.Chegada;

              return (
                <div key={r.id || r.ID} className="bg-[#0c1425]/30 border border-slate-900 rounded-[28px] p-6 flex items-center justify-between hover:border-emerald-500/20 transition-all group relative">
                  <div className="flex items-center gap-6">
                     <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-500/10">
                        <CheckCircle2 size={20} />
                     </div>
                     <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">{currentAwb}</h4>
                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1">Finalizado em {formatDate(finishDate)}</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-12">
                     <div className="text-center hidden md:block">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Fornecedor</p>
                        <p className="text-[10px] font-bold text-slate-300 uppercase">{currentProvider}</p>
                     </div>
                     <div className="text-center hidden md:block">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Marca</p>
                        <p className="text-[10px] font-bold text-slate-300 uppercase">{currentBrand}</p>
                     </div>
                     
                     <div className="relative">
                        <button 
                          onClick={() => docs.length > 0 && setOpenDocsId(openDocsId === (r.id || r.ID) ? null : (r.id || r.ID))}
                          className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all border shadow-lg ${
                            docs.length > 0 
                            ? 'bg-slate-900 border-slate-800 text-emerald-500 hover:text-white hover:bg-emerald-600' 
                            : 'bg-slate-950/50 border-slate-900 text-slate-800 cursor-not-allowed opacity-30'
                          }`}
                        >
                           <FileText size={18} />
                        </button>

                        {openDocsId === (r.id || r.ID) && docs.length > 0 && (
                          <div className="absolute right-0 top-full mt-4 w-64 bg-[#0c1425] border border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                             <div className="p-4 border-b border-slate-800 bg-emerald-600/5">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2">
                                   <FileText size={10} /> Documentos em Anexo ({docs.length})
                                </p>
                             </div>
                             <div className="max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                {docs.map((url, idx) => (
                                  <button 
                                    key={idx}
                                    onClick={() => window.open(url, '_blank')}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all text-left group"
                                  >
                                    <div className="p-2 bg-slate-900 rounded-lg text-slate-600 group-hover:text-emerald-500 transition-colors">
                                      <Download size={14} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[9px] font-black text-white uppercase truncate">PDF ARQUIVO {idx + 1}</span>
                                      <span className="text-[7px] text-slate-600 font-bold truncate">{url.split('/').pop()?.substring(0, 25)}...</span>
                                    </div>
                                  </button>
                                ))}
                             </div>
                          </div>
                        )}
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {openDocsId && (
        <div className="fixed inset-0 z-40" onClick={() => setOpenDocsId(null)} />
      )}

    </div>
  );
};

export default History;
