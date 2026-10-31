import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, ChevronRight } from 'lucide-react';
import { useLocalStorage } from '@/src/hooks/useLocalStorage';
import { Service, Product, PixConfig, ViewType } from '@/src/types';
import { initialServicesList } from '@/src/components/Services';
import { getInitialProducts } from '@/src/services/productStorage';
import { formatCurrency } from '@/src/lib/utils';
import { getInitialChatBranding, ChatBrandingSettings } from '@/src/services/chatBrandingStorage';
import { ChatAvatar } from '@/src/components/chat/ChatAvatar';

export interface SalonSettings {
  salonName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  openingHours: string;
  pixKey: string;
  receiverName: string;
  city: string;
}

interface AIAssistantButtonProps {
  onNavigate?: (view: ViewType) => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  action?: {
    label: string;
    view: ViewType;
  };
}

export const AIAssistantButton: React.FC<AIAssistantButtonProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [branding, setBranding] = useState<ChatBrandingSettings>(() => getInitialChatBranding());

  useEffect(() => {
    const handleBrandingSync = () => {
      setBranding(getInitialChatBranding());
    };
    window.addEventListener('salao-luxe-branding-sync', handleBrandingSync);
    window.addEventListener('storage', handleBrandingSync);
    return () => {
      window.removeEventListener('salao-luxe-branding-sync', handleBrandingSync);
      window.removeEventListener('storage', handleBrandingSync);
    };
  }, []);

  const [services] = useLocalStorage<Service[]>('services', initialServicesList);
  const [products] = useLocalStorage<Product[]>('products', getInitialProducts());
  const [settings] = useLocalStorage<SalonSettings>('salon_settings', {
    salonName: 'Salão Luxe',
    phone: '(11) 99999-8888',
    whatsapp: '(11) 99999-8888',
    email: 'contato@salaoluxe.com',
    address: 'Av. Paulista, 1000 - São Paulo, SP',
    openingHours: 'Terça a Sábado das 09h às 20h',
    pixKey: '12345678000195',
    receiverName: 'Salão Luxe LTDA',
    city: 'São Paulo'
  });
  const [pixConfig] = useLocalStorage<PixConfig>('pix_config', {
    keyType: 'cnpj',
    key: '12345678000195',
    receiverName: 'Salão Luxe LTDA',
    receiverCity: 'São Paulo',
    gatewayProvider: 'manual',
    autoWebhookEnabled: true,
    webhookSecret: 'whsec_luxe_live',
    webhookEndpoint: 'https://api.salaoluxe.com/webhooks/pix'
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: `Olá! Sou a Assistente IA do Salão Luxe. Como posso ajudar você hoje?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleQuickQuestion = (question: string) => {
    processUserInput(question);
  };

  const processUserInput = (userInputText: string) => {
    const text = userInputText.trim();
    if (!text) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Generate intelligent contextual response
    setTimeout(() => {
      let responseText = '';
      let action: { label: string; view: ViewType } | undefined;

      const lower = text.toLowerCase();

      if (lower.includes('agendar') || lower.includes('reserva') || lower.includes('horário') || lower.includes('agendamento')) {
        const topServices = services.slice(0, 3).map(s => `• ${s.name} (${formatCurrency(s.price)})`).join('\n');
        responseText = `Você pode realizar seu agendamento diretamente na Área do Cliente ou na Vitrine de Serviços!\n\nServiços mais procurados:\n${topServices}`;
        action = { label: 'Ir para Área do Cliente', view: 'area_cliente' };
      } else if (lower.includes('humano') || lower.includes('atendente') || lower.includes('recepção') || lower.includes('recepcao') || lower.includes('falar com pessoa')) {
        responseText = `Você está sendo direcionado para o chat de atendimento humano do Salão Luxe. Nossa recepção e gerência estão prontas para atendê-lo!`;
        action = { label: 'Transferir para Atendimento Humano', view: 'chat' };
      } else if (lower.includes('pix') || lower.includes('pagamento') || lower.includes('pagar') || lower.includes('chave')) {
        const key = pixConfig.key || settings.pixKey || '12345678000195';
        const receiver = pixConfig.receiverName || settings.receiverName || 'Salão Luxe';
        responseText = `Chave Pix Oficial do Salão Luxe:\n\n• Chave: ${key}\n• Recebedor: ${receiver}\n• Cidade: ${pixConfig.receiverCity || 'São Paulo'}\n\nApós realizar a transferência Pix, o seu comprovante é validado automaticamente no sistema!`;
        action = { label: 'Ver Vitrine & Sacola', view: 'vitrine' };
      } else if (lower.includes('produto') || lower.includes('shampoo') || lower.includes('comprar') || lower.includes('estoque')) {
        const topProducts = products.filter(p => p.status === 'ativo').slice(0, 3).map(p => `• ${p.name} - ${formatCurrency(p.price)}`).join('\n');
        responseText = `Confira os produtos de alta performance disponíveis em nosso estoque:\n\n${topProducts}\n\nVocê pode adicionar os produtos à sacola na Vitrine Digital ou em Produtos!`;
        action = { label: 'Abrir Vitrine', view: 'vitrine' };
      } else if (lower.includes('contato') || lower.includes('whatsapp') || lower.includes('telefone') || lower.includes('endereço')) {
        responseText = `Informações de Contato e Localização do Salão Luxe:\n\n• WhatsApp: ${settings.whatsapp}\n• Telefone: ${settings.phone}\n• Endereço: ${settings.address}\n• Horário: ${settings.openingHours}`;
        action = { label: 'Atendimento via Chat', view: 'chat' };
      } else if (lower.includes('serviço') || lower.includes('preço') || lower.includes('valor')) {
        const list = services.slice(0, 4).map(s => `• ${s.name}: ${formatCurrency(s.price)} (${s.duration} min)`).join('\n');
        responseText = `Tabela principal de serviços do Salão Luxe:\n\n${list}\n\nAtendemos cabelo, barba, estética e unhas com profissionais renomados.`;
        action = { label: 'Ver Todos na Vitrine', view: 'vitrine' };
      } else {
        responseText = `Entendido! No Salão Luxe você conta com serviços de beleza de alto padrão, vitrine de produtos e agendamento online imediato.\n\nComo deseja prosseguir?`;
        action = { label: 'Falar com Atendente Humano', view: 'chat' };
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action
      };

      setMessages(prev => [...prev, aiMsg]);
    }, 400);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50 group flex items-center gap-2.5 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#b8860b] text-black font-extrabold px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:shadow-[0_0_30px_rgba(212,175,55,0.7)] hover:scale-105 active:scale-95 transition-all duration-300 border border-[#fff8dc]"
        title={branding.aiAssistant.name}
      >
        <ChatAvatar 
          config={branding.aiAssistant} 
          type="ai" 
          size="sm" 
          showStatusIndicator={false} 
        />
        <span className="text-xs tracking-wider uppercase hidden sm:inline-block font-extrabold text-black">
          {branding.aiAssistant.name}
        </span>
      </button>

      {/* Floating Chat Modal - Compact & Standardized */}
      {isOpen && (
        <div className="fixed bottom-20 sm:bottom-24 right-3 sm:right-6 z-50 w-[92vw] sm:w-[350px] md:w-[360px] h-[430px] max-h-[75vh] bg-[#0a0a0a] border border-[#d4af37]/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#121212] via-[#1a1710] to-[#121212] border-b border-[#d4af37]/20 p-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <ChatAvatar 
                config={branding.aiAssistant} 
                type="ai" 
                size="md" 
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                    {branding.aiAssistant.name}
                  </h3>
                  <span className="flex items-center gap-1 text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {branding.aiAssistant.onlineStatusText || 'Disponível'}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-neutral-400 truncate mt-0.5">{branding.aiAssistant.subtitle}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors shrink-0"
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="p-2 bg-[#121212] border-b border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs shrink-0">
            <button
              onClick={() => handleQuickQuestion('Quero falar com atendimento humano')}
              className="whitespace-nowrap px-2.5 py-1 bg-[#d4af37]/20 hover:bg-[#d4af37] text-[#d4af37] hover:text-black border border-[#d4af37]/40 text-neutral-300 rounded-full transition-all text-[11px] font-bold"
            >
              👤 Atendente Humano
            </button>
            <button
              onClick={() => handleQuickQuestion('Quais os serviços mais procurados?')}
              className="whitespace-nowrap px-2.5 py-1 bg-white/5 hover:bg-[#d4af37]/20 hover:text-[#d4af37] border border-white/10 hover:border-[#d4af37]/30 text-neutral-300 rounded-full transition-all text-[11px]"
            >
              ✂️ Serviços
            </button>
            <button
              onClick={() => handleQuickQuestion('Como fazer um agendamento?')}
              className="whitespace-nowrap px-2.5 py-1 bg-white/5 hover:bg-[#d4af37]/20 hover:text-[#d4af37] border border-white/10 hover:border-[#d4af37]/30 text-neutral-300 rounded-full transition-all text-[11px]"
            >
              📅 Agendar
            </button>
            <button
              onClick={() => handleQuickQuestion('Qual a chave Pix do salão?')}
              className="whitespace-nowrap px-2.5 py-1 bg-white/5 hover:bg-[#d4af37]/20 hover:text-[#d4af37] border border-white/10 hover:border-[#d4af37]/30 text-neutral-300 rounded-full transition-all text-[11px]"
            >
              🔑 Pix
            </button>
            <button
              onClick={() => handleQuickQuestion('Produtos em estoque')}
              className="whitespace-nowrap px-2.5 py-1 bg-white/5 hover:bg-[#d4af37]/20 hover:text-[#d4af37] border border-white/10 hover:border-[#d4af37]/30 text-neutral-300 rounded-full transition-all text-[11px]"
            >
              🛍️ Produtos
            </button>
          </div>

          {/* Messages Container - Clean flex-1 */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 min-h-0">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-end gap-2 max-w-[85%]">
                  {msg.sender === 'ai' && (
                    <div className="shrink-0 mb-0.5">
                      <ChatAvatar config={branding.aiAssistant} type="ai" size="sm" showStatusIndicator={false} />
                    </div>
                  )}

                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'text-black font-semibold rounded-br-none shadow-sm'
                        : 'bg-[#161616] border border-white/10 text-neutral-200 rounded-bl-none'
                    }`}
                    style={msg.sender === 'user' ? { backgroundColor: branding.aiAssistant.accentColor || '#d4af37' } : undefined}
                  >
                    {msg.text}

                    {/* Action Button inside AI message */}
                    {msg.action && onNavigate && (
                      <button
                        onClick={() => {
                          onNavigate(msg.action!.view);
                          setIsOpen(false);
                        }}
                        className="mt-2.5 w-full flex items-center justify-between gap-1.5 px-3 py-1.5 bg-[#d4af37]/20 hover:bg-[#d4af37] text-[#d4af37] hover:text-black border border-[#d4af37]/40 rounded-xl font-bold transition-all text-[11px]"
                      >
                        <span>{msg.action.label}</span>
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <span className="text-[9px] text-neutral-500 mt-1 px-1">
                  {msg.time}
                </span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              processUserInput(input);
            }}
            className="p-2.5 bg-[#101010] border-t border-white/10 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua dúvida..."
              className="flex-1 bg-white/5 border border-white/10 focus:border-[#d4af37]/50 text-white rounded-xl px-3 py-2 text-xs outline-none placeholder:text-neutral-500 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 disabled:opacity-40 text-black font-bold rounded-xl transition-all shadow-sm"
              style={{ backgroundColor: branding.aiAssistant.accentColor || '#d4af37' }}
              title="Enviar"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
