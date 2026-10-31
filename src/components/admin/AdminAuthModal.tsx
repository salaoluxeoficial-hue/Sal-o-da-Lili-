import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Default admin credential validation (or any valid email/password pair)
    const validEmail = email.trim().toLowerCase() === 'admin@salaoluxe.com' || email.trim().toLowerCase() === 'admin';
    const validPassword = password === 'admin' || password === 'luxe123' || password.length >= 4;

    if (validEmail && validPassword) {
      onLoginSuccess();
    } else {
      setError('Credenciais inválidas. Utilize e-mail e senha de administrador cadastrados.');
    }
  };

  const handleQuickMasterLogin = () => {
    setEmail('admin@salaoluxe.com');
    setPassword('admin');
    onLoginSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#0e0e0e] border border-[#d4af37]/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" />

        {/* Header */}
        <div className="text-center space-y-2 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#8a7122] flex items-center justify-center text-black font-extrabold mx-auto shadow-lg shadow-[#d4af37]/20">
            <Lock size={26} />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Área Restrita</h2>
          <p className="text-neutral-400 text-xs">
            Acesso exclusivo para administradores e equipe autorizada do Salão Luxe.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Mail size={13} className="text-[#d4af37]" />
              E-mail Administrativo
            </label>
            <input
              type="text"
              required
              placeholder="admin@salaoluxe.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#161616] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/60 transition-all placeholder:text-neutral-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound size={13} className="text-[#d4af37]" />
              Senha de Acesso
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#161616] border border-white/10 rounded-xl py-3 pl-3 pr-10 text-white text-xs focus:outline-none focus:border-[#d4af37]/60 transition-all placeholder:text-neutral-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#b8860b] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[#d4af37]/20 flex items-center justify-center gap-2 mt-2"
          >
            <ShieldCheck size={16} />
            Entrar no Painel Gerencial
          </button>
        </form>

        {/* Quick Demo Access Button */}
        <div className="pt-4 border-t border-white/10 space-y-2 relative z-10 text-center">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold block">
            Ambiente de Testes / Liberação Rápida:
          </span>
          <button
            type="button"
            onClick={handleQuickMasterLogin}
            className="w-full py-2 bg-white/5 hover:bg-[#d4af37]/20 border border-white/10 hover:border-[#d4af37]/30 text-neutral-300 hover:text-[#d4af37] text-xs font-bold rounded-xl transition-all"
          >
            ⚡ Acesso Imediato como Admin Master
          </button>
        </div>

        {/* Return to Public Area */}
        <div className="text-center pt-2 relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 mx-auto transition-colors"
          >
            <ArrowLeft size={14} /> Voltar para Área Pública
          </button>
        </div>
      </div>
    </div>
  );
};
