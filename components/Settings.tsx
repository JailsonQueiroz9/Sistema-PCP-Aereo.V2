
import React, { useState } from 'react';
import { 
  UserPlus, 
  Edit3, 
  Trash2, 
  Search,
  Shield,
  Loader2,
  User as UserIcon,
  Layout,
  BarChart,
  History,
  Settings as SettingsIcon,
  Zap,
  MessageSquare
} from 'lucide-react';
import { User, ViewType } from '../types';
import { storageService } from '../services/storageService';
import UserModal from './UserModal';

interface SettingsProps {
  theme: 'dark' | 'light';
  users: User[];
  onRefreshUsers: () => void;
}

const Settings: React.FC<SettingsProps> = ({ theme, users, onRefreshUsers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const handleDeleteUser = async (id: string) => {
    if (confirm('Deseja realmente EXCLUIR este acesso permanentemente?')) {
      setDeletingUserId(id);
      try {
        await storageService.deleteRecord(id, "CADASTRO USUÁRIO");
        onRefreshUsers();
      } catch (error) {
        console.error("Erro ao deletar usuário:", error);
      } finally {
        setDeletingUserId(null);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name || u.USUÁRIO || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || u['E-MAIL'] || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-[#050a14]">
      
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Cabeçalho de Gestão */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20 text-blue-500 shadow-xl">
              <Shield size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">Configurações de Acesso</h1>
              <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.4em] mt-1">Gerenciamento de Operadores e Permissões</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group w-full md:w-80">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="BUSCAR OPERADOR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0c1425] border border-slate-800 text-white rounded-xl pl-12 pr-4 py-3 text-[10px] font-black focus:outline-none focus:border-blue-500 transition-all uppercase tracking-widest placeholder:text-slate-800"
              />
            </div>
            <button 
              onClick={() => { setEditingUser(undefined); setIsUserModalOpen(true); }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg glow-blue active:scale-95 shrink-0"
            >
              <UserPlus size={16} /> NOVO USUÁRIO
            </button>
          </div>
        </div>

        {/* Lista de Usuários Estilo Profissional com Módulos Autorizados */}
        <div className="space-y-4">
          {filteredUsers.map((u) => (
            <div 
              key={u.id} 
              className="group bg-[#0c1425]/40 border border-slate-900 rounded-[32px] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-8 hover:bg-white/5 transition-all shadow-xl"
            >
              {/* LADO ESQUERDO: Perfil do Operador */}
              <div className="flex items-center gap-6 min-w-[300px]">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-600/20 shrink-0">
                  {(u.name || u.USUÁRIO || '?').charAt(0).toUpperCase()}
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="text-base font-black text-white uppercase tracking-tight">
                    {u.name || u.USUÁRIO}
                  </span>
                  <span className="text-xs text-slate-500 font-bold lowercase tracking-tight opacity-70">
                    {u.email || u['E-MAIL']}
                  </span>
                </div>
              </div>

              {/* CENTRO: Telas Autorizadas conforme Imagem */}
              <div className="flex flex-col gap-4">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] italic ml-1">Telas Autorizadas</span>
                <div className="flex items-center gap-3">
                  <PermissionModule active={u.allowedViews?.includes('dashboard')} icon={<Layout size={18} />} label="DSH" />
                  <PermissionModule active={u.allowedViews?.includes('reports')} icon={<BarChart size={18} />} label="REP" />
                  <PermissionModule active={u.allowedViews?.includes('history')} icon={<History size={18} />} label="HST" />
                  <PermissionModule active={u.allowedViews?.includes('chat')} icon={<MessageSquare size={18} />} label="CHT" />
                  <PermissionModule active={u.allowedViews?.includes('follow-up')} icon={<Zap size={18} />} label="FOL" />
                  <PermissionModule active={u.allowedViews?.includes('settings')} icon={<SettingsIcon size={18} />} label="CFG" />
                </div>
              </div>

              {/* LADO DIREITO: Ações e Status */}
              <div className="flex items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 border-slate-900 pt-4 lg:pt-0">
                <div className="flex flex-col items-end gap-1 px-4">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'text-blue-500' : 'text-slate-600'}`}>
                    {u.role === 'admin' ? 'NÍVEL: ADMIN' : 'NÍVEL: USER'}
                  </span>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${u.status === 'ativo' ? 'text-emerald-500 border-emerald-900/30' : 'text-rose-500 border-rose-900/30'}`}>
                    {u.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }}
                    className="p-3.5 text-slate-600 hover:text-blue-500 hover:bg-blue-500/10 rounded-2xl border border-transparent hover:border-blue-500/20 transition-all"
                  >
                    <Edit3 size={20} />
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(u.id)}
                    disabled={deletingUserId === u.id}
                    className="p-3.5 text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl border border-transparent hover:border-rose-500/20 transition-all disabled:opacity-20"
                  >
                    {deletingUserId === u.id ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="py-24 text-center border-2 border-dashed border-slate-900 rounded-[32px]">
              <UserIcon size={48} className="mx-auto text-slate-800 mb-4 opacity-20" />
              <p className="text-slate-700 text-[10px] font-black uppercase tracking-[0.5em] italic">Nenhum operador encontrado na base de dados</p>
            </div>
          )}
        </div>

      </div>

      <UserModal 
        isOpen={isUserModalOpen} 
        onClose={() => { setIsUserModalOpen(false); setEditingUser(undefined); }} 
        onSave={onRefreshUsers} 
        editingUser={editingUser}
        theme={theme} 
      />
    </div>
  );
};

/* Componente Auxiliar para o Ícone de Permissão Modular */
const PermissionModule = ({ active, icon, label }: { active?: boolean, icon: any, label: string }) => (
  <div className={`
    w-14 h-14 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all duration-300
    ${active 
      ? 'bg-blue-600/5 border-blue-600 text-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)] scale-100' 
      : 'bg-transparent border-slate-800/60 text-slate-800 opacity-30'}
  `}>
     <div className="scale-75">{icon}</div>
     <span className="text-[7px] font-black tracking-tighter uppercase">{label}</span>
  </div>
);

export default Settings;
