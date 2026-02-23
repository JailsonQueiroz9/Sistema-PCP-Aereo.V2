
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Chat from './components/Chat';
import Auth from './components/Auth';
import Reports from './components/Reports';
import Settings from './components/Settings';
import History from './components/History';
import FollowUp from './components/FollowUp';
import { User, ViewType, FilterState } from './types';
import { storageService } from './services/storageService';
import { AlertCircle, X, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    statuses: [],
    period: 'todos'
  });

  const loadUsers = async () => {
    try {
      const cloudUsers = await storageService.getUsers();
      if (cloudUsers.length > 0) {
        setUsersList(cloudUsers);
        localStorage.setItem('app_users', JSON.stringify(cloudUsers));
        
        // Se o usuário logado estiver na lista, atualiza os dados locais dele
        if (user) {
          const updatedSelf = cloudUsers.find(u => u.id === user.id);
          if (updatedSelf) {
            setUser(updatedSelf);
            localStorage.setItem('auth_user', JSON.stringify(updatedSelf));
          }
        }
      }
    } catch (e) {
      console.error("Erro ao sincronizar usuários:", e);
      setGlobalError("Erro de sincronização: A base de dados pode estar inacessível no momento.");
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const savedUser = localStorage.getItem('auth_user');
        const savedTheme = localStorage.getItem('app_theme') as 'dark' | 'light';
        
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {
            console.warn("Sessão corrompida, limpando...");
            localStorage.removeItem('auth_user');
          }
        }
        
        if (savedTheme) setTheme(savedTheme || 'dark');
        
        await loadUsers();
      } catch (err) {
        console.error("Falha crítica no boot:", err);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  const handleNavigate = (view: ViewType) => setCurrentView(view);

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    loadUsers(); // Recarrega a lista global
  };

  const handleToggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('app_theme', newTheme);
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#050a14] gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Iniciando Portal Logístico...</p>
      </div>
    );
  }

  if (!user) return <Auth onLogin={handleLogin} />;

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard filters={filters} />;
      case 'reports':
        return <Reports theme={theme} onBack={() => setCurrentView('dashboard')} />;
      case 'chat':
        return <Chat />;
      case 'settings':
        return <Settings theme={theme} users={usersList} onRefreshUsers={loadUsers} />;
      case 'history':
        return <History />;
      case 'follow-up':
        return <FollowUp filters={filters} />;
      default:
        return <Dashboard filters={filters} />;
    }
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden ${theme === 'dark' ? 'text-slate-200 bg-[#050a14]' : 'text-slate-900 bg-slate-50'}`}>
      
      {globalError && (
        <div className="fixed top-0 left-0 right-0 z-[200] bg-rose-600 text-white px-8 py-4 flex items-center justify-between shadow-2xl animate-in slide-in-from-top duration-500">
           <div className="flex items-center gap-4">
              <AlertCircle size={20} />
              <p className="text-[10px] font-black uppercase tracking-widest">{globalError}</p>
           </div>
           <div className="flex items-center gap-2">
             <button onClick={() => { setGlobalError(null); loadUsers(); }} className="p-2 hover:bg-white/10 rounded-lg transition-all flex items-center gap-2 text-[8px] font-bold uppercase">
                <RefreshCw size={14} /> Tentar Novamente
             </button>
             <button onClick={() => setGlobalError(null)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                <X size={16} />
             </button>
           </div>
        </div>
      )}

      <Sidebar 
        user={user} 
        onLogout={handleLogout} 
        currentView={currentView} 
        onNavigate={handleNavigate} 
        filters={filters} 
        onFilterChange={setFilters} 
        theme={theme} 
        onToggleTheme={handleToggleTheme}
        onUserUpdate={handleUserUpdate}
      />
      {renderContent()}
    </div>
  );
};

export default App;
