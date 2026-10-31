import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MessageSquare, 
  Send, 
  Image as ImageIcon, 
  Paperclip, 
  Sparkles, 
  CheckCheck, 
  Clock, 
  Bot, 
  Phone, 
  MapPin, 
  X,
  ExternalLink,
  MessageCircle,
  Scissors,
  ArrowLeft,
  Headphones,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import { useLocalStorage } from '@/src/hooks/useLocalStorage';
import { ChatMessage, ChatConversation, ChatAttachment, Client, Professional } from '@/src/types';
import { 
  ADMIN_PARTICIPANT_ID, 
  ADMIN_PARTICIPANT_NAME, 
  sendMessageDirectly,
  markConversationAsReadDirectly,
  getStoredMessages
} from '@/src/services/chatStorage';
import { initialClientsList } from '@/src/components/Clients';
import { initialProfessionalsList } from '@/src/components/Professionals';
import { cn } from '@/src/lib/utils';
import { getInitialChatBranding, ChatBrandingSettings } from '@/src/services/chatBrandingStorage';
import { ChatAvatar } from '@/src/components/chat/ChatAvatar';

interface PublicChatProps {
  onBack?: () => void;
  currentClient?: Client;
}

export const PublicChat: React.FC<PublicChatProps> = ({ onBack, currentClient }) => {
  const [clients] = useLocalStorage<Client[]>('clients', initialClientsList);
  const [professionals] = useLocalStorage<Professional[]>('professionals', initialProfessionalsList);
  const [storedConversations, setStoredConversations] = useLocalStorage<ChatConversation[]>('chat_conversations', []);
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>('chat_messages', getStoredMessages());
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

  // Use currentClient if passed, or default to clients[0] / visitor
  const [publicClient, setPublicClient] = useState<Client>(() => currentClient || clients[0] || {
    id: 'cli-public-visitor',
    name: 'Visitante Luxe',
    email: 'visitante@salaoluxe.com',
    phone: '(11) 99999-8888',
    status: 'ativo',
    hasPortalAccess: true,
    totalSpent: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  useEffect(() => {
    if (currentClient) {
      setPublicClient(currentClient);
    }
  }, [currentClient]);

  // Selected target: 'recepcao' or professional.id
  const [selectedTargetId, setSelectedTargetId] = useState<string>('recepcao');

  const selectedProfessional = useMemo(() => {
    if (selectedTargetId === 'recepcao') return null;
    return professionals.find(p => p.id === selectedTargetId) || null;
  }, [selectedTargetId, professionals]);

  const conversationId = selectedProfessional
    ? `conv-client-pro-${publicClient.id}-${selectedProfessional.id}`
    : `conv-client-${publicClient.id}`;

  const [inputMessage, setInputMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Real-time synchronization event listener
  useEffect(() => {
    const handleSync = () => {
      try {
        const rawMsgs = localStorage.getItem('chat_messages');
        if (rawMsgs) setMessages(JSON.parse(rawMsgs));
        const rawConvs = localStorage.getItem('chat_conversations');
        if (rawConvs) setStoredConversations(JSON.parse(rawConvs));
      } catch (err) {
        console.error('PublicChat sync error:', err);
      }
    };

    window.addEventListener('salao-luxe-chat-sync', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('salao-luxe-chat-sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [setMessages, setStoredConversations]);

  // Filter messages for this public client
  const clientMessages = useMemo(() => {
    return messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, conversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [clientMessages]);

  // Mark messages as read by participant when viewed
  useEffect(() => {
    if (conversationId) {
      markConversationAsReadDirectly(conversationId, 'participant');
    }
  }, [conversationId, clientMessages.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const content = (textToSend || inputMessage).trim();
    if (!content && !attachmentPreview) return;

    let attachmentObj: ChatAttachment | undefined = undefined;
    if (attachmentPreview && selectedFile) {
      attachmentObj = {
        id: `att-${Date.now()}`,
        url: attachmentPreview,
        name: selectedFile.name,
        type: selectedFile.type.startsWith('image/') ? 'image' : 'file',
        mimeType: selectedFile.type
      };
    }

    const recipientId = selectedProfessional ? selectedProfessional.id : ADMIN_PARTICIPANT_ID;

    sendMessageDirectly({
      conversationId: conversationId,
      senderId: publicClient.id,
      senderName: publicClient.name,
      senderRole: 'cliente',
      recipientId: recipientId,
      content: content,
      attachment: attachmentObj,
      participantDetails: {
        type: 'cliente',
        assignedType: selectedProfessional ? 'profissional_direto' : 'recepcao_adm',
        assignedProfessionalId: selectedProfessional?.id,
        assignedProfessionalName: selectedProfessional?.name,
        participantId: publicClient.id,
        participantName: publicClient.name,
        participantPhone: publicClient.phone,
        participantEmail: publicClient.email,
        participantPhotoUrl: publicClient.photoUrl,
        participantRoleDescription: selectedProfessional 
          ? `Cliente c/ ${selectedProfessional.name}` 
          : 'Cliente Salão Luxe'
      }
    });

    // Reset input
    setInputMessage('');
    setSelectedFile(null);
    setAttachmentPreview(null);
  };

  const handleQuickQuestion = (questionText: string) => {
    handleSendMessage(questionText);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Public Chat Header Banner */}
      <div className="bg-gradient-to-r from-[#14120c] via-[#1c1810] to-[#0a0a0a] border border-[#d4af37]/25 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 sm:p-2.5 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-[#d4af37] border border-white/10 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shrink-0"
              title="Voltar / Recolher Atendimento"
            >
              <ArrowLeft size={16} className="text-[#d4af37]" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
          )}

          <ChatAvatar config={branding.receptionChat} type="reception" size="lg" />

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
                {branding.receptionChat.name}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 uppercase flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                {branding.receptionChat.tagText || 'Online'}
              </span>
            </div>
            <p className="text-neutral-400 text-xs mt-0.5 line-clamp-1">
              {branding.receptionChat.subtitle}
            </p>
          </div>
        </div>

        {/* WhatsApp Direct Shortcut */}
        <a
          href="https://wa.me/5511999998888?text=Olá,%20gostaria%20de%20informações%20sobre%20atendimento%20no%20Salão%20Luxe."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-900/30 shrink-0 self-start md:self-auto"
        >
          <MessageCircle size={15} />
          <span>Atendimento WhatsApp</span>
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Main Chat Box Container - Standardized compact dimensions */}
      <div className="bg-[#0a0a0a] border border-[#d4af37]/25 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[430px] max-h-[75vh] relative">
        {/* Chat Sub-Header */}
        <div className="bg-[#121212] border-b border-[#d4af37]/15 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            {selectedProfessional ? (
              <div className="w-9 h-9 rounded-full bg-[#d4af37]/20 border border-[#d4af37] overflow-hidden flex items-center justify-center text-xs font-bold text-[#d4af37] shrink-0">
                {selectedProfessional.photoUrl ? (
                  <img src={selectedProfessional.photoUrl} alt={selectedProfessional.name} className="w-full h-full object-cover" />
                ) : (
                  selectedProfessional.name.substring(0, 2).toUpperCase()
                )}
              </div>
            ) : (
              <ChatAvatar config={branding.receptionChat} type="reception" size="md" showStatusDot={false} />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                  {selectedProfessional ? selectedProfessional.name : branding.receptionChat.name}
                </h3>
                <span className="flex items-center gap-1 text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-semibold uppercase shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {selectedProfessional ? selectedProfessional.role : (branding.receptionChat.onlineStatusText || 'Online')}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-neutral-400 truncate mt-0.5">
                {selectedProfessional ? `Atendimento Direto • ${selectedProfessional.specialties.join(', ')}` : branding.receptionChat.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs text-neutral-400 shrink-0">
            {/* Target Professional / Reception Selector */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-neutral-400 font-semibold uppercase hidden md:inline">Atendimento:</span>
              <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                className="bg-[#1a1a1a] border border-[#d4af37]/40 text-[#d4af37] font-semibold rounded-lg px-2 py-1 text-[11px] outline-none focus:border-[#d4af37] max-w-[170px] truncate"
              >
                <option value="recepcao">🏛️ Recepção (ADM)</option>
                {professionals.map(p => (
                  <option key={p.id} value={p.id}>✂️ {p.name} ({p.role})</option>
                ))}
              </select>
            </div>

            {currentClient ? (
              <span className="px-2 py-0.5 bg-[#1a1a1a] border border-white/10 text-neutral-300 font-semibold text-[11px] rounded-lg truncate max-w-[130px]">
                {publicClient.name}
              </span>
            ) : (
              <select
                value={publicClient.id}
                onChange={(e) => {
                  const found = clients.find(c => c.id === e.target.value);
                  if (found) setPublicClient(found);
                }}
                className="bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1 text-white text-[11px] outline-none focus:border-[#d4af37] max-w-[130px] truncate"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Quick Question Chips */}
        <div className="p-2.5 bg-[#121212] border-b border-white/5 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider shrink-0 px-1">
            Dúvidas rápidas:
          </span>
          <button
            onClick={() => handleQuickQuestion('Gostaria de saber os horários disponíveis para hoje.')}
            className="whitespace-nowrap px-3 py-1 bg-white/5 hover:bg-[#d4af37]/20 hover:text-[#d4af37] border border-white/10 hover:border-[#d4af37]/30 text-neutral-300 rounded-full transition-all text-[11px]"
          >
            📅 Horários disponíveis
          </button>
          <button
            onClick={() => handleQuickQuestion('Qual o valor da escova e tratamento capilar?')}
            className="whitespace-nowrap px-3 py-1 bg-white/5 hover:bg-[#d4af37]/20 hover:text-[#d4af37] border border-white/10 hover:border-[#d4af37]/30 text-neutral-300 rounded-full transition-all text-[11px]"
          >
            ✂️ Valores de serviços
          </button>
          <button
            onClick={() => handleQuickQuestion('Como funciona a chave Pix para pagamentos?')}
            className="whitespace-nowrap px-3 py-1 bg-white/5 hover:bg-[#d4af37]/20 hover:text-[#d4af37] border border-white/10 hover:border-[#d4af37]/30 text-neutral-300 rounded-full transition-all text-[11px]"
          >
            🔑 Pagamento Pix
          </button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {clientMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 flex items-center justify-center">
                <Sparkles size={28} />
              </div>
              <h4 className="text-white font-bold text-sm">Inicie sua conversa com o Salão Luxe</h4>
              <p className="text-neutral-400 text-xs max-w-xs leading-relaxed">
                Digite sua mensagem abaixo ou clique nas opções rápidas para ser atendido por nossa equipe.
              </p>
            </div>
          ) : (
            clientMessages.map(msg => {
              const isFromClient = msg.senderRole === 'cliente' || msg.senderId === publicClient.id;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isFromClient ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[85%] sm:max-w-[70%] space-y-1`}>
                    <span className="text-[10px] text-neutral-500 font-medium px-1 block">
                      {isFromClient ? 'Você' : (msg.senderName || 'Salão Luxe (Recepção)')}
                    </span>

                    <div
                      className={cn(
                        "p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-sm",
                        isFromClient
                          ? "bg-[#d4af37] text-black font-medium rounded-br-none"
                          : "bg-[#181818] border border-white/10 text-neutral-200 rounded-bl-none"
                      )}
                    >
                      {msg.content}

                      {/* Attachment preview if any */}
                      {msg.attachment && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-black/10">
                          {msg.attachment.type === 'image' ? (
                            <img src={msg.attachment.url} alt="Anexo" className="max-h-52 w-full object-cover" />
                          ) : (
                            <a
                              href={msg.attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 bg-black/20 text-xs underline block"
                            >
                              📎 {msg.attachment.name}
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-1 text-[9px] text-neutral-500 px-1">
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isFromClient && (
                        <CheckCheck size={12} className={msg.status === 'lida' ? 'text-emerald-400' : 'text-neutral-500'} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Attachment preview strip before sending */}
        {attachmentPreview && (
          <div className="p-2.5 bg-[#161616] border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={attachmentPreview} alt="Anexo" className="w-10 h-10 rounded-lg object-cover border border-white/20" />
              <span className="text-xs text-neutral-300 font-medium truncate max-w-[200px]">
                {selectedFile?.name}
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null);
                setAttachmentPreview(null);
              }}
              className="p-1 text-neutral-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Message Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-[#121212] border-t border-white/10 flex items-center gap-2"
        >
          <label
            htmlFor="chat-file-upload-pub"
            className="p-2.5 text-neutral-400 hover:text-[#d4af37] bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition-colors"
            title="Anexar foto ou imagem"
          >
            <ImageIcon size={18} />
            <input
              id="chat-file-upload-pub"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Digite sua dúvida ou mensagem para a equipe do Salão Luxe..."
            className="flex-1 bg-white/5 border border-white/10 focus:border-[#d4af37]/60 text-white rounded-xl px-4 py-2.5 text-xs sm:text-sm outline-none placeholder:text-neutral-500 transition-all"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() && !attachmentPreview}
            className="p-2.5 bg-[#d4af37] disabled:opacity-40 text-black font-extrabold rounded-xl hover:bg-[#b8860b] transition-all shadow-md shadow-[#d4af37]/20"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
