import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  Sparkles, 
  X, 
  MessageSquareQuote,
  Zap,
  ArrowRight
} from 'lucide-react';
import { ChatAttachment, QuickReply, ChatParticipantType } from '@/src/types';
import { formatFileSize } from '@/src/services/chatStorage';
import { AudioRecorder } from './AudioRecorder';

interface ChatInputProps {
  onSendMessage: (content: string, attachment?: ChatAttachment) => void;
  quickReplies: QuickReply[];
  onOpenQuickRepliesModal: () => void;
  senderRole: ChatParticipantType;
  senderName: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  quickReplies,
  onOpenQuickRepliesModal,
  senderRole,
  senderName
}) => {
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [quickFilter, setQuickFilter] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const quickMenuRef = useRef<HTMLDivElement>(null);

  // Close quick menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickMenuRef.current && !quickMenuRef.current.contains(e.target as Node)) {
        setShowQuickMenu(false);
      }
    };
    if (showQuickMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showQuickMenu]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachment({
          id: `att-${Date.now()}`,
          name: file.name,
          url: reader.result,
          type: isImage ? 'image' : 'file',
          sizeFormatted: formatFileSize(file.size),
          mimeType: file.type
        });
      }
    };

    reader.readAsDataURL(file);
    // Reset file input so same file can be selected again
    e.target.value = '';
  };

  const handleSend = () => {
    if (!text.trim() && !attachment) return;
    onSendMessage(text.trim(), attachment || undefined);
    setText('');
    setAttachment(null);
    setShowQuickMenu(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectQuickReply = (reply: QuickReply) => {
    setText(reply.content);
    setShowQuickMenu(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const filteredQuickReplies = quickReplies.filter(qr => 
    qr.title.toLowerCase().includes(quickFilter.toLowerCase()) ||
    qr.shortcut.toLowerCase().includes(quickFilter.toLowerCase()) ||
    qr.content.toLowerCase().includes(quickFilter.toLowerCase())
  );

  return (
    <div className="p-2.5 sm:p-3 bg-[#0c0c0c] border-t border-[#d4af37]/15 relative">
      {/* Quick Replies Popup Menu */}
      {showQuickMenu && (
        <div 
          ref={quickMenuRef}
          className="absolute bottom-full left-3 right-3 sm:left-4 sm:right-auto sm:w-80 mb-2 bg-[#121212] border border-[#d4af37]/30 rounded-2xl shadow-2xl overflow-hidden z-30 flex flex-col max-h-72"
        >
          <div className="p-2.5 border-b border-white/10 bg-[#161616] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#d4af37]">
              <Zap size={13} />
              <span>Respostas Rápidas</span>
            </div>
            <button
              onClick={onOpenQuickRepliesModal}
              className="text-[10px] text-neutral-400 hover:text-white underline"
            >
              Gerenciar modelos
            </button>
          </div>

          <div className="p-2 border-b border-white/5 bg-black/40">
            <input
              type="text"
              placeholder="Filtrar modelos ou digite /atalho..."
              value={quickFilter}
              onChange={(e) => setQuickFilter(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#d4af37]/50"
              autoFocus
            />
          </div>

          <div className="overflow-y-auto divide-y divide-white/5 p-1 max-h-48">
            {filteredQuickReplies.length === 0 ? (
              <div className="p-3 text-center text-xs text-neutral-500">
                Nenhum modelo encontrado.
              </div>
            ) : (
              filteredQuickReplies.map((qr) => (
                <button
                  key={qr.id}
                  onClick={() => handleSelectQuickReply(qr)}
                  className="w-full text-left p-2 rounded-lg hover:bg-white/5 transition-colors flex flex-col gap-1 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white group-hover:text-[#d4af37] transition-colors">
                      {qr.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#d4af37] bg-[#d4af37]/10 px-1.5 py-0.5 rounded">
                      {qr.shortcut}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed">
                    {qr.content}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Attachment Staging Preview */}
      {attachment && (
        <div className="mb-2 p-2 bg-[#171717] border border-[#d4af37]/30 rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            {attachment.type === 'image' ? (
              <img 
                src={attachment.url} 
                alt={attachment.name} 
                className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0" 
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center shrink-0">
                <Paperclip size={18} />
              </div>
            )}
            <div className="truncate">
              <span className="text-xs font-medium text-white truncate block">{attachment.name}</span>
              <span className="text-[10px] text-neutral-400">{attachment.sizeFormatted}</span>
            </div>
          </div>

          <button
            onClick={() => setAttachment(null)}
            className="p-1 text-neutral-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
            title="Remover anexo"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input Row */}
      <div className="flex items-end gap-1.5 bg-[#141414] border border-white/10 rounded-xl p-1.5 focus-within:border-[#d4af37]/60 transition-all">
        {/* Attachment & Quick Replies buttons */}
        <div className="flex items-center gap-0.5 shrink-0 pb-0.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-neutral-400 hover:text-[#d4af37] hover:bg-white/5 rounded-lg transition-colors"
            title="Anexar foto ou documento"
          >
            <Paperclip size={16} />
          </button>

          <button
            type="button"
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            className="p-1.5 text-neutral-400 hover:text-[#d4af37] hover:bg-white/5 rounded-lg transition-colors relative"
            title="Respostas Rápidas"
          >
            <Zap size={16} className={showQuickMenu ? 'text-[#d4af37]' : ''} />
          </button>

          <AudioRecorder
            onAudioRecorded={(audioAtt) => {
              onSendMessage('', audioAtt);
            }}
            isCompact={true}
          />
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            // Auto resize height
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
          }}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={`Mensagem como ${senderName}...`}
          className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder:text-neutral-500 resize-none py-1.5 px-1 max-h-24 min-h-[32px] leading-relaxed"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() && !attachment}
          className="p-2 bg-[#d4af37] text-black rounded-lg hover:bg-[#e5c158] disabled:opacity-30 disabled:cursor-not-allowed transition-all font-semibold shrink-0 shadow-md shadow-[#d4af37]/20"
          title="Enviar mensagem"
        >
          <Send size={15} />
        </button>
      </div>

      <div className="flex items-center justify-between mt-1 px-1 text-[10px] text-neutral-500">
        <span>Enter envia • Shift+Enter nova linha</span>
        <span className="text-neutral-400">
          Remetente: <strong className="text-[#d4af37]">{senderName}</strong>
        </span>
      </div>
    </div>
  );
};
