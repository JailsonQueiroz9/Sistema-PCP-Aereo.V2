
import React, { useState, useEffect } from 'react';
import { X, Save, User as UserIcon, Mail, Lock, RotateCw, Layout, BarChart, History, Settings, Zap, MessageSquare, MapPin, AlignLeft, Briefcase, Edit3 } from 'lucide-react';
import { User, ViewType } from '../types';
import { storageService } from '../services/storageService';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  editingUser?: User;
  theme: 'dark' | 'light';
  isSelfEdit?: boolean;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, editingUser, theme, isSelfEdit = false }) => {
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    senha: '',
    role: 'user',
    status: 'ativo',
    allowedViews: ['dashboard'],
    bio: '',
    location: '',
    birthday: '',
    cargo: '',
    profileImage: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingUser) {
      setFormData({
        ...editingUser,
        name: editingUser.name || editingUser.USUÁRIO || '',
        email: editingUser.email || editingUser['E-MAIL'] || '',
        senha: editingUser.senha || editingUser.SENHA || '',
        allowedViews: editingUser.allowedViews || ['dashboard'],
        bio: editingUser.bio || editingUser.Bio || '',
        location: editingUser.location || editingUser.Location || '',
        birthday: editingUser.birthday || editingUser.Birthday || '',
        cargo: editingUser.cargo || editingUser.Cargo || '',
        profileImage: editingUser.profileImage || ''
      });
    } else {
      setFormData({
        name: '', email: '', senha: '', role: 'user', status: 'ativo',
        allowedViews: ['dashboard'], bio: '', location: '', birthday: '',
        cargo: '', profileImage: ''
      });
    }
    setError('');
  }, [editingUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const id = editingUser?.id || editingUser?.ID || Math.random().toString(36).substring(2, 11);
    
    // Mapeamento App -> Planilha
    const viewMapping: Record<ViewType, string> = {
      dashboard: 'DASHBOARD',
      reports: 'RELATORIOS',
      history: 'HISTORICO',
      chat: 'CHAT EQUIPE',
      'follow-up': 'FOLLOW-UP',
      settings: 'CONFIGURAÇÕES'
    };

    const allowedViews = formData.allowedViews || ['dashboard'];
    const permsString = allowedViews.map(v => viewMapping[v]).join('; ');

    const payload = {
      ID: id,
      USUÁRIO: formData.name || '',
      "E-MAIL": formData.email || '',
      SENHA: formData.senha || '',
      PAPEL: formData.role === 'admin' ? 'Admin' : 'User',
      STATUS: formData.status || 'ativo',
      "Permissões de Tela (Módulos)": permsString,
      Bio: formData.bio || '',
      Location: formData.location || '',
      Birthday: formData.birthday || '',
      Cargo: formData.cargo || '',
      profileImage: formData.profileImage || ''
    };

    try {
      await storageService.saveUser(payload);
      // Retorna o objeto User formatado para o estado local
      onSave({
        ...formData,
        id,
        allowedViews,
        bio: formData.bio,
        location: formData.location,
        cargo: formData.cargo
      } as User);
      onClose();
    } catch (err) {
      console.error("Erro ao salvar no banco de dados:", err);
      setError('Falha na sincronização com o banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleViewPermission = (view: ViewType) => {
    const current = formData.allowedViews || [];
    const updated = current.includes(view)
      ? current.filter(v => v !== view)
      : [...current, view];
    setFormData(prev => ({ ...prev, allowedViews: updated as ViewType[] }));
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-[#1e2535] w-full max-w-2xl rounded-[40px] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-[#0c1425]/50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                <Edit3 size={20} />
             </div>
             <div>
                <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
                  {isSelfEdit ? 'Meu Perfil' : 'Configurar Operador'}
                </h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1 italic">
                   {isSelfEdit ? 'Ajuste seus dados pessoais' : 'Sincronização Direta com Google Sheets'}
                </p>
             </div>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl hover:bg-slate-800 text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
          
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-rose-500 text-[10px] font-black uppercase tracking-widest text-center animate-pulse">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] border-b border-slate-800 pb-2 italic">1. Identidade e Acesso</h3>
            <div className={`grid ${isSelfEdit ? 'grid-cols-1' : 'grid-cols-2'} gap-6`}>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><UserIcon size={12} /> Nome de Exibição</label>
                <input required name="name" value={formData.name} onChange={handleChange} className="w-full bg-[#0d111a] border border-slate-800 rounded-xl px-4 py-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500 uppercase transition-all" />
              </div>
              
              {!isSelfEdit && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Lock size={12} /> Senha de Segurança</label>
                  <input required type="password" name="senha" value={formData.senha} onChange={handleChange} className="w-full bg-[#0d111a] border border-slate-800 rounded-xl px-4 py-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all" />
                </div>
              )}
            </div>

            {!isSelfEdit && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Mail size={12} /> E-mail Profissional</label>
                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-[#0d111a] border border-slate-800 rounded-xl px-4 py-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-all" />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] border-b border-slate-800 pb-2 italic">2. Perfil Operacional</h3>
            <div className="space-y-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><AlignLeft size={12} /> Biografia do Operador</label>
                  <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className="w-full bg-[#0d111a] border border-slate-800 rounded-xl px-4 py-4 text-xs font-bold text-white focus:border-blue-500 outline-none transition-all resize-none" placeholder="Descrição da função e competências..." />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><MapPin size={12} /> Hub / Localização</label>
                    <input name="location" value={formData.location} onChange={handleChange} className="w-full bg-[#0d111a] border border-slate-800 rounded-xl px-4 py-4 text-xs font-bold text-white focus:border-blue-500 uppercase transition-all" placeholder="Ex: ITB-BA" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Briefcase size={12} /> Cargo / Função</label>
                    <input name="cargo" value={formData.cargo} onChange={handleChange} className="w-full bg-[#0d111a] border border-slate-800 rounded-xl px-4 py-4 text-xs font-bold text-white focus:border-blue-500 uppercase transition-all" placeholder="Ex: ANALISTA FOLLOW-UP" />
                  </div>
               </div>
            </div>
          </div>

          {!isSelfEdit && (
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] border-b border-slate-800 pb-2 italic">3. Controle de Módulos Autorizados</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: <Layout size={14} /> },
                  { id: 'reports', label: 'Relatórios', icon: <BarChart size={14} /> },
                  { id: 'history', label: 'Histórico', icon: <History size={14} /> },
                  { id: 'chat', label: 'Chat Equipe', icon: <MessageSquare size={14} /> },
                  { id: 'follow-up', label: 'Follow-UP', icon: <Zap size={14} /> },
                  { id: 'settings', label: 'Config', icon: <Settings size={14} /> },
                ].map(view => {
                  const isActive = formData.allowedViews?.includes(view.id as ViewType);
                  return (
                    <button 
                      key={view.id} 
                      type="button" 
                      onClick={() => toggleViewPermission(view.id as ViewType)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                        isActive 
                          ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                          : 'bg-slate-900/50 border-slate-800 text-slate-700 opacity-60'
                      }`}
                    >
                      {view.icon} {view.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-6 flex flex-col md:flex-row gap-4 border-t border-slate-800">
             <button type="button" onClick={onClose} className="flex-1 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-all">Cancelar</button>
             <button 
              type="submit" 
              disabled={loading} 
              className="flex-[2] py-5 text-[11px] font-black uppercase tracking-[0.2em] text-white bg-blue-600 rounded-[24px] hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
             >
               {loading ? <RotateCw className="animate-spin" size={20} /> : <Save size={20} />} 
               {loading ? 'Sincronizando Banco...' : 'Confirmar Sincronização'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
