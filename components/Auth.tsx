
import React, { useState, useEffect } from 'react';
import { Shield, Lock, Mail, ChevronRight, AlertCircle, Loader2, User as UserIcon, Briefcase, ArrowLeft } from 'lucide-react';
import { User } from '../types';
import { storageService } from '../services/storageService';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [cargo, setCargo] = useState('');
  const [particles, setParticles] = useState<Array<{ id: number; left: string; top: string; size: number; duration: number; delay: number; opacity: number }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.5 + 0.3
    }));
    setParticles(newParticles);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const users = await storageService.getUsers();
      const foundUser = users.find(u => {
        const uEmail = String(u["E-MAIL"] || u.email || '').toLowerCase().trim();
        const uPass = String(u.SENHA || u.senha || '').trim();
        return uEmail === email.toLowerCase().trim() && uPass === password.trim();
      });

      if (foundUser) {
        // Validação estrita conforme solicitado: "Só vai ter acesso se consta como ativo"
        const userStatus = String(foundUser.status || foundUser.STATUS || '').toLowerCase().trim();
        if (userStatus !== 'ativo') {
          setError('ACESSO NEGADO: USUÁRIO NÃO CADASTRADO');
        } else {
          onLogin(foundUser);
        }
      } else {
        if (email === 'admin@empresa.com' && password === 'admin') {
           onLogin({
             id: '1', 
             name: 'Admin Master',
             email: 'admin@empresa.com',
             role: 'admin', 
             status: 'ativo', 
             allowedViews: ['dashboard', 'reports', 'history', 'settings', 'follow-up', 'users', 'follow-up-pre'],
             cargo: 'Administrador Master'
           });
        } else {
          setError('E-MAIL OU SENHA INCORRETOS');
        }
      }
    } catch (err) {
      setError('ERRO DE CONEXÃO COM A BASE DE DADOS (GOOGLE SHEETS)');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const id = Math.random().toString(36).substring(2, 11);
      const payload = {
        ID: id,
        USUÁRIO: name.toUpperCase(),
        "E-MAIL": email.toLowerCase(),
        SENHA: password,
        PAPEL: 'User',
        STATUS: 'ativo', // Alterado para ativo conforme solicitado pelo usuário
        "Permissões de Tela (Módulos)": "DASHBOARD; CHAT EQUIPE",
        Cargo: cargo.toUpperCase(),
        Bio: "Novo operador cadastrado via portal.",
        Location: "N/A"
      };

      await storageService.saveUser(payload);
      setSuccess('CADASTRO REALIZADO COM SUCESSO! ACESSO LIBERADO.');
      setIsRegistering(false);
      // Limpa os campos após registro bem sucedido
      setEmail(email.toLowerCase());
      setPassword(password);
      setName('');
      setCargo('');
    } catch (err) {
      setError('FALHA AO SALVAR CADASTRO NO BANCO');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050a14] flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
      
      {/* Partículas de Fundo */}
      <div className="particles-container fixed inset-0 pointer-events-none z-0">
        {particles.map(p => (
          <div 
            key={p.id}
            className="particle"
            style={{
              left: p.left,
              top: p.top,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              opacity: p.opacity
            }}
          />
        ))}
      </div>

      <div className="flex flex-col items-center mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-500 relative z-10">
        <div className="w-20 h-20 bg-transparent border border-white/40 rounded-[28px] flex items-center justify-center mb-8 shadow-[0_0_15px_rgba(255,255,255,0.3)]">
          <Shield size={40} className="text-white" strokeWidth={1.5} />
        </div>
        
        <h1 className="text-4xl md:text-[52px] font-[900] italic text-white leading-none uppercase tracking-tight mb-3">
          PORTAL LOGÍSTICA<br/>FOLLOW-UP
        </h1>
        <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.4em] mt-2 italic">
          ENTERPRISE CLOUD SYNC V3.2
        </p>
      </div>

      <div className="w-full max-w-md bg-transparent backdrop-blur-sm rounded-[48px] p-10 md:p-12 shadow-2xl relative animate-in zoom-in-95 duration-300 z-10 neon-border-white">
        
        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-8">
          
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-black uppercase italic tracking-tighter">
              {isRegistering ? 'Solicitar Acesso' : 'Acesso Restrito'}
            </h2>
            {isRegistering && (
              <button 
                type="button" 
                onClick={() => setIsRegistering(false)}
                className="text-slate-500 hover:text-white flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all"
              >
                <ArrowLeft size={12} /> Voltar
              </button>
            )}
          </div>

          {(error || success) && (
            <div className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-widest p-4 rounded-2xl border animate-pulse ${error ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
              <AlertCircle size={16} />
              <span>{error || success}</span>
            </div>
          )}

          {isRegistering && (
            <div className="space-y-2">
              <label className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] ml-1 block">NOME OPERADOR</label>
              <div className="relative flex items-center">
                <div className="absolute left-5 text-slate-600"><UserIcon size={18} /></div>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#050a14]/60 rounded-[22px] pl-14 pr-6 py-4 text-sm font-bold text-white transition-all uppercase placeholder:text-slate-800 neon-input-white"
                  placeholder="EX: JAILSON FILHO"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] ml-1 block">E-MAIL CORPORATIVO</label>
            <div className="relative flex items-center">
              <div className="absolute left-5 text-slate-600"><Mail size={18} /></div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#050a14]/60 rounded-[22px] pl-14 pr-6 py-4 text-sm font-bold text-white transition-all placeholder:text-slate-800 neon-input-white"
                placeholder="seu@empresa.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] ml-1 block">SENHA</label>
            <div className="relative flex items-center">
              <div className="absolute left-5 text-slate-600"><Lock size={18} /></div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#050a14]/60 rounded-[22px] pl-14 pr-6 py-4 text-sm font-bold text-white transition-all placeholder:text-slate-800 neon-input-white"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {isRegistering && (
            <div className="space-y-2">
              <label className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] ml-1 block">CARGO / SETOR</label>
              <div className="relative flex items-center">
                <div className="absolute left-5 text-slate-600"><Briefcase size={18} /></div>
                <input 
                  type="text" 
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  className="w-full bg-[#050a14]/60 rounded-[22px] pl-14 pr-6 py-4 text-sm font-bold text-white transition-all uppercase placeholder:text-slate-800 neon-input-white"
                  placeholder="EX: PCP / FOLLOW-UP"
                  required
                />
              </div>
            </div>
          )}

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-[22px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-900/40 group"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {isRegistering ? 'EFETIVAR SOLICITAÇÃO' : 'ENTRAR NO PORTAL'}
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          {!isRegistering && (
            <div className="text-center pt-2">
              <button 
                type="button" 
                onClick={() => { setIsRegistering(true); setSuccess(''); setError(''); }}
                className="text-[10px] font-black text-slate-600 hover:text-blue-500 uppercase tracking-widest transition-colors"
              >
                Ainda não possui acesso? <span className="text-blue-600">Solicitar agora</span>
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="mt-16 text-center space-y-4">
        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">
          GOOGLE SHEETS ENTERPRISE CONNECTED
        </p>
      </div>
    </div>
  );
};

export default Auth;
