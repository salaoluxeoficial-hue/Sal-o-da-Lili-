import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Heart, 
  Image as ImageIcon,
  MessageCircle,
  FileText
} from 'lucide-react';
import { Client, Service, ClientStatus } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  existingClient?: Client | null;
  services: Service[];
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
];

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingClient,
  services,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [status, setStatus] = useState<ClientStatus>('ativo');

  // Portal access credentials
  const [hasPortalAccess, setHasPortalAccess] = useState(true);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Preferences & Notes
  const [notes, setNotes] = useState('');
  const [preferences, setPreferences] = useState('');
  const [allergies, setAllergies] = useState('');
  const [favoriteServiceIds, setFavoriteServiceIds] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<'dados' | 'acesso' | 'preferencias'>('dados');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (existingClient) {
      setName(existingClient.name);
      setPhone(existingClient.phone);
      setWhatsapp(existingClient.whatsapp || existingClient.phone);
      setEmail(existingClient.email);
      setBirthDate(existingClient.birthDate || '');
      setPhotoUrl(existingClient.photoUrl || '');
      setStatus(existingClient.status || 'ativo');
      setHasPortalAccess(existingClient.hasPortalAccess ?? true);
      setPassword(existingClient.password || 'senha123');
      setNotes(existingClient.notes || '');
      setPreferences(existingClient.preferences || '');
      setAllergies(existingClient.allergies || '');
      setFavoriteServiceIds(existingClient.favoriteServiceIds || []);
    } else {
      setName('');
      setPhone('');
      setWhatsapp('');
      setEmail('');
      setBirthDate('');
      setPhotoUrl(AVATAR_PRESETS[0]);
      setStatus('ativo');
      setHasPortalAccess(true);
      setPassword('luxe' + Math.floor(1000 + Math.random() * 9000));
      setNotes('');
      setPreferences('');
      setAllergies('');
      setFavoriteServiceIds(services[0] ? [services[0].id] : []);
    }
    setActiveTab('dados');
    setErrorMessage(null);
  }, [existingClient, isOpen, services]);

  const handleCopyPhoneToWhatsapp = () => {
    setWhatsapp(phone);
  };

  const handleGeneratePassword = () => {
    const randomChars = Math.random().toString(36).slice(-6);
    setPassword(`Luxe@${randomChars}`);
  };

  const toggleFavorite = (serviceId: string) => {
    setFavoriteServiceIds(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Por favor, informe o nome completo do cliente.');
      setActiveTab('dados');
      return;
    }

    if (!phone.trim()) {
      setErrorMessage('Por favor, informe o telefone de contato.');
      setActiveTab('dados');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Por favor, informe o e-mail do cliente.');
      setActiveTab('dados');
      return;
    }

    if (hasPortalAccess && !password.trim()) {
      setErrorMessage('Defina uma senha de acesso para o portal do cliente.');
      setActiveTab('acesso');
      return;
    }

    const clientData: Client = {
      id: existingClient?.id || 'cli-' + Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      email: email.trim().toLowerCase(),
      birthDate: birthDate || undefined,
      photoUrl: photoUrl.trim() || undefined,
      status,
      hasPortalAccess,
      password: hasPortalAccess ? password : (existingClient?.password || 'senha123'),
      lastLoginAt: existingClient?.lastLoginAt,
      notes: notes.trim() || undefined,
      preferences: preferences.trim() || undefined,
      allergies: allergies.trim() || undefined,
      favoriteServiceIds,
      totalSpent: existingClient?.totalSpent || 0,
      lastVisit: existingClient?.lastVisit,
      createdAt: existingClient?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(clientData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#0c0c0c] border border-[#d4af37]/30 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="p-6 border-b border-[#d4af37]/15 flex items-center justify-between bg-gradient-to-r from-[#141414] to-[#0c0c0c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] border border-[#d4af37]/20">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {existingClient ? 'Editar Cadastro do Cliente' : 'Novo Cliente'}
              </h3>
              <p className="text-neutral-400 text-xs">
                {existingClient ? 'Atualize os dados cadastrais, acesso e preferências.' : 'Preencha os dados e credenciais para o portal do cliente.'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/5 bg-[#101010] px-6 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('dados')}
            className={cn(
              "px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2",
              activeTab === 'dados'
                ? "border-[#d4af37] text-[#d4af37]"
                : "border-transparent text-neutral-400 hover:text-white"
            )}
          >
            <User size={14} />
            1. Dados Pessoais
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('acesso')}
            className={cn(
              "px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2",
              activeTab === 'acesso'
                ? "border-[#d4af37] text-[#d4af37]"
                : "border-transparent text-neutral-400 hover:text-white"
            )}
          >
            <Lock size={14} />
            2. Acesso ao Portal & Status
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preferencias')}
            className={cn(
              "px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2",
              activeTab === 'preferencias'
                ? "border-[#d4af37] text-[#d4af37]"
                : "border-transparent text-neutral-400 hover:text-white"
            )}
          >
            <Heart size={14} />
            3. Preferências & Favoritos
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: DADOS PESSOAIS */}
          {activeTab === 'dados' && (
            <div className="space-y-5 animate-in fade-in">
              {/* Photo preview & Presets */}
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-neutral-800 border-2 border-[#d4af37]/40 overflow-hidden shrink-0 flex items-center justify-center">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User size={28} className="text-[#d4af37]" />
                  )}
                </div>
                <div className="space-y-2 w-full text-center sm:text-left">
                  <span className="text-xs font-bold text-neutral-300 block">Foto de Perfil</span>
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPhotoUrl(preset)}
                        className={cn(
                          "w-8 h-8 rounded-full overflow-hidden border-2 transition-all",
                          photoUrl === preset ? "border-[#d4af37] scale-110" : "border-transparent opacity-60 hover:opacity-100"
                        )}
                      >
                        <img src={preset} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <input
                    type="url"
                    placeholder="Ou cole a URL direta de uma foto..."
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#d4af37]/50"
                  />
                </div>
              </div>

              {/* Nome */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={13} className="text-[#d4af37]" />
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Alberto da Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#d4af37]/50"
                />
              </div>

              {/* Telefones & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone size={13} className="text-[#d4af37]" />
                    Telefone de Contato *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 98888-7777"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#d4af37]/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageCircle size={13} className="text-emerald-400" />
                      WhatsApp *
                    </label>
                    <button
                      type="button"
                      onClick={handleCopyPhoneToWhatsapp}
                      className="text-[11px] font-bold text-[#d4af37] hover:underline"
                    >
                      Mesmo que telefone
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="(11) 98888-7777"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#d4af37]/50"
                  />
                </div>
              </div>

              {/* E-mail & Data de Nascimento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail size={13} className="text-[#d4af37]" />
                    E-mail do Cliente *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="carlos@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#d4af37]/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={13} className="text-[#d4af37]" />
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#d4af37]/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACESSO AO PORTAL & STATUS */}
          {activeTab === 'acesso' && (
            <div className="space-y-5 animate-in fade-in">
              {/* Status do Cadastro (Ativar, Bloquear, Inativo) */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#d4af37]" />
                  Status da Conta do Cliente
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus('ativo')}
                    className={cn(
                      "p-3 rounded-xl border text-xs font-bold transition-all text-center",
                      status === 'ativo'
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10"
                        : "bg-[#141414] border-white/10 text-neutral-400 hover:text-white"
                    )}
                  >
                    Ativo (Liberado)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('bloqueado')}
                    className={cn(
                      "p-3 rounded-xl border text-xs font-bold transition-all text-center",
                      status === 'bloqueado'
                        ? "bg-rose-500/20 border-rose-500 text-rose-400 shadow-md shadow-rose-500/10"
                        : "bg-[#141414] border-white/10 text-neutral-400 hover:text-white"
                    )}
                  >
                    Bloqueado (Suspenso)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('inativo')}
                    className={cn(
                      "p-3 rounded-xl border text-xs font-bold transition-all text-center",
                      status === 'inativo'
                        ? "bg-neutral-500/20 border-neutral-500 text-neutral-300"
                        : "bg-[#141414] border-white/10 text-neutral-400 hover:text-white"
                    )}
                  >
                    Inativo (Sem Visitas)
                  </button>
                </div>
                {status === 'bloqueado' && (
                  <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    Clientes bloqueados não podem realizar agendamentos online ou no balcão até a liberação.
                  </p>
                )}
              </div>

              {/* Acesso Individual com E-mail e Senha */}
              <div className="p-5 bg-gradient-to-br from-[#141414] to-[#101010] border border-[#d4af37]/25 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Lock size={15} className="text-[#d4af37]" />
                      Acesso Individual à Área do Cliente
                    </h4>
                    <p className="text-xs text-neutral-400">
                      Permite que o cliente faça login com seu e-mail e senha para ver histórico e agendar online.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="portalCheckbox"
                    checked={hasPortalAccess}
                    onChange={(e) => setHasPortalAccess(e.target.checked)}
                    className="w-5 h-5 rounded text-[#d4af37] bg-black border-white/20 focus:ring-0 cursor-pointer"
                  />
                </div>

                {hasPortalAccess && (
                  <div className="pt-3 border-t border-white/5 space-y-4 animate-in fade-in">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                        E-mail de Login
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={email || '(Preencha o e-mail na aba Dados Pessoais)'}
                        className="w-full bg-black/40 border border-white/5 rounded-xl p-2.5 text-xs text-neutral-400 select-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                          Senha do Cliente *
                        </label>
                        <button
                          type="button"
                          onClick={handleGeneratePassword}
                          className="text-[11px] font-bold text-[#d4af37] hover:underline flex items-center gap-1"
                        >
                          <Sparkles size={12} />
                          Gerar Senha Segura
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required={hasPortalAccess}
                          placeholder="Mínimo de 6 caracteres"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-[#181818] border border-white/10 rounded-xl py-2.5 pl-3 pr-10 text-white text-sm focus:outline-none focus:border-[#d4af37]/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <span className="text-[11px] text-neutral-500">
                        O cliente usará este e-mail e senha para acessar sua conta pessoal.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PREFERÊNCIAS & SERVIÇOS FAVORITOS */}
          {activeTab === 'preferencias' && (
            <div className="space-y-5 animate-in fade-in">
              {/* Serviços Favoritos */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Serviços Favoritos do Cliente</span>
                  <span className="text-[11px] font-normal text-neutral-500">
                    {favoriteServiceIds.length} selecionado(s)
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1">
                  {services.map(s => {
                    const isFav = favoriteServiceIds.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => toggleFavorite(s.id)}
                        className={cn(
                          "p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between",
                          isFav
                            ? "bg-[#d4af37]/15 border-[#d4af37] text-white"
                            : "bg-white/5 border-white/5 text-neutral-400 hover:border-white/20"
                        )}
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-white">{s.name}</p>
                          <p className="text-[10px] text-neutral-400">{s.category} • {s.duration} min</p>
                        </div>
                        <Heart
                          size={16}
                          className={cn(
                            "transition-colors",
                            isFav ? "fill-[#d4af37] text-[#d4af37]" : "text-neutral-600"
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Preferências de Atendimento */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Preferências de Atendimento & Estilo
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Prefere corte com navalha e tesoura, água mineral com limão, sem música alta."
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/50 resize-none"
                />
              </div>

              {/* Alergias & Restrições */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Alergias, Sensibilidades ou Restrições Químicas
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Alergia a amônia, sensibilidade no couro cabeludo com água muito quente."
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full bg-[#141414] border border-rose-500/20 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-rose-500/50 resize-none"
                />
              </div>

              {/* Observações Internas */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Observações Internas (Visível apenas para a equipe)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Cliente VIP, aniversariante do mês ganha brinde de hidratação..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/50 resize-none"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/5 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-6 rounded-xl font-bold text-neutral-400 hover:bg-white/5 transition-all text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#d4af37] text-black py-3 px-6 rounded-xl font-bold text-xs hover:bg-[#d4af37]/90 transition-all shadow-lg shadow-[#d4af37]/10"
            >
              {existingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
