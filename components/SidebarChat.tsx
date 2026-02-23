
import React, { useState } from 'react';
import { 
  Users, Plus, Search, Hash, AtSign, 
  ChevronDown, MessageSquare, Clock
} from 'lucide-react';
import { ChatGroup, User } from '../types';
import { storageService } from '../services/storageService';

interface SidebarChatProps {
  currentUser: User | null;
  users: User[];
  groups: ChatGroup[];
  activeSession: ChatGroup;
  onSelect: (session: ChatGroup) => void;
  onAddGroup: () => void;
  unreadMap: Record<string, number>;
  previews: Record<string, string>;
}

const SidebarChat: React.FC<SidebarChatProps> = ({ 
  currentUser, users, groups, activeSession, onSelect, onAddGroup, unreadMap, previews 
}) => {
  const [q, setQ] = useState('');

  const filteredUsers = users.filter(u => 
    u.id !== currentUser?.id && 
    (u.name || '').toLowerCase().includes(q.toLowerCase())
  );

  return (
    <aside className="w-80 border-r border-white/5 bg-[#0c1425] flex flex-col shrink-0">
      <div className="p-8 border-b border-white/5 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <MessageSquare size={18} className="text-blue-500" />
             <h2 className="text-white font-black uppercase text-[10px] tracking-[0.3em] italic">Comunicações</h2>
          </div>
          <button 
            onClick={onAddGroup} 
            className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
            title="Criar novo grupo operacional"
          >
            <Plus size={16} />
          </button>
        </div>
        
        <div className="relative group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700" />
          <input 
            type="text" 
            placeholder="BUSCAR EQUIPE..."
            className="w-full bg-[#050a14] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[9px] font-black text-white outline-none focus:border-blue-500 transition-all uppercase tracking-widest placeholder:text-slate-800"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        {/* GRUPOS */}
        <div className="space-y-4">
          <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] px-2 flex items-center gap-2">
            <Users size={10} /> Canais Operacionais
          </p>
          <div className="space-y-1">
            {groups.map(g => (
              <button 
                key={g.sheetName}
                onClick={() => onSelect(g)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative border ${activeSession.sheetName === g.sheetName ? 'bg-blue-600/10 border-blue-500/20 text-white' : 'text-slate-500 hover:bg-white/5 border-transparent'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${activeSession.sheetName === g.sheetName ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-900 border-white/5 text-slate-700'}`}>
                  <Hash size={18} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black uppercase truncate tracking-tight">{g.name}</p>
                    {unreadMap[g.sheetName] > 0 && (
                      <span className="bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                        {unreadMap[g.sheetName]}
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] opacity-40 truncate mt-0.5 italic">
                    {previews[g.sheetName] || "Sem mensagens recentes"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* DMs */}
        <div className="space-y-4">
          <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] px-2 flex items-center gap-2">
            <AtSign size={10} /> Mensagens Diretas
          </p>
          <div className="space-y-1">
            {filteredUsers.map(u => {
              const dmSheet = storageService.buildDM(currentUser?.name || '', u.name || '');
              const isActive = activeSession.sheetName === dmSheet;
              return (
                <button 
                  key={u.id}
                  onClick={() => onSelect({ name: u.name, sheetName: dmSheet, type: 'dm', unreadCount: 0, lastReadCount: 0 })}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative border ${isActive ? 'bg-emerald-600/10 border-emerald-500/20 text-white' : 'text-slate-500 hover:bg-white/5 border-transparent'}`}
                >
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border font-black text-[10px] ${isActive ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-900 border-white/5 text-slate-600'}`}>
                      {(u.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0c1425] rounded-full shadow-lg" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-black uppercase truncate tracking-tight">{u.name}</p>
                      {unreadMap[dmSheet] > 0 && (
                        <span className="bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                          {unreadMap[dmSheet]}
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] opacity-40 truncate mt-0.5">
                      {previews[dmSheet] || "Abrir chat privado"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-white/5 bg-[#050a14]/40">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-blue-600/20">
              {currentUser?.name?.charAt(0).toUpperCase() || "U"}
           </div>
           <div className="min-w-0">
              <p className="text-[9px] font-black text-white uppercase truncate">{currentUser?.name}</p>
              <p className="text-[7px] text-slate-600 font-bold uppercase tracking-widest">Sessão Operacional</p>
           </div>
        </div>
      </div>
    </aside>
  );
};

export default SidebarChat;
