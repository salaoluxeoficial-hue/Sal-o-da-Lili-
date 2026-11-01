import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowLeft, KeyRound, Loader2 } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';

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
  const [email, setEmail] = useState('salaoluxe.oficial@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('E-mail ou senha incorretos. Verifique suas credenciais.');
        } else {
          setError(authError.message || 'Falha na autenticação via Supabase Auth.');
        }
        setLoading(false);
        return;
      }

      const user = authData?.user;
      if (!user) {
        setError('Usuário não encontrado na resposta de autenticação.');
        setLoading(false);
        return;
      }

      // 2. Query public.user_roles by user.id
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (roleError) {
        console.warn('Aviso ao consultar user_roles:', roleError.message);
      }

      const userRole = roleData?.role;

      // 3. Verify if user is admin strictly via user_roles table
      const isAdmin = userRole === 'admin';

      if (isAdmin) {
        onLoginSuccess();
      } else {
        await supabase.auth.signOut();
        setError('Acesso negado: Este usuário não possui a função de administrador ("admin") cadastrada no Supabase.');
      }
    } catch (err: any) {
      console.error('Erro ao realizar login admin:', err);
      setError(err?.message || 'Ocorreu um erro inesperado durante a autenticação.');
    } finally {
      setLoading(false);
    }
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
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Área Restrita Admin</h2>
          <p className="text-neutral-400 text-xs">
            Autenticação via Supabase Auth. Acesso exclusivo para administradores autorizados.
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
              type="email"
              required
              placeholder="salaoluxe.oficial@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full bg-[#161616] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/60 transition-all placeholder:text-neutral-600 disabled:opacity-50"
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
                disabled={loading}
                className="w-full bg-[#161616] border border-white/10 rounded-xl py-3 pl-3 pr-10 text-white text-xs focus:outline-none focus:border-[#d4af37]/60 transition-all placeholder:text-neutral-600 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors disabled:opacity-50"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#b8860b] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[#d4af37]/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                <span>Entrar no Painel Gerencial</span>
              </>
            )}
          </button>
        </form>

        {/* Return to Public Area */}
        <div className="text-center pt-2 relative z-10">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 mx-auto transition-colors disabled:opacity-50"
          >
            <ArrowLeft size={14} /> Voltar para Área Pública
          </button>
        </div>
      </div>
    </div>
  );
};
