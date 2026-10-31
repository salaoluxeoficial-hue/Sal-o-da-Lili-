import React, { useState } from 'react';
import { Settings as SettingsIcon, Store, Shield, Palette, Bell, HelpCircle, Save, CheckCircle2, Menu, Sliders, Sparkles } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useLocalStorage } from '@/src/hooks/useLocalStorage';
import { PixConfig } from '@/src/types';
import { getDefaultPixConfig, getDefaultSalonSettings, SalonSettings } from '@/src/services/pixService';
import { MenuManager } from '@/src/components/admin/MenuManager';
import { AppearanceManager } from '@/src/components/admin/AppearanceManager';
import { ChatBrandingManager } from '@/src/components/admin/ChatBrandingManager';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dados' | 'menu' | 'aparencia' | 'atendimentos' | 'seguranca'>('dados');

  const [salonSettings, setSalonSettings] = useLocalStorage<SalonSettings>('salon_settings', getDefaultSalonSettings());
  const [pixConfig, setPixConfig] = useLocalStorage<PixConfig>('pix_config', getDefaultPixConfig());

  const [tradeName, setTradeName] = useState(salonSettings.tradeName);
  const [cnpj, setCnpj] = useState(salonSettings.cnpj);
  const [email, setEmail] = useState(salonSettings.email);
  const [phone, setPhone] = useState(salonSettings.phone);
  const [address, setAddress] = useState(salonSettings.address);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedSalon: SalonSettings = {
      tradeName,
      cnpj,
      email,
      phone,
      address,
    };

    setSalonSettings(updatedSalon);

    // Sync with Pix config if CNPJ or trade name changed
    if (cnpj) {
      setPixConfig(prev => ({
        ...prev,
        key: cnpj,
        receiverName: tradeName.toUpperCase(),
      }));
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Configurações do Salão Luxe</h1>
        <p className="text-neutral-400 mt-1">Gerencie os dados, a aparência visual, o menu lateral e as permissões do sistema.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Settings Tabs */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'dados', icon: Store, label: 'Dados do Salão' },
            { id: 'atendimentos', icon: Sparkles, label: 'Chats & Atendimentos' },
            { id: 'menu', icon: Menu, label: 'Gerenciador do Menu' },
            { id: 'aparencia', icon: Sliders, label: 'Aparência & Layout' },
            { id: 'seguranca', icon: Shield, label: 'Segurança & Permissões' },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-bold",
                activeTab === item.id 
                  ? "bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20" 
                  : "text-neutral-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'dados' && (
            <form onSubmit={handleSave} className="bg-[#111111] border border-[#d4af37]/20 p-8 rounded-3xl space-y-8 shadow-2xl">
              {savedSuccess && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-400 text-sm font-semibold animate-in fade-in">
                  <CheckCircle2 size={20} />
                  Dados do salão e chave Pix salvos com sucesso no sistema!
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Nome Fantasia</label>
                  <input 
                    type="text" 
                    value={tradeName}
                    onChange={e => setTradeName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs focus:border-[#d4af37]/50 transition-all outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">CNPJ (Chave Pix Principal)</label>
                  <input 
                    type="text" 
                    value={cnpj}
                    onChange={e => setCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs focus:border-[#d4af37]/50 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">E-mail de Contato</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs focus:border-[#d4af37]/50 transition-all outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Telefone / WhatsApp</label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs focus:border-[#d4af37]/50 transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Endereço Completo</label>
                <textarea 
                  rows={3}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs focus:border-[#d4af37]/50 transition-all outline-none resize-none"
                />
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-end">
                <button 
                  type="submit"
                  className="flex items-center gap-2 bg-[#d4af37] text-black px-8 py-3 rounded-xl font-bold hover:bg-[#b8860b] transition-all shadow-lg"
                >
                  <Save size={18} />
                  Salvar Alterações
                </button>
              </div>
            </form>
          )}

          {activeTab === 'atendimentos' && (
            <ChatBrandingManager />
          )}

          {activeTab === 'menu' && (
            <MenuManager />
          )}

          {activeTab === 'aparencia' && (
            <AppearanceManager />
          )}

          {activeTab === 'seguranca' && (
            <div className="bg-[#111111] border border-[#d4af37]/20 p-8 rounded-3xl space-y-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield size={20} className="text-[#d4af37]" />
                Segurança e Política de Acessos
              </h3>
              <p className="text-neutral-400 text-xs leading-relaxed">
                As permissões por perfil (ADM, Profissionais e Clientes) garantem isolamento total dos dados.
              </p>
              <div className="p-4 bg-white/5 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between text-neutral-300">
                  <span>Administrador Master:</span>
                  <span className="text-[#d4af37] font-bold">Acesso Total Unificado</span>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>Espaço do Profissional:</span>
                  <span className="text-blue-400 font-bold">Sua Agenda & Suas Comissões</span>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>Área do Cliente:</span>
                  <span className="text-emerald-400 font-bold">Seu Perfil, Agendamentos & Compras</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
