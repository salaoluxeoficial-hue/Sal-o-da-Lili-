import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Send, Headphones, CheckCheck } from 'lucide-react';
import { useLocalStorage } from '@/src/hooks/useLocalStorage';
import { ViewType, ChatMessage, ChatAttachment, ChatConversation } from '@/src/types';
import { AudioRecorder } from '@/src/components/chat/AudioRecorder';
import { AudioPlayer } from '@/src/components/chat/AudioPlayer';
import { 
  ADMIN_PARTICIPANT_ID, 
  sendMessageDirectly, 
  getStoredMessages, 
  markConversationAsReadDirectly 
} from '@/src/services/chatStorage';
import { getOrCreatePersistentClientUUID } from '@/src/services/supabaseChatService';
import { processAudioMessageWithAI } from '@/src/services/aiAudioChatService';

interface AIAssistantButtonProps {
  onNavigate?: (view: ViewType) => void;
}

export const AIAssistantButton: React.FC<AIAssistantButtonProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');

  // Persistent Client UUID for visitor identification
  const visitorId = useMemo(() => getOrCreatePersistentClientUUID(), []);
  const visitorName = 'Visitante Luxe';
  const conversationId = `conv-client-${visitorId}`;

  // Shared chat messages and conversations state from localStorage
  const [storedMessages, setStoredMessages] = useLocalStorage<ChatMessage[]>('chat_messages', getStoredMessages());
  const [storedConvs, setStoredConvs] = useLocalStorage<ChatConversation[]>('chat_conversations', []);

  // Listen to real-time chat updates
  useEffect(() => {
    const handleSync = () => {
      try {
        const rawMsgs = localStorage.getItem('chat_messages');
        if (rawMsgs) setStoredMessages(JSON.parse(rawMsgs));
        const rawConvs = localStorage.getItem('chat_conversations');
        if (rawConvs) setStoredConvs(JSON.parse(rawConvs));
      } catch (err) {
        console.error('AIAssistantButton sync error:', err);
      }
    };

    window.addEventListener('salao-luxe-chat-sync', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('salao-luxe-chat-sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [setStoredMessages, setStoredConvs]);

  // Filter messages specifically belonging to this visitor conversation
  const liveChatMessages = useMemo(() => {
    return storedMessages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [storedMessages, conversationId]);

  // Mark messages as read when balloon is open
  useEffect(() => {
    if (isOpen && conversationId) {
      markConversationAsReadDirectly(conversationId, 'participant');
    }
  }, [isOpen, conversationId, liveChatMessages.length]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveChatMessages, isOpen]);

  // Send audio message recorded in floating balloon widget
  const handleSendAudioAttachment = (attachment: ChatAttachment) => {
    sendMessageDirectly({
      conversationId,
      senderId: visitorId,
      senderName: visitorName,
      senderRole: 'cliente',
      recipientId: ADMIN_PARTICIPANT_ID,
      content: '',
      attachment: attachment,
      participantDetails: {
        type: 'cliente',
        assignedType: 'recepcao_adm',
        participantId: visitorId,
        participantName: visitorName,
        participantRoleDescription: 'Cliente Visitante (Balão Flutuante)'
      }
    });

    // Trigger AI response to received audio
    processAudioMessageWithAI({
      conversationId,
      attachment,
      visitorName
    });
  };

  // Send text message in floating balloon widget
  const handleSendTextMessage = () => {
    const text = input.trim();
    if (!text) return;

    sendMessageDirectly({
      conversationId,
      senderId: visitorId,
      senderName: visitorName,
      senderRole: 'cliente',
      recipientId: ADMIN_PARTICIPANT_ID,
      content: text,
      participantDetails: {
        type: 'cliente',
        assignedType: 'recepcao_adm',
        participantId: visitorId,
        participantName: visitorName,
        participantRoleDescription: 'Cliente Visitante (Balão Flutuante)'
      }
    });

    setInput('');
  };

  const unreadCount = useMemo(() => {
    const conv = storedConvs.find(c => c.id === conversationId);
    return conv?.unreadCountParticipant || 0;
  }, [storedConvs, conversationId]);

  return (
    <>
      {/* Botão Flutuante Pequeno, Arredondado & Elegante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#0c0c0c] border-2 border-[#d4af37] text-[#d4af37] shadow-2xl hover:bg-[#141414] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center shrink-0 relative group"
        title="Atendimento Salão Luxe"
        aria-label="Abrir atendimento"
      >
        <Headphones size={22} className="group-hover:rotate-12 transition-transform" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#d4af37] text-black rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-[#0c0c0c]">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Janela de Chat Compacta e Proporcional */}
      {isOpen && (
        <div className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50 w-[320px] sm:w-[350px] max-w-[calc(100vw-32px)] h-[400px] sm:h-[440px] max-h-[70vh] bg-[#080808] border border-[#d4af37]/35 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Cabeçalho Discreto */}
          <div className="bg-[#0c0c0c] border-b border-[#d4af37]/20 p-3 px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#d4af37] animate-pulse" />
              <div>
                <h3 className="text-xs font-semibold text-white">
                  Atendimento Salão Luxe
                </h3>
                <p className="text-[10px] text-neutral-400 font-light">
                  Recepção & Mensagens
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors shrink-0"
              title="Fechar"
            >
              <X size={16} />
            </button>
          </div>

          {/* Conversa Limpa */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 min-h-0 bg-[#050505]">
            {liveChatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-3 space-y-1.5">
                <span className="text-[10px] text-[#d4af37] font-medium tracking-wider uppercase">
                  Canal Direto
                </span>
                <p className="text-neutral-400 text-xs font-light max-w-xs leading-relaxed">
                  Digite sua dúvida ou grave um áudio para falar com o Salão Luxe.
                </p>
              </div>
            ) : (
              liveChatMessages.map((msg) => {
                const isFromClient = msg.senderRole === 'cliente' || msg.senderId === visitorId;
                const isAudio = msg.attachment?.type === 'audio';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isFromClient ? 'items-end' : 'items-start'}`}
                  >
                    <div className="max-w-[88%] space-y-0.5">
                      <div
                        className={`p-2.5 rounded-2xl text-xs font-light leading-relaxed ${
                          isFromClient
                            ? 'bg-[#d4af37] text-black font-medium rounded-br-none shadow-sm'
                            : 'bg-[#141414] border border-white/5 text-neutral-200 rounded-bl-none'
                        }`}
                      >
                        {isAudio && msg.attachment ? (
                          <AudioPlayer
                            src={msg.attachment.url}
                            duration={msg.attachment.duration}
                            isFromAdminOrDono={!isFromClient}
                          />
                        ) : msg.attachment?.type === 'image' ? (
                          <img 
                            src={msg.attachment.url} 
                            alt="Anexo" 
                            className="max-h-36 w-full object-cover rounded-xl mb-1" 
                          />
                        ) : msg.attachment ? (
                          <a
                            href={msg.attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-black/20 text-xs underline block rounded-xl mb-1"
                          >
                            📎 {msg.attachment.name}
                          </a>
                        ) : null}

                        {msg.content && (
                          <p className={isAudio ? 'mt-1' : ''}>{msg.content}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-1 text-[9px] text-neutral-500 px-1">
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isFromClient && (
                          <CheckCheck 
                            size={10} 
                            className={msg.status === 'lida' ? 'text-emerald-400' : 'text-neutral-500'} 
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Campo de Mensagem Elegante */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendTextMessage();
            }}
            className="p-2.5 bg-[#0c0c0c] border-t border-white/5 flex items-center gap-1.5 shrink-0"
          >
            {/* Botão de Microfone Minimalista */}
            <AudioRecorder
              onAudioRecorded={handleSendAudioAttachment}
              isCompact={true}
            />

            {/* Input de Texto */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-[#141414] border border-white/10 focus:border-[#d4af37] text-white rounded-xl px-2.5 py-1.5 text-xs outline-none placeholder:text-neutral-500 font-light transition-all"
            />

            {/* Botão de Envio Minimalista */}
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-1.5 bg-[#d4af37] hover:bg-[#e5c158] disabled:opacity-30 text-black font-semibold rounded-xl transition-all shadow-md shrink-0"
              title="Enviar"
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
