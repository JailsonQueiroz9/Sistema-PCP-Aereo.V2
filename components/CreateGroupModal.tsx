
import React, { useState, useMemo } from 'react';
import { X, Search, Users, Check, Loader2, Plus, Hash } from 'lucide-react';
import { User, GroupCreatePayload } from '../types';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User | null;
  onCreate: (payload: GroupCreatePayload) => Promise<void>;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ 
  isOpen, 
  onClose, 
  users, 
  currentUser,
  onCreate 
}) => {
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const availableUsers = useMemo(() => {
    return users.filter(u => u.id !== currentUser?.id && u.name !== currentUser?.name);
  }, [users, currentUser]);

  const filteredUsers = useMemo(() => {
    return availableUsers.filter(u => 
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableUsers, searchTerm]);

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedMembers.length === filteredUsers.length && filteredUsers.length > 0) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredUsers.map(u => u.id));
    }
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      alert("Por favor, insira um nome para o grupo.");
      return;
    }

    setIsLoading(true);
    try {
      const members = [...selectedMembers];
      if (currentUser?.id) members.push(currentUser.id);

      await onCreate({
        name: groupName.toUpperCase(),
        members: members
      });
      
      setGroupName('');
      setSelectedMembers([]);
      setSearchTerm('');
      onClose();
    } catch (error) {
      console.error("Erro ao criar grupo:", error);
      alert("Falha ao criar grupo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-[#0c1425] w-full max-w-lg rounded-[32px] border border-white/5 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-[#0c1425]/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20">
              <Plus size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">Criar Fluxo de Grupo</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1 italic">Gestão de Canais Operacionais</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 rounded-2xl hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-8 space-y-6">
          
          {/* Group Name Input */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Hash size={12} className="text-blue-500" /> Nome do Canal Operacional
            </label>
            <input 
              type="text" 
              placeholder="EX: LOGÍSTICA SÃO PAULO"
              className="w-full bg-[#050a14] border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-blue-600 outline-none uppercase tracking-widest transition-all placeholder:text-slate-800"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* User Search & Selection */}
          <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vincular Membros à Equipe</label>
              <button 
                onClick={toggleSelectAll}
                className="text-[9px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors"
              >
                {selectedMembers.length === filteredUsers.length && filteredUsers.length > 0 ? 'Desmarcar Todos' : 'Selecionar Filtro'}
              </button>
            </div>

            <div className="relative group">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="LOCALIZAR OPERADOR..."
                className="w-full bg-[#050a14] border border-white/5 rounded-xl pl-12 pr-4 py-3 text-[10px] font-black text-white outline-none focus:border-blue-500 transition-all uppercase tracking-widest placeholder:text-slate-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* User List Scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
              {filteredUsers.length === 0 ? (
                <div className="py-12 text-center opacity-20">
                  <Users size={32} className="mx-auto mb-2" />
                  <p className="text-[9px] font-black uppercase tracking-widest">Nenhum operador disponível</p>
                </div>
              ) : (
                filteredUsers.map(user => {
                  const isSelected = selectedMembers.includes(user.id);
                  return (
                    <button 
                      key={user.id}
                      onClick={() => toggleMember(user.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                        isSelected 
                          ? 'bg-blue-600/10 border-blue-500/30' 
                          : 'bg-[#050a14] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                        isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-800 text-transparent'
                      }`}>
                        <Check size={14} strokeWidth={3} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`text-[11px] font-black uppercase tracking-tight ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                          {user.name}
                        </p>
                        <p className="text-[9px] font-bold text-slate-600 truncate">{user.email}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-[#0c1425]/50 flex gap-4">
           <button 
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all"
           >
             Cancelar
           </button>
           <button 
            onClick={handleCreate}
            disabled={isLoading || !groupName.trim()}
            className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 active:scale-95"
           >
             {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
             {isLoading ? 'Sincronizando...' : 'Efetivar Grupo'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
