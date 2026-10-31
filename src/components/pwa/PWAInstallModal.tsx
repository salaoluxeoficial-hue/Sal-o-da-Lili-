import React from 'react';
import { Download, Sparkles, CheckCircle2, X, Smartphone, Globe, Info } from 'lucide-react';
import { usePWAInstall } from '@/src/hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#0e0e0e] border border-[#d4af37]/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center space-y-3 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#8a7122] flex items-center justify-center text-black font-extrabold mx-auto shadow-lg shadow-[#d4af37]/20 border border-[#fff8dc]">
            <Download size={28} />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">App Salão Luxe</h2>
          <p className="text-neutral-400 text-xs leading-relaxed max-w-xs mx-auto">
            Instale nosso aplicativo oficial para agendamentos mais rápidos, notificações e acesso offline na sua tela inicial.
          </p>
        </div>

        {/* State 1: Already installed */}
        {isInstalled && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs flex items-center gap-3">
            <CheckCircle2 size={20} className="shrink-0" />
            <span>O aplicativo Salão Luxe já está instalado no seu dispositivo!</span>
          </div>
        )}

        {/* State 2: Native Install Prompt Available */}
        {!isInstalled && isInstallable && (
          <div className="space-y-3">
            <button
              onClick={handleInstallClick}
              className="w-full py-3.5 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#b8860b] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[#d4af37]/20 flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Instalar Agora no Dispositivo
            </button>
            <p className="text-[11px] text-neutral-500 text-center">
              Sem necessidade de baixar via loja de aplicativos. Instalação instantânea.
            </p>
          </div>
        )}

        {/* State 3: iOS Safari Guide */}
        {!isInstalled && isIOS && (
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 text-xs text-neutral-300">
            <div className="flex items-center gap-2 font-bold text-[#d4af37]">
              <Smartphone size={16} />
              Instalação no iPhone / iPad (iOS):
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-neutral-300 leading-relaxed text-[11px]">
              <li>Toque no botão <strong className="text-white">Compartilhar</strong> (ícone de quadrado com seta) na barra do Safari.</li>
              <li>Role para baixo e selecione <strong className="text-white">Adicionar à Tela de Início</strong>.</li>
              <li>Confirme clicando em <strong className="text-white">Adicionar</strong> no canto superior direito.</li>
            </ol>
          </div>
        )}

        {/* State 4: Standard Browser Manual Add */}
        {!isInstalled && !isInstallable && !isIOS && (
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 text-xs text-neutral-300">
            <div className="flex items-center gap-2 font-bold text-[#d4af37]">
              <Info size={16} />
              Adicionar à Tela Inicial:
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Abra o menu de opções do seu navegador (três pontos no Chrome/Edge) e selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
            </p>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-neutral-300 font-bold text-xs rounded-xl transition-colors text-center"
          >
            Continuar no Navegador
          </button>
        </div>
      </div>
    </div>
  );
};
