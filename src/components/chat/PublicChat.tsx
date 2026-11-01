import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, ArrowLeft, X, ImageIcon } from 'lucide-react';
import { useLocalStorage } from '@/src/hooks/useLocalStorage';
import { ChatMessage, ChatConversation, ChatAttachment, Client, Professional } from '@/src/types';
import { 
  ADMIN_PARTICIPANT_ID, 
  sendMessageDirectly,
  markConversationAsReadDirectly,
  getStoredMessages
} from '@/src/services/chatStorage';
import { initialClientsList } from '@/src/components/Clients';
import { initialProfessionalsList } from '@/src/components/Professionals';
import { getInitialChatBranding, ChatBrandingSettings } from '@/src/services/chatBrandingStorage';
import { AudioPlayer } from '@/src/components/chat/AudioPlayer';
import { AudioRecorder } from '@/src/components/chat/AudioRecorder';

interface PublicChatProps {
  onBack?: () => void;
  currentClient?: Client;
}

export const PublicChat: React.FC<PublicChatProps> = ({ onBack, currentClient }) => {
  const [clients] = useLocalStorage<Client[]>('clients', initialClientsList);
  const [professionals] = useLocalStorage<Professional[]>('professionals', initialProfessionalsList);
  const [storedConversations, setStoredConversations] = useLocalStorage<ChatConversation[]>('chat_conversations', []);
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>('chat_messages', getStoredMessages());
  const [branding] = useState<ChatBrandingSettings>(() => getInitialChatBranding());

  const publicClient = useMemo(() => currentClient || clients[0] || {
    id: 'cli-public-visitor',
    name: 'Visitante Luxe',
    email: 'visitante@salaoluxe.com',
    phone: '(11) 99999-8888',
    status: 'ativo',
    hasPortalAccess: true,
    totalSpent: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, [currentClient, clients]);

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

  // Sync listener
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

  const clientMessages = useMemo(() => {
    return messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, conversationId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [clientMessages]);

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
      conversationId,
      senderId: publicClient.id,
      senderName: publicClient.name,
      senderRole: 'cliente',
      recipientId,
      content,
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

    setInputMessage('');
    setSelectedFile(null);
    setAttachmentPreview(null);
  };

  const handleSendAudioAttachment = (attachment: ChatAttachment) => {
    const recipientId = selectedProfessional ? selectedProfessional.id : ADMIN_PARTICIPANT_ID;

    sendMessageDirectly({
      conversationId,
      senderId: publicClient.id,
      senderName: publicClient.name,
      senderRole: 'cliente',
      recipientId,
      content: '',
      attachment,
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
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-500">
      {/* Container Principal de Chat Elegante e Minimalista */}
      <div className="bg-[#080808] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[560px] max-h-[80vh]">
        {/* Cabeçalho Minimalista */}
        <div className="bg-[#0c0c0c] border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                title="Voltar"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            <div>
              <h1 className="text-base font-medium text-white tracking-tight">
                {selectedProfessional ? selectedProfessional.name : branding.receptionChat.name}
              </h1>
              <p className="text-[11px] text-neutral-400 font-light mt-0.5">
                {selectedProfessional ? selectedProfessional.role : 'Atendimento VIP Salão Luxe'}
              </p>
            </div>
          </div>

          {/* Seletor discreto de atendimento */}
          <select
            value={selectedTargetId}
            onChange={(e) => setSelectedTargetId(e.target.value)}
            className="bg-[#141414] border border-white/10 text-neutral-300 font-light rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#c5a059]"
          >
            <option value="recepcao">Recepção Luxe</option>
            {professionals.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Feed de Mensagens Limpo */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#050505]">
          {clientMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
              <span className="text-xs text-[#c5a059] font-medium uppercase tracking-widest">
                Atendimento Privado
              </span>
              <p className="text-neutral-400 text-xs font-light max-w-xs leading-relaxed">
                Envie uma mensagem ou grave um áudio para falar diretamente com a recepção do Salão Luxe.
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
                  <div className="max-w-[80%] space-y-1">
                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm font-light leading-relaxed ${
                        isFromClient
                          ? 'bg-[#d4af37] text-black font-medium rounded-br-none shadow-sm'
                          : 'bg-[#141414] border border-white/5 text-neutral-200 rounded-bl-none'
                      }`}
                    >
                      {msg.content}

                      {msg.attachment && (
                        <div className="mt-2 rounded-xl overflow-hidden">
                          {msg.attachment.type === 'audio' ? (
                            <AudioPlayer
                              src={msg.attachment.url}
                              duration={msg.attachment.duration}
                              isFromAdminOrDono={!isFromClient}
                            />
                          ) : msg.attachment.type === 'image' ? (
                            <img src={msg.attachment.url} alt="Anexo" className="max-h-52 w-full object-cover rounded-xl" />
                          ) : (
                            <a
                              href={msg.attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 bg-black/20 text-xs underline block rounded-xl"
                            >
                              📎 {msg.attachment.name}
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    <span className="text-[9px] text-neutral-500 font-light px-1 block text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Prévia de Anexo */}
        {attachmentPreview && (
          <div className="px-6 py-2 bg-[#121212] border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={attachmentPreview} alt="Anexo" className="w-8 h-8 rounded-lg object-cover" />
              <span className="text-xs text-neutral-300 font-light truncate max-w-[200px]">
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
              <X size={14} />
            </button>
          </div>
        )}

        {/* Campo de Mensagem Elegante */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-4 bg-[#0c0c0c] border-t border-white/5 flex items-center gap-3"
        >
          <label
            htmlFor="chat-file-upload-pub"
            className="p-2.5 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition-colors shrink-0"
            title="Anexar imagem"
          >
            <ImageIcon size={16} />
            <input
              id="chat-file-upload-pub"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <AudioRecorder onAudioRecorded={handleSendAudioAttachment} isCompact={true} />

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-[#141414] border border-white/10 focus:border-[#c5a059] text-white rounded-xl px-4 py-3 text-xs sm:text-sm outline-none placeholder:text-neutral-500 transition-all font-light"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() && !attachmentPreview}
            className="p-3 bg-[#d4af37] hover:bg-[#e5c158] disabled:opacity-30 text-black font-semibold rounded-xl transition-all shadow-md shrink-0"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
