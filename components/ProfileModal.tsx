
import React, { useState } from 'react';
import { X, MessageSquare, MapPin, Briefcase, Edit3, User as UserIcon } from 'lucide-react';
import { User, ViewType } from '../types';
import UserModal from './UserModal';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onNavigate?: (view: ViewType) => void;
  onUserUpdate?: (updatedUser: User) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, onNavigate, onUserUpdate }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!isOpen) return null;

  const handleName = (user.name || user.USUÁRIO || 'Usuário');
  const userInitial = handleName.charAt(0).toUpperCase();

  const handleMessageClick = () => {
    if (onNavigate) {
      onNavigate('chat');
      onClose();
    }
  };

  const handleSaveSuccess = (updatedUser: User) => {
    if (onUserUpdate) {
      onUserUpdate(updatedUser);
    }
    setIsEditModalOpen(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-10 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
        <div className="bg-[#0c1425] w-full max-w-5xl rounded-[40px] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] border border-white/5 animate-in zoom-in-95 duration-200 flex flex-col md:flex-row h-full max-h-[600px]">
          
          {/* Lado Esquerdo - Identidade Minimalista e Moderna */}
          <div className="w-full md:w-2/5 bg-gradient-to-br from-[#1e293b] to-[#050a14] flex flex-col items-center justify-center p-12 relative overflow-hidden shrink-0">
             <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-600 rounded-full blur-[120px]" />
                <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-indigo-600 rounded-full blur-[120px]" />
             </div>

             <div className="w-48 h-48 bg-blue-600 rounded-[56px] flex items-center justify-center text-white text-8xl font-[900] italic shadow-2xl shadow-blue-600/30 z-10 border border-white/10">
                {userInitial}
             </div>
             
             <div className="mt-10 text-center z-10">
                <h2 className="text-4xl font-[900] text-white tracking-tighter uppercase italic">{handleName}</h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <p className="text-slate-500 font-black text-[10px] tracking-[0.4em] uppercase">OPERADOR ONLINE</p>
                </div>
             </div>
          </div>

          {/* Lado Direito - Conteúdo Informativo Expandido */}
          <div className="flex-1 p-8 md:p-16 flex flex-col justify-between bg-[#0c1425] relative">
             
             {/* Botão de Fechar */}
             <button 
                onClick={onClose} 
                className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-full transition-all border border-white/5"
             >
                <X size={20} />
             </button>

             <div className="space-y-12">
                {/* Cabeçalho Interno */}
                <div className="space-y-1">
                   <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] italic">Registro Funcional</span>
                   <h3 className="text-white text-2xl font-black uppercase tracking-tight">Dossiê do Colaborador</h3>
                </div>

                {/* Seção Bio */}
                <div className="space-y-4">
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] italic opacity-50 flex items-center gap-2">
                      <Edit3 size={10} /> Bio Operacional
                   </p>
                   <p className="text-slate-300 text-lg leading-relaxed font-bold tracking-tight max-w-2xl">
                      {user.bio || "Nenhuma biografia detalhada foi registrada para este operador no sistema."}
                   </p>
                </div>

                {/* Info Cards Estilo Badge */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="flex items-center gap-6 p-6 bg-slate-900/40 rounded-3xl border border-slate-800/50 group transition-all hover:bg-slate-900/60">
                      <div className="w-14 h-14 bg-[#050a14] rounded-2xl flex items-center justify-center text-slate-600 group-hover:text-blue-500 transition-colors border border-slate-800">
                        <MapPin size={24} strokeWidth={2.5} />
                      </div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] italic opacity-50">Localização</p>
                         <p className="text-white text-sm font-[900] uppercase tracking-tight">{user.location || "N/A"}</p>
                      </div>
                   </div>

                   <div className="flex items-center gap-6 p-6 bg-slate-900/40 rounded-3xl border border-slate-800/50 group transition-all hover:bg-slate-900/60">
                      <div className="w-14 h-14 bg-[#050a14] rounded-2xl flex items-center justify-center text-slate-600 group-hover:text-emerald-500 transition-colors border border-slate-800">
                        <Briefcase size={24} strokeWidth={2.5} />
                      </div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] italic opacity-50">Cargo / Função</p>
                         <p className="text-white text-sm font-[900] uppercase tracking-tight">{user.cargo || "OPERADOR"}</p>
                      </div>
                   </div>
                </div>
             </div>

             {/* Footer Buttons conforme Imagem */}
             <div className="mt-12 flex gap-6">
                <button 
                  onClick={handleMessageClick}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-[0.2em] py-6 rounded-[28px] shadow-2xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <MessageSquare size={18} strokeWidth={3} /> Iniciar Conversa
                </button>
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex-1 bg-[#1e293b] hover:bg-[#334155] text-white font-black text-xs uppercase tracking-[0.2em] py-6 rounded-[28px] transition-all flex items-center justify-center gap-3 active:scale-95 border border-white/5"
                >
                  <Edit3 size={18} strokeWidth={3} /> Editar Perfil
                </button>
             </div>

          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <UserModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          editingUser={user}
          onSave={handleSaveSuccess}
          theme="dark"
          isSelfEdit={true} // Força o modo de auto-edição (sem permissões)
        />
      )}
    </>
  );
};

export default ProfileModal;
