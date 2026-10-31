import React from 'react';
import { LayoutDashboard, UserSquare2, Sparkles } from 'lucide-react';
import { ViewType } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface BottomNavigationProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  unreadChatCount?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentView,
  onViewChange,
  unreadChatCount = 0
}) => {
  const navItems = [
    {
      id: 'inicio',
      label: 'Início',
      icon: LayoutDashboard,
      isActive: currentView === 'dashboard',
      targetView: 'dashboard' as ViewType
    },
    {
      id: 'cliente',
      label: 'Cliente',
      icon: UserSquare2,
      isActive: currentView === 'area_cliente' || currentView === 'clientes',
      targetView: 'area_cliente' as ViewType
    },
    {
      id: 'vitrine',
      label: 'Vitrine',
      icon: Sparkles,
      isActive: currentView === 'vitrine',
      targetView: 'vitrine' as ViewType
    }
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-[#d4af37]/20 px-2 py-2 shadow-2xl">
      <div className="max-w-xl mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.targetView)}
              className={cn(
                "relative flex flex-col items-center justify-center py-1.5 px-4 rounded-xl transition-all duration-300 group min-w-[72px]",
                item.isActive 
                  ? "text-[#d4af37]" 
                  : "text-neutral-400 hover:text-neutral-200"
              )}
            >
              {/* Active Glow Pill Indicator */}
              {item.isActive && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#d4af37] rounded-full shadow-[0_0_12px_#d4af37]" />
              )}

              <div className="relative">
                <Icon 
                  size={22} 
                  className={cn(
                    "transition-transform duration-300 group-hover:scale-110",
                    item.isActive && "scale-110 text-[#d4af37]"
                  )} 
                />
              </div>

              <span className={cn(
                "text-[11px] font-medium mt-1 tracking-wide transition-colors",
                item.isActive ? "font-bold text-[#d4af37]" : "text-neutral-400"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </footer>
  );
};
