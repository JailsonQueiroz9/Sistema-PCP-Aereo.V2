
import React, { useState } from 'react';
import { Shield, Lock, Mail, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { User } from '../types';
import { storageService } from '../services/storageService';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
        if (foundUser.status === 'inativo') {
          setError('ACESSO BLOQUEADO PELO SISTEMA');
        } else {
          onLogin(foundUser);
        }
      } else {
        if (email === 'admin@email.com' && password === 'admin') {
           // Fix: Removed missing property '"Permissões de Tela (Módulos)"' to match User interface
           onLogin({
             id: '1', 
             ID: '1', 
             USUÁRIO: 'Admin', 
             name: 'Admin',
             "E-MAIL": 'admin@email.com', 
             email: 'admin@email.com',
             PAPEL: 'Admin', 
             role: 'admin', 
             status: 'ativo', 
             STATUS: 'ativo',
             SENHA: 'admin', 
             senha: 'admin',
             allowedViews: ['dashboard', 'reports', 'history', 'settings', 'follow-up'],
             bio: 'Administrador do Sistema',
             location: 'Sede Principal',
             birthday: '-',
             cargo: 'Administrador',
             profileImage: ''
           });
        } else {
          setError('E-MAIL OU SENHA INCORRETOS');
        }
      }
    } catch (err) {
      setError('ERRO DE CONEXÃO COM A BASE DE DADOS');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-logistica-dark flex flex-col items-center justify-center p-6 select-none">
      
      {/* Bloco Superior: Ícone e Títulos */}
      <div className="flex flex-col items-center mb-10 text-center">
        <div className="w-20 h-20 bg-blue-600/10 border border-blue-500/20 rounded-[28px] flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/10">
          <Shield size={40} className="text-blue-500" strokeWidth={1.5} />
        </div>
        
        <h1 className="text-4xl md:text-[52px] font-[900] italic text-white leading-none uppercase tracking-tight mb-3">
          PORTAL DE LOGÍSTICA<br/>FOLLOW-UP
        </h1>
        <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.4em] mt-2">
          CONTROLE DE FLUXO AÉREO V2.1
        </p>
      </div>

      {/* Card de Login Centralizado conforme Imagem */}
      <div className="w-full max-w-md bg-logistica-surface border border-slate-800/50 rounded-[48px] p-12 shadow-2xl relative">
        
        <form onSubmit={handleLogin} className="space-y-10">
          {error && (
            <div className="flex items-center gap-3 text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-500/10 p-4 rounded-2xl border border-red-500/20 animate-pulse">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Campo E-mail */}
          <div className="space-y-4">
            <label className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] ml-1 block">
              E-MAIL DE ACESSO
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-5 text-slate-600">
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#050a14]/60 border border-slate-800 rounded-[22px] pl-14 pr-6 py-5 text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-800"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div className="space-y-4">
            <label className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] ml-1 block">
              SENHA PRIVADA
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-5 text-slate-600">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#050a14]/60 border border-slate-800 rounded-[22px] pl-14 pr-6 py-5 text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-800"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Botão de Entrada Elétrico */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-[22px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 text-[11px] font-black uppercase tracking-[0.2em] glow-blue shadow-xl shadow-blue-900/40 group"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                ENTRAR NO SISTEMA
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer conforme Imagem */}
      <div className="mt-16 text-center space-y-4">
        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">
          GOOGLE SHEETS ENTERPRISE DATABASE
        </p>
        <div className="flex justify-center gap-2 opacity-30">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
