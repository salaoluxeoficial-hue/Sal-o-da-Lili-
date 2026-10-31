import React, { useState } from 'react';
import { 
  Menu, 
  Plus, 
  Trash2, 
  Edit2, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  Sparkles, 
  UserSquare2, 
  Users, 
  Lock, 
  Download, 
  Image as ImageIcon, 
  Calendar, 
  ShoppingBag, 
  MessageSquare, 
  Scissors,
  Save,
  X
} from 'lucide-react';
import { DynamicMenuItem, UserRole, ViewType } from '@/src/types';
import { getInitialDynamicMenu, saveDynamicMenu } from '@/src/services/dynamicMenuStorage';
import { cn } from '@/src/lib/utils';

const AVAILABLE_ICONS = [
  { id: 'UserSquare2', name: 'Cliente (UserSquare2)', icon: UserSquare2 },
  { id: 'Users', name: 'Profissional (Users)', icon: Users },
  { id: 'Lock', name: 'Painel ADM (Lock)', icon: Lock },
  { id: 'Download', name: 'Download / PWA (Download)', icon: Download },
  { id: 'Image', name: 'Galeria (Image)', icon: ImageIcon },
  { id: 'Sparkles', name: 'Vitrine (Sparkles)', icon: Sparkles },
  { id: 'Calendar', name: 'Agenda (Calendar)', icon: Calendar },
  { id: 'ShoppingBag', name: 'Produtos (ShoppingBag)', icon: ShoppingBag },
  { id: 'MessageSquare', name: 'Chat (MessageSquare)', icon: MessageSquare },
  { id: 'Scissors', name: 'Serviços (Scissors)', icon: Scissors }
];

const AVAILABLE_TARGETS: { id: string; label: string }[] = [
  { id: 'area_cliente', label: 'Área do Cliente (Login / Portal)' },
  { id: 'espaco_profissional', label: 'Espaço do Profissional (Login / Portal)' },
  { id: 'area_restrita_admin', label: 'Painel Administrativo (Área Segura)' },
  { id: 'pwa_install', label: 'Instalar Aplicativo PWA (Instalação)' },
  { id: 'galeria', label: 'Galeria do Salão (Estrutura)' },
  { id: 'vitrine', label: 'Vitrine Digital (Serviços e Produtos)' },
  { id: 'chat', label: 'Chat de Atendimento (Comunicação)' }
];

export const MenuManager: React.FC = () => {
  const [menuItems, setMenuItems] = useState<DynamicMenuItem[]>(() => getInitialDynamicMenu());
  const [editingItem, setEditingItem] = useState<DynamicMenuItem | null>(null);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New item form state
  const [newLabel, setNewLabel] = useState('');
  const [newIconName, setNewIconName] = useState('Sparkles');
  const [newTargetView, setNewTargetView] = useState('vitrine');
  const [newRoles, setNewRoles] = useState<UserRole[]>(['publico', 'cliente', 'profissional', 'admin']);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveAll = (updatedItems?: DynamicMenuItem[]) => {
    const itemsToSave = updatedItems || menuItems;
    saveDynamicMenu(itemsToSave);
    setMenuItems(itemsToSave);
    showToast('Menu lateral dinâmico atualizado e salvo com sucesso!');
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const copy = [...menuItems];
    const temp = copy[index];
    copy[index] = copy[index - 1];
    copy[index - 1] = temp;

    // Recalculate order index
    const reordered = copy.map((item, idx) => ({ ...item, order: idx + 1 }));
    setMenuItems(reordered);
    handleSaveAll(reordered);
  };

  const handleMoveDown = (index: number) => {
    if (index === menuItems.length - 1) return;
    const copy = [...menuItems];
    const temp = copy[index];
    copy[index] = copy[index + 1];
    copy[index + 1] = temp;

    const reordered = copy.map((item, idx) => ({ ...item, order: idx + 1 }));
    setMenuItems(reordered);
    handleSaveAll(reordered);
  };

  const handleToggleActive = (id: string) => {
    const updated = menuItems.map(item => 
      item.id === id ? { ...item, active: !item.active } : item
    );
    setMenuItems(updated);
    handleSaveAll(updated);
  };

  const handleToggleVisible = (id: string) => {
    const updated = menuItems.map(item => 
      item.id === id ? { ...item, visible: !item.visible } : item
    );
    setMenuItems(updated);
    handleSaveAll(updated);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Tem certeza de que deseja remover esta opção do menu lateral?')) {
      const updated = menuItems.filter(item => item.id !== id);
      setMenuItems(updated);
      handleSaveAll(updated);
    }
  };

  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const newItem: DynamicMenuItem = {
      id: `menu-custom-${Date.now()}`,
      label: newLabel.trim(),
      iconName: newIconName,
      targetView: newTargetView as any,
      roles: newRoles,
      order: menuItems.length + 1,
      active: true,
      visible: true
    };

    const updated = [...menuItems, newItem];
    setMenuItems(updated);
    handleSaveAll(updated);

    // Reset form
    setNewLabel('');
    setIsNewItemModalOpen(false);
  };

  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const updated = menuItems.map(item => 
      item.id === editingItem.id ? editingItem : item
    );

    setMenuItems(updated);
    handleSaveAll(updated);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161616] border border-[#d4af37] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
          <CheckCircle2 size={18} className="text-[#d4af37]" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#101010] border border-[#d4af37]/25 p-6 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Gerenciador do Menu Lateral
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30">
              Personalização ADM
            </span>
          </div>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1">
            Crie, edite, reordene e defina as permissões das opções que aparecem na área pública e no aplicativo.
          </p>
        </div>

        <button
          onClick={() => setIsNewItemModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#d4af37] text-black font-extrabold px-5 py-3 rounded-2xl text-xs hover:bg-[#b8860b] transition-all shadow-lg shadow-[#d4af37]/20"
        >
          <Plus size={16} />
          <span>Criar Novo Botão</span>
        </button>
      </div>

      {/* Menu Items Table List */}
      <div className="bg-[#101010] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 bg-[#141414] border-b border-white/10 flex items-center justify-between text-xs text-neutral-400 font-bold uppercase tracking-wider">
          <span>Opções Ativas do Menu</span>
          <span>Ordem & Ações</span>
        </div>

        <div className="divide-y divide-white/5">
          {menuItems.map((item, index) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1 bg-white/5 hover:bg-white/10 disabled:opacity-20 text-neutral-300 rounded hover:text-[#d4af37] transition-colors"
                    title="Mover Para Cima"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === menuItems.length - 1}
                    className="p-1 bg-white/5 hover:bg-white/10 disabled:opacity-20 text-neutral-300 rounded hover:text-[#d4af37] transition-colors"
                    title="Mover Para Baixo"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>

                <div className="w-10 h-10 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center text-[#d4af37] font-bold shrink-0">
                  {item.order}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-white font-bold text-sm">{item.label}</h4>
                    {!item.active && (
                      <span className="px-2 py-0.2 bg-rose-500/20 text-rose-400 text-[9px] font-bold rounded uppercase">
                        Inativo
                      </span>
                    )}
                    {!item.visible && (
                      <span className="px-2 py-0.2 bg-amber-500/20 text-amber-400 text-[9px] font-bold rounded uppercase">
                        Oculto
                      </span>
                    )}
                  </div>
                  <p className="text-neutral-400 text-xs mt-0.5">
                    Destino: <span className="text-white font-mono">{item.targetView}</span> • Ícone: <span className="text-white">{item.iconName}</span>
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.roles.map((r: UserRole) => (
                      <span key={r} className="px-2 py-0.2 bg-white/5 text-neutral-400 border border-white/10 text-[9px] font-semibold rounded uppercase">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => handleToggleVisible(item.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border",
                    item.visible
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-neutral-800 text-neutral-500 border-white/10"
                  )}
                  title="Visibilidade no menu"
                >
                  {item.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span>{item.visible ? 'Visível' : 'Oculto'}</span>
                </button>

                <button
                  onClick={() => handleToggleActive(item.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border",
                    item.active
                      ? "bg-[#d4af37]/15 text-[#d4af37] border-[#d4af37]/30"
                      : "bg-neutral-800 text-neutral-500 border-white/10"
                  )}
                  title="Status de ativação"
                >
                  <span>{item.active ? 'Ativo' : 'Inativo'}</span>
                </button>

                <button
                  onClick={() => setEditingItem(item)}
                  className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 hover:border-[#d4af37]/40 transition-colors"
                  title="Editar Botão"
                >
                  <Edit2 size={16} />
                </button>

                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 transition-colors"
                  title="Excluir Botão"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE NEW ITEM MODAL */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#101010] border border-[#d4af37]/30 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white">Criar Novo Botão no Menu</h3>
              <button onClick={() => setIsNewItemModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateNewItem} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-neutral-300 font-bold uppercase">Nome do Botão *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Minhas Promoções"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-300 font-bold uppercase">Ícone do Botão</label>
                <select
                  value={newIconName}
                  onChange={(e) => setNewIconName(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#d4af37]"
                >
                  {AVAILABLE_ICONS.map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-300 font-bold uppercase">Destino / Ação</label>
                <select
                  value={newTargetView}
                  onChange={(e) => setNewTargetView(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#d4af37]"
                >
                  {AVAILABLE_TARGETS.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#d4af37] text-black font-extrabold text-xs rounded-xl hover:bg-[#b8860b] transition-all"
              >
                Salvar Novo Botão no Menu
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ITEM MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#101010] border border-[#d4af37]/30 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white">Editar Botão do Menu</h3>
              <button onClick={() => setEditingItem(null)} className="text-neutral-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateItem} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-neutral-300 font-bold uppercase">Nome do Botão *</label>
                <input
                  type="text"
                  required
                  value={editingItem.label}
                  onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                  className="w-full bg-[#161616] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-300 font-bold uppercase">Ícone</label>
                <select
                  value={editingItem.iconName}
                  onChange={(e) => setEditingItem({ ...editingItem, iconName: e.target.value })}
                  className="w-full bg-[#161616] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#d4af37]"
                >
                  {AVAILABLE_ICONS.map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-300 font-bold uppercase">Destino / Ação</label>
                <select
                  value={editingItem.targetView}
                  onChange={(e) => setEditingItem({ ...editingItem, targetView: e.target.value as any })}
                  className="w-full bg-[#161616] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#d4af37]"
                >
                  {AVAILABLE_TARGETS.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#d4af37] text-black font-extrabold text-xs rounded-xl hover:bg-[#b8860b] transition-all"
              >
                Atualizar Botão
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
