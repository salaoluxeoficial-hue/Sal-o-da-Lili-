import React from 'react';
import { X, Download, FileText, ExternalLink } from 'lucide-react';
import { ChatAttachment } from '@/src/types';

interface AttachmentModalProps {
  attachment: ChatAttachment | null;
  onClose: () => void;
}

export const AttachmentModal: React.FC<AttachmentModalProps> = ({ attachment, onClose }) => {
  if (!attachment) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f0f0f] border border-[#d4af37]/30 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#141414]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] shrink-0">
              <FileText size={18} />
            </div>
            <div className="truncate">
              <h4 className="text-white font-medium text-sm truncate">{attachment.name}</h4>
              <p className="text-neutral-500 text-xs">{attachment.sizeFormatted || 'Anexo'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={attachment.url}
              download={attachment.name}
              className="p-2 text-neutral-400 hover:text-[#d4af37] hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1.5 text-xs"
              title="Baixar arquivo"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Baixar</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex items-center justify-center bg-black/60 min-h-[300px]">
          {attachment.type === 'image' ? (
            <img 
              src={attachment.url} 
              alt={attachment.name} 
              className="max-h-[65vh] max-w-full rounded-lg object-contain shadow-lg"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8 border border-white/10 rounded-xl bg-[#141414]/60 max-w-md w-full">
              <div className="w-16 h-16 rounded-2xl bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center mb-4">
                <FileText size={36} />
              </div>
              <h3 className="text-white font-medium text-lg mb-1">{attachment.name}</h3>
              <p className="text-neutral-400 text-sm mb-6">{attachment.sizeFormatted || 'Documento / Arquivo'}</p>
              <a
                href={attachment.url}
                download={attachment.name}
                className="px-5 py-2.5 bg-[#d4af37] text-black font-semibold rounded-lg hover:bg-[#e5c158] transition-colors flex items-center gap-2"
              >
                <Download size={18} />
                Baixar Documento
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
