import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserSquare2, 
  Users, 
  Lock, 
  Download, 
  Image as ImageIcon, 
  Sparkles, 
  Calendar, 
  ShoppingBag, 
  MessageSquare, 
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Scissors
} from 'lucide-react';
import { DynamicMenuItem, ViewType, UserRole } from '@/src/types';
import { getInitialDynamicMenu } from '@/src/services/dynamicMenuStorage';
import { cn } from '@/src/lib/utils';

interface PublicSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (targetView: ViewType | 'pwa_install' | 'espaco_profissional' | 'area_restrita_admin' | 'galeria') => void;
  currentUserRole?: UserRole;
}

const ICON_MAP: Record<string, React.ElementType> = {
  UserSquare2,
  Users,
  Lock,
  Download,
  Image: ImageIcon,
  Sparkles,
  Calendar,
  ShoppingBag,
  MessageSquare,
  Scissors
};

export const PublicSidebar: React.FC<PublicSidebarProps> = ({
  isOpen,
  onClose,
  onSelectOption,
  currentUserRole = 'publico'
}) => {
  const [menuItems, setMenuItems] = useState<DynamicMenuItem[]>(() => getInitialDynamicMenu());

  useEffect(() => {
    const handleMenuUpdate = () => {
      setMenuItems(getInitialDynamicMenu());
    };

    window.addEventListener('salao-luxe-menu-update', handleMenuUpdate);
    window.addEventListener('storage', handleMenuUpdate);
    return () => {
      window.removeEventListener('salao-luxe-menu-update', handleMenuUpdate);
      window.removeEventListener('storage', handleMenuUpdate);
    };
  }, []);

  if (!isOpen) return null;

  // Filter items based on active state, visibility, and user role
  const visibleItems = menuItems
    .filter(item => item.active && item.visible)
    .filter(item => item.roles.includes(currentUserRole) || currentUserRole === 'admin');

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-[#0a0a0a] border-r border-[#d4af37]/30 z-50 shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-300">
        <div>
          {/* Header */}
          <div className="p-6 border-b border-[#d4af37]/20 flex items-center justify-between bg-[#101010]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#8a7122] flex items-center justify-center text-black font-extrabold text-sm shadow-md">
                SL
              </div>
              <div>
                <span className="text-[#d4af37] font-extrabold text-base tracking-wider block leading-tight">
                  SALÃO LUXE
                </span>
                <span className="text-[10px] text-neutral-400 uppercase tracking-widest block font-medium">
                  Menu Principal
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-[#d4af37] border border-white/10 rounded-xl transition-all flex items-center gap-1 text-xs font-bold"
              title="Recolher Menu Lateral"
            >
              <ChevronLeft size={18} className="text-[#d4af37]" />
              <span>Recolher</span>
            </button>
          </div>

          {/* Menu Items */}
          <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-180px)]">
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider px-3 block mb-2">
              Navegação do Salão
            </span>

            {visibleItems.map((item) => {
              const IconComponent = ICON_MAP[item.iconName] || Sparkles;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectOption(item.targetView);
                    onClose();
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-3.5 rounded-2xl transition-all duration-200 group border text-left",
                    item.isAction
                      ? "bg-gradient-to-r from-[#d4af37]/15 via-white/5 to-transparent border-[#d4af37]/30 text-white font-bold hover:border-[#d4af37]"
                      : "bg-white/5 border-white/5 hover:border-[#d4af37]/40 hover:bg-white/10 text-neutral-200"
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
                      item.isAction
                        ? "bg-[#d4af37] text-black font-extrabold"
                        : "bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#d4af37] group-hover:bg-[#d4af37] group-hover:text-black"
                    )}>
                      <IconComponent size={18} />
                    </div>
                    <div>
                      <span className="text-sm font-bold block">{item.label}</span>
                      {item.isAction && (
                        <span className="text-[10px] text-[#d4af37] block font-medium">Instalar no Celular</span>
                      )}
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-neutral-500 group-hover:text-[#d4af37] transition-colors" />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#d4af37]/20 bg-[#0d0d0d] space-y-2">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-center">
            <span className="text-[11px] text-neutral-400 block">Horário de Atendimento</span>
            <span className="text-xs font-bold text-[#d4af37]">Terça a Sábado: 09h às 20h</span>
          </div>
        </div>
      </aside>
    </>
  );
};
