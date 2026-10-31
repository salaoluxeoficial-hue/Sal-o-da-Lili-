import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Headphones, 
  Upload, 
  Trash2, 
  ZoomIn, 
  Move, 
  Palette, 
  CheckCircle2, 
  RotateCcw, 
  Sliders, 
  Save, 
  Eye, 
  ShieldCheck,
  Image as ImageIcon
} from 'lucide-react';
import { 
  ChatBrandingSettings, 
  DEFAULT_CHAT_BRANDING, 
  LUXURY_ACCENT_COLORS, 
  getInitialChatBranding, 
  saveChatBranding,
  ChatAppearanceConfig
} from '@/src/services/chatBrandingStorage';
import { ChatAvatar } from '@/src/components/chat/ChatAvatar';
import { cn } from '@/src/lib/utils';

export const ChatBrandingManager: React.FC = () => {
  const [branding, setBranding] = useState<ChatBrandingSettings>(() => getInitialChatBranding());
  const [activeChatTab, setActiveChatTab] = useState<'ai' | 'reception'>('ai');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleSync = () => {
      setBranding(getInitialChatBranding());
    };
    window.addEventListener('salao-luxe-branding-sync', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('salao-luxe-branding-sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const currentConfig: ChatAppearanceConfig = activeChatTab === 'ai' 
    ? branding.aiAssistant 
    : branding.receptionChat;

  const updateCurrentConfig = (updates: Partial<ChatAppearanceConfig>) => {
    setBranding(prev => {
      const updated = {
        ...prev,
        [activeChatTab === 'ai' ? 'aiAssistant' : 'receptionChat']: {
          ...currentConfig,
          ...updates,
        },
      };
      return updated;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem é muito grande. Escolha uma imagem de até 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        updateCurrentConfig({
          avatarUrl: result,
          zoom: 1.0,
          positionX: 50,
          positionY: 50,
        });
        showToast('Foto carregada com sucesso! Ajuste o zoom e posição abaixo.');
      }
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    updateCurrentConfig({
      avatarUrl: '',
      zoom: 1.0,
      positionX: 50,
      positionY: 50,
    });
    showToast('Foto personalizada removida. Restaurado ícone de luxo.');
  };

  const handleSave = () => {
    saveChatBranding(branding);
    showToast('Configurações visuais dos atendimentos salvas e aplicadas em tempo real!');
  };

  const handleResetDefaults = () => {
    if (confirm('Deseja restaurar as configurações originais de ambos os atendimentos?')) {
      saveChatBranding(DEFAULT_CHAT_BRANDING);
      setBranding(DEFAULT_CHAT_BRANDING);
      showToast('Configurações restauradas para o padrão de fábrica.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161616] border border-[#d4af37] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 size={18} className="text-[#d4af37]" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#101010] border border-[#d4af37]/25 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Personalização dos Chats & Atendimentos
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30">
              Painel VIP
            </span>
          </div>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1">
            Altere fotos de perfil, enquadramento, zoom, nomes, descrições e cores de destaque do Assistente IA e da Recepção.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 rounded-2xl text-xs font-bold transition-all"
            title="Restaurar padrão"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Restaurar</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#d4af37] hover:bg-[#b8860b] text-black font-extrabold rounded-2xl text-xs transition-all shadow-lg shadow-[#d4af37]/20"
          >
            <Save size={16} />
            <span>Salvar Alterações</span>
          </button>
        </div>
      </div>

      {/* Chat Selector Tabs */}
      <div className="flex bg-[#0d0d0d] border border-white/10 rounded-2xl p-1.5 gap-2">
        <button
          onClick={() => setActiveChatTab('ai')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2.5",
            activeChatTab === 'ai'
              ? "bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Sparkles size={16} />
          <span>1. Assistente IA Luxe</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/20 text-black font-semibold uppercase hidden sm:inline">
            Flutuante Público
          </span>
        </button>

        <button
          onClick={() => setActiveChatTab('reception')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2.5",
            activeChatTab === 'reception'
              ? "bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Headphones size={16} />
          <span>2. Atendimento Luxe (Recepção)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/20 text-black font-semibold uppercase hidden sm:inline">
            Humano / Portais
          </span>
        </button>
      </div>

      {/* Editor Grid: Controls on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-7 bg-[#111111] border border-[#d4af37]/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {activeChatTab === 'ai' ? <Sparkles size={18} className="text-[#d4af37]" /> : <Headphones size={18} className="text-[#d4af37]" />}
                Configurar: {currentConfig.name}
              </h3>
              <p className="text-neutral-400 text-xs mt-0.5">
                Envie uma foto personalizada ou mantenha o ícone representativo.
              </p>
            </div>
          </div>

          {/* Photo Upload Section */}
          <div className="space-y-4 p-5 rounded-2xl bg-black/40 border border-white/5">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
              Foto de Perfil do Atendimento
            </span>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Circular Avatar Preview with framed border */}
              <div className="relative group">
                <ChatAvatar 
                  config={currentConfig} 
                  type={activeChatTab} 
                  size="xl" 
                />
              </div>

              <div className="space-y-2 flex-1 text-center sm:text-left">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-[#d4af37] text-white hover:text-black rounded-xl text-xs font-bold transition-all border border-white/10 hover:border-[#d4af37]"
                  >
                    <Upload size={14} />
                    <span>{currentConfig.avatarUrl ? 'Trocar Foto' : 'Enviar Foto'}</span>
                  </button>

                  {currentConfig.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all"
                    >
                      <Trash2 size={14} />
                      <span>Remover</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-neutral-500">
                  Formatos recomendados: JPG, PNG ou WebP com enquadramento quadrado. Salvo localmente para persistência permanente.
                </p>
              </div>
            </div>

            {/* Framing & Zoom Sliders (active when avatar image is present) */}
            {currentConfig.avatarUrl && (
              <div className="space-y-4 pt-4 border-t border-white/10 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-300 font-bold flex items-center gap-1.5">
                    <ZoomIn size={14} className="text-[#d4af37]" />
                    Zoom da Foto: {(currentConfig.zoom || 1).toFixed(2)}x
                  </span>
                  <button
                    onClick={() => updateCurrentConfig({ zoom: 1.0, positionX: 50, positionY: 50 })}
                    className="text-[11px] text-neutral-400 hover:text-[#d4af37]"
                  >
                    Resetar enquadramento
                  </button>
                </div>
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.05"
                  value={currentConfig.zoom || 1}
                  onChange={(e) => updateCurrentConfig({ zoom: parseFloat(e.target.value) })}
                  className="w-full accent-[#d4af37] bg-white/10 h-1.5 rounded-lg cursor-pointer"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Move size={12} /> Posição Horizontal (X)
                      </span>
                      <span>{currentConfig.positionX ?? 50}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={currentConfig.positionX ?? 50}
                      onChange={(e) => updateCurrentConfig({ positionX: parseInt(e.target.value) })}
                      className="w-full accent-[#d4af37] bg-white/10 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Move size={12} /> Posição Vertical (Y)
                      </span>
                      <span>{currentConfig.positionY ?? 50}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={currentConfig.positionY ?? 50}
                      onChange={(e) => updateCurrentConfig({ positionY: parseInt(e.target.value) })}
                      className="w-full accent-[#d4af37] bg-white/10 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Text & Labels Customization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Nome de Exibição
              </label>
              <input
                type="text"
                value={currentConfig.name}
                onChange={(e) => updateCurrentConfig({ name: e.target.value })}
                placeholder="Ex: Assistente IA Luxe"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]/60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Indicador de Disponibilidade
              </label>
              <input
                type="text"
                value={currentConfig.onlineStatusText}
                onChange={(e) => updateCurrentConfig({ onlineStatusText: e.target.value })}
                placeholder="Ex: Online, Disponível, Ativo"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]/60"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Subtítulo / Descrição Curta
              </label>
              <input
                type="text"
                value={currentConfig.subtitle}
                onChange={(e) => updateCurrentConfig({ subtitle: e.target.value })}
                placeholder="Ex: Inteligência Artificial VIP"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]/60"
              />
            </div>
          </div>

          {/* Luxury Accent Color Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
              Cor de Destaque Metalizada
            </label>
            <div className="flex flex-wrap gap-2.5">
              {LUXURY_ACCENT_COLORS.map(color => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => updateCurrentConfig({ accentColor: color.hex })}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all",
                    currentConfig.accentColor === color.hex
                      ? "border-white bg-white/15 text-white shadow-sm"
                      : "border-white/10 bg-white/5 text-neutral-400 hover:text-white"
                  )}
                >
                  <span 
                    className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span>{color.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#111111] border border-[#d4af37]/20 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye size={14} className="text-[#d4af37]" />
                Prévia em Tempo Real
              </span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Ao Vivo
              </span>
            </div>

            {/* Simulated Chat Window Header Card */}
            <div className="rounded-2xl bg-[#0a0a0a] border border-[#d4af37]/30 overflow-hidden shadow-2xl">
              <div 
                className="p-3.5 flex items-center justify-between border-b border-white/10"
                style={{
                  background: `linear-gradient(to right, #121212 0%, #1a1710 50%, #121212 100%)`
                }}
              >
                <div className="flex items-center gap-3">
                  <ChatAvatar 
                    config={currentConfig} 
                    type={activeChatTab} 
                    size="md" 
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {currentConfig.name}
                      {currentConfig.tagText && (
                        <span 
                          className="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase border"
                          style={{
                            color: currentConfig.accentColor,
                            borderColor: `${currentConfig.accentColor}44`,
                            backgroundColor: `${currentConfig.accentColor}15`,
                          }}
                        >
                          {currentConfig.tagText}
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-neutral-400">{currentConfig.subtitle}</p>
                  </div>
                </div>

                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {/* Sample simulated message bubbles */}
              <div className="p-4 space-y-3 bg-[#0a0a0a] text-xs">
                <div className="flex flex-col items-start max-w-[85%]">
                  <span className="text-[9px] text-neutral-500 mb-1 px-1">{currentConfig.name}</span>
                  <div 
                    className="p-3 rounded-2xl rounded-bl-none text-neutral-200 border border-white/10 text-xs leading-relaxed"
                    style={{ background: '#161616' }}
                  >
                    Olá! Bem-vindo ao Salão Luxe. Como posso auxiliar seu atendimento hoje?
                  </div>
                </div>

                <div className="flex flex-col items-end self-end ml-auto max-w-[85%]">
                  <div 
                    className="p-3 rounded-2xl rounded-br-none text-black font-semibold text-xs leading-relaxed shadow-sm"
                    style={{ backgroundColor: currentConfig.accentColor }}
                  >
                    Gostaria de ver os serviços e horários disponíveis.
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed text-center pt-2">
              Esta identidade é aplicada instantaneamente aos clientes e profissionais no celular, tablet e computador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
