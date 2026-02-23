
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X, Save, FileText,
  Loader2, Truck, Hash, Calendar, FileType,
  AlertCircle, Upload, Trash2, Link as LinkIcon, Info, Mail, ChevronDown, AlignLeft
} from 'lucide-react';
import { AWBRecord, AWBStatus, User } from '../types';
import { storageService, toInputDate } from '../services/storageService';

interface AWBModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingRecord?: AWBRecord;
}

const AWBModal: React.FC<AWBModalProps> = ({ isOpen, onClose, onSave, editingRecord }) => {
  const [formData, setFormData] = useState<Partial<AWBRecord>>({
    Fornecedor: '', Saída: '', "NF's": '', AWB: '', Status: AWBStatus.EM_TRANSITO,
    Chegada: '', Marca: '', Material: '', Observação: '', Rastreio: '', Documentos: '',
    send_email: false, email_to: '', email_cc: '', email_bcc: '', email_body: ''
  });
  const [loading, setLoading] = useState(false);
  const [showEmailSection, setShowEmailSection] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('auth_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch {
        setCurrentUser(null);
      }
    }

    if (editingRecord) {
      setFormData({
        ...editingRecord,
        ID: editingRecord.id || editingRecord.ID,
        Fornecedor: editingRecord.Fornecedor || editingRecord.fornecedor || '',
        Saída: toInputDate(editingRecord.Saída || editingRecord.saida),
        "NF's": editingRecord["NF's"] || editingRecord.nfs || '',
        AWB: editingRecord.AWB || editingRecord.awbNumber || '',
        Status: (editingRecord.Status || editingRecord.status || AWBStatus.EM_TRANSITO) as AWBStatus,
        Chegada: toInputDate(editingRecord.Chegada || editingRecord.chegada),
        Marca: editingRecord.Marca || editingRecord.marca || '',
        Material: editingRecord.Material || editingRecord.material || '',
        Observação: editingRecord.Observação || editingRecord.observacao || '',
        Rastreio: editingRecord.Rastreio || editingRecord.rastreio || '',
        Documentos: editingRecord.Documentos || editingRecord.documentos || '',
        send_email: false,
        email_to: '',
        email_cc: '',
        email_bcc: '',
        email_body: ''
      });
    } else {
      setFormData({
        Fornecedor: '', Saída: '', "NF's": '', AWB: '', Status: AWBStatus.EM_TRANSITO,
        Chegada: '', Marca: '', Material: '', Observação: '', Rastreio: '', Documentos: '',
        send_email: false, email_to: '', email_cc: '', email_bcc: '', email_body: ''
      });
    }
    setShowEmailSection(false);
    setPendingFiles([]);
  }, [editingRecord, isOpen]);

  const hasCRUDPermission = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    const views = currentUser.allowedViews || [];
    return views.map(v => String(v).toLowerCase()).includes('follow-up');
  }, [currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasCRUDPermission) return;
    setLoading(true);

    try {
      let currentDocs = formData.Documentos || '';

      if (pendingFiles.length > 0) {
        const uploadedUrls: string[] = [];
        for (const file of pendingFiles) {
          const url = await storageService.uploadFile(file);
          uploadedUrls.push(url);
        }
        const existingLinks = String(currentDocs).split('|').filter(l => l.trim().startsWith('http'));
        currentDocs = [...existingLinks, ...uploadedUrls].join('|');
      }

      const payload = {
        ...formData,
        ID: formData.id || formData.ID || Math.random().toString(36).substring(2, 11),
        Documentos: currentDocs
      };

      await storageService.saveRecord(payload);
      onSave();
      onClose();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      alert(error.message || "Erro ao salvar no Sheets.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPendingFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0c1425] w-full max-w-4xl rounded-[40px] border border-slate-800 shadow-2xl flex flex-col my-auto max-h-[90vh] overflow-hidden">

        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-[#0c1425]/80">
          <div>
            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">
              {editingRecord ? 'Atualizar Embarque' : 'Novo Lançamento AWB'}
            </h2>
            <p className="text-blue-500 text-[9px] font-black uppercase tracking-[0.4em] mt-2 italic">Cloud Sync Enterprise 4.0</p>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
          {!hasCRUDPermission && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-4">
              <AlertCircle size={20} className="text-amber-500" />
              <p className="text-[11px] font-black uppercase text-amber-500 tracking-widest">Acesso Restrito: Apenas Visualização</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><Truck size={14} className="text-blue-500" /> Fornecedor</label>
              <input disabled={!hasCRUDPermission} required name="Fornecedor" value={formData.Fornecedor} onChange={handleChange} className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-4 py-4 text-sm font-bold text-white focus:border-blue-500 outline-none uppercase placeholder:text-slate-800" placeholder="EX: BRANYL" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><Hash size={14} className="text-blue-500" /> AWB Number</label>
              <input disabled={!hasCRUDPermission} required name="AWB" value={formData.AWB} onChange={handleChange} className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-4 py-4 text-sm font-mono font-bold text-blue-400 focus:border-blue-500 outline-none placeholder:text-slate-800" placeholder="000-00000000" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><Calendar size={14} className="text-blue-500" /> Saída</label>
              <input disabled={!hasCRUDPermission} type="date" name="Saída" value={formData.Saída} onChange={handleChange} className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-4 py-4 text-sm font-bold text-white focus:border-blue-500 outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><FileType size={14} className="text-blue-500" /> NF's</label>
              <input disabled={!hasCRUDPermission} name="NF's" value={formData["NF's"]} onChange={handleChange} className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-4 py-4 text-sm font-bold text-white focus:border-blue-500 outline-none placeholder:text-slate-800" placeholder="EX: 1234, 5678" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Marca</label>
              <input disabled={!hasCRUDPermission} name="Marca" value={formData.Marca} onChange={handleChange} className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-4 py-4 text-sm font-black text-white focus:border-blue-500 outline-none uppercase placeholder:text-slate-800" placeholder="ASICS / FILA / UMBRO" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status Operacional</label>
              <select disabled={!hasCRUDPermission} name="Status" value={formData.Status} onChange={handleChange} className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-4 py-4 text-sm font-black text-white focus:border-blue-500 outline-none cursor-pointer uppercase">
                {Object.values(AWBStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><LinkIcon size={14} className="text-blue-500" /> Link Rastreio</label>
              <input disabled={!hasCRUDPermission} name="Rastreio" value={formData.Rastreio} onChange={handleChange} className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-4 py-4 text-sm font-bold text-blue-500 focus:border-blue-500 outline-none placeholder:text-slate-800" placeholder="https://..." />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><Calendar size={14} className="text-emerald-500" /> Chegada</label>
              <input disabled={!hasCRUDPermission} type="date" name="Chegada" value={formData.Chegada} onChange={handleChange} className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-4 py-4 text-sm font-bold text-white focus:border-blue-500 outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><Info size={14} className="text-blue-500" /> Material</label>
              <input disabled={!hasCRUDPermission} name="Material" value={formData.Material} onChange={handleChange} className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-4 py-4 text-sm font-bold text-white focus:border-blue-500 outline-none uppercase placeholder:text-slate-800" placeholder="EX: TÊNIS / VESTUÁRIO" />
            </div>

            <div className="md:col-span-full space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Observações do Lote</label>
              <textarea disabled={!hasCRUDPermission} name="Observação" value={formData.Observação} onChange={handleChange} rows={2} className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-4 py-4 text-sm font-bold text-white focus:border-blue-500 outline-none resize-none uppercase" placeholder="INFORMAÇÕES ADICIONAIS..." />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/30">
            <button
              type="button"
              onClick={() => setShowEmailSection(!showEmailSection)}
              className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-all"
            >
              <Mail size={14} /> Notificação por E-mail {showEmailSection ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />}
            </button>

            {showEmailSection && (
              <div className="mt-4 p-6 bg-[#050a14]/60 border border-slate-800 rounded-3xl animate-in slide-in-from-top-4 duration-300 space-y-6">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="send_email"
                    name="send_email"
                    checked={formData.send_email}
                    onChange={handleChange}
                    className="w-5 h-5 rounded bg-[#0c1425] border-slate-800 text-blue-600 focus:ring-blue-500 transition-all"
                  />
                  <label htmlFor="send_email" className="text-[10px] font-black text-white uppercase tracking-widest cursor-pointer">Enviar detalhes e arquivos por e-mail após salvar</label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                      Para (E-mail Principal)
                      <span className="text-[7px] opacity-40">Separe por vírgulas</span>
                    </label>
                    <input
                      name="email_to"
                      value={formData.email_to}
                      onChange={handleChange}
                      className="w-full bg-[#0c1425] border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-500 placeholder:text-slate-800"
                      placeholder="email@destino.com, outro@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                      CC (Cópia)
                      <span className="text-[7px] opacity-40">Separe por vírgulas</span>
                    </label>
                    <input
                      name="email_cc"
                      value={formData.email_cc}
                      onChange={handleChange}
                      className="w-full bg-[#0c1425] border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-500 placeholder:text-slate-800"
                      placeholder="copia@email.com, cc@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                      CCO (Cópia Oculta)
                      <span className="text-[7px] opacity-40">Separe por vírgulas</span>
                    </label>
                    <input
                      name="email_bcc"
                      value={formData.email_bcc}
                      onChange={handleChange}
                      className="w-full bg-[#0c1425] border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-500 placeholder:text-slate-800"
                      placeholder="oculta@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <AlignLeft size={12} className="text-blue-500" /> Conteúdo Personalizado do E-mail (Corpo da Mensagem)
                  </label>
                  <textarea
                    name="email_body"
                    value={formData.email_body}
                    onChange={handleChange}
                    rows={4}
                    className="w-full bg-[#0c1425] border border-slate-800 rounded-xl px-4 py-4 text-xs font-bold text-white focus:border-blue-500 outline-none resize-none placeholder:text-slate-800"
                    placeholder="Escreva aqui a mensagem que será enviada aos destinatários..."
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800/30">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><Upload size={14} className="text-emerald-500" /> Documentos Digitais (PDF_1 ao PDF_11)</label>

            <div className="flex flex-wrap gap-3 mb-4">
              {String(formData.Documentos || '').split('|').filter(l => l.trim().startsWith('http')).map((url, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2 bg-emerald-600/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-[10px] font-black uppercase">
                  DOC_{i + 1}
                  <button type="button" onClick={() => {
                    const links = String(formData.Documentos).split('|').filter(l => l !== url);
                    setFormData(prev => ({ ...prev, Documentos: links.join('|') }));
                  }} className="hover:text-white"><X size={14} /></button>
                </div>
              ))}
              {pendingFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-500 text-[10px] font-black uppercase italic">
                  UPLOAD PENDENTE: {f.name}
                  <button type="button" onClick={() => setPendingFiles(p => p.filter((_, idx) => idx !== i))} className="hover:text-white"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 border-2 border-dashed border-slate-800 rounded-[28px] text-slate-600 hover:text-blue-500 hover:border-blue-500/30 transition-all flex flex-col items-center justify-center gap-4 group"
            >
              <Upload size={32} className="group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em]">Clique para selecionar arquivos de Nota Fiscal ou Comprovantes</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" accept=".pdf" />
          </div>

          <div className="pt-10 flex flex-col md:flex-row gap-4 border-t border-slate-800">
            <button type="button" onClick={onClose} className="flex-1 py-5 text-[12px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-all">Cancelar</button>
            {hasCRUDPermission && (
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[24px] text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-4 transition-all shadow-xl shadow-blue-600/30 active:scale-95 disabled:opacity-50 glow-blue"
              >
                {loading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                {loading ? 'SINCRONIZANDO...' : 'EFETIVAR LANÇAMENTO'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AWBModal;
