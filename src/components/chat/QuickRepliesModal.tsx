import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Check, Sparkles, MessageSquareQuote, Tag } from 'lucide-react';
import { QuickReply } from '@/src/types';

interface QuickRepliesModalProps {
  isOpen: boolean;
  onClose: () => void;
  quickReplies: QuickReply[];
  onSaveQuickReply: (reply: QuickReply) => void;
  onDeleteQuickReply: (id: string) => void;
  onSelectQuickReply?: (content: string) => void;
}

export const QuickRepliesModal: React.FC<QuickRepliesModalProps> = ({
  isOpen,
  onClose,
  quickReplies,
  onSaveQuickReply,
  onDeleteQuickReply,
  onSelectQuickReply
}) => {
  const [editingReply, setEditingReply] = useState<QuickReply | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [shortcut, setShortcut] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'agendamento' | 'atendimento' | 'equipe' | 'informacoes'>('atendimento');

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setEditingReply(null);
    setTitle('');
    setShortcut('/');
    setContent('');
    setCategory('atendimento');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (reply: QuickReply) => {
    setEditingReply(reply);
    setTitle(reply.title);
    setShortcut(reply.shortcut);
    setContent(reply.content);
    setCategory(reply.category);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const formattedShortcut = shortcut.startsWith('/') ? shortcut : `/${shortcut}`;

    const newReply: QuickReply = {
      id: editingReply ? editingReply.id : `qr-${Date.now()}`,
      title: title.trim(),
      shortcut: formattedShortcut,
      content: content.trim(),
      category
    };

    onSaveQuickReply(newReply);
    setIsFormOpen(false);
  };

  const categoryLabels: Record<string, string> = {
    agendamento: 'Agendamentos',
    atendimento: 'Atendimento & Boas-vindas',
    equipe: 'Comunicação Interna / Equipe',
    informacoes: 'Informações & Dúvidas'
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0c0c0c] border border-[#d4af37]/30 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#121212]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] border border-[#d4af37]/20">
              <MessageSquareQuote size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Respostas Rápidas Configuráveis</h2>
              <p className="text-xs text-neutral-400">Modelos de mensagens pré-definidos para agilizar o atendimento</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {!isFormOpen ? (
            <>
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs text-neutral-400 font-medium">
                  {quickReplies.length} {quickReplies.length === 1 ? 'modelo cadastrado' : 'modelos cadastrados'}
                </span>
                <button
                  onClick={handleOpenAdd}
                  className="px-3.5 py-1.5 bg-[#d4af37] hover:bg-[#e5c158] text-black text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-md shadow-[#d4af37]/20"
                >
                  <Plus size={16} />
                  Nova Resposta Rápida
                </button>
              </div>

              {quickReplies.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                  <p className="text-neutral-400 text-sm">Nenhum modelo de resposta rápida cadastrado ainda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {quickReplies.map((reply) => (
                    <div
                      key={reply.id}
                      className="p-4 bg-white/[0.02] border border-white/10 hover:border-[#d4af37]/40 rounded-xl transition-all group flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{reply.title}</span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/25">
                            {reply.shortcut}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-neutral-400">
                            {categoryLabels[reply.category] || reply.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          {onSelectQuickReply && (
                            <button
                              onClick={() => {
                                onSelectQuickReply(reply.content);
                                onClose();
                              }}
                              className="px-2.5 py-1 text-xs bg-white/10 hover:bg-[#d4af37] hover:text-black text-white rounded font-medium transition-colors mr-2"
                            >
                              Usar Agora
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(reply)}
                            className="p-1.5 text-neutral-400 hover:text-[#d4af37] hover:bg-white/5 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Excluir a resposta rápida "${reply.title}"?`)) {
                                onDeleteQuickReply(reply.id);
                              }
                            }}
                            className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-white/5 rounded transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-300 bg-black/40 p-2.5 rounded-lg border border-white/5 whitespace-pre-wrap leading-relaxed">
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Form View */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-semibold text-[#d4af37]">
                  {editingReply ? 'Editar Resposta Rápida' : 'Criar Nova Resposta Rápida'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  Voltar para lista
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1.5">Título do Modelo *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Confirmação de Horário"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1.5">Atalho Rápido (ex: /confirmar)</label>
                  <input
                    type="text"
                    value={shortcut}
                    onChange={(e) => setShortcut(e.target.value)}
                    placeholder="/atalho"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-[#171717] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                >
                  <option value="atendimento">Atendimento & Boas-vindas</option>
                  <option value="agendamento">Agendamentos & Confirmações</option>
                  <option value="equipe">Equipe & Colaboradores</option>
                  <option value="informacoes">Informações Gerais & Pagamentos</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Conteúdo da Mensagem *</label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Digite o texto padrão da mensagem que será inserido na conversa..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37] resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#d4af37] hover:bg-[#e5c158] text-black text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Check size={16} />
                  Salvar Modelo
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
