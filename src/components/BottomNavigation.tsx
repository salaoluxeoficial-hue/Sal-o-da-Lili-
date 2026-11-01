import React from 'react';
import { LayoutDashboard, UserSquare2, ShoppingBag } from 'lucide-react';
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
      label: 'Agendamento',
      icon: UserSquare2,
      isActive: currentView === 'area_cliente' || currentView === 'clientes',
      targetView: 'area_cliente' as ViewType
    },
    {
      id: 'vitrine',
      label: 'Serviços & Vitrine',
      icon: ShoppingBag,
      isActive: currentView === 'vitrine',
      targetView: 'vitrine' as ViewType
    }
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#080808]/95 backdrop-blur-md border-t border-white/5 px-4 py-2">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.targetView)}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-4 rounded-xl transition-all duration-200 group min-w-[80px]",
                item.isActive 
                  ? "text-[#c5a059]" 
                  : "text-neutral-500 hover:text-neutral-300"
              )}
            >
              <Icon 
                size={20} 
                className={cn(
                  "transition-transform duration-200",
                  item.isActive ? "scale-105 text-[#c5a059]" : "text-neutral-500"
                )} 
              />
              <span className={cn(
                "text-[10px] font-medium mt-1 tracking-wide transition-colors",
                item.isActive ? "text-[#c5a059]" : "text-neutral-500"
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
