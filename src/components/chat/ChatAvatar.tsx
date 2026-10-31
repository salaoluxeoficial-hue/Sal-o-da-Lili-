import React from 'react';
import { Sparkles, Headphones, Bot } from 'lucide-react';
import { ChatAppearanceConfig } from '@/src/services/chatBrandingStorage';
import { cn } from '@/src/lib/utils';

interface ChatAvatarProps {
  config: ChatAppearanceConfig;
  type: 'ai' | 'reception';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatusIndicator?: boolean;
  showStatusDot?: boolean;
  className?: string;
}

export const ChatAvatar: React.FC<ChatAvatarProps> = ({
  config,
  type,
  size = 'md',
  showStatusIndicator = true,
  showStatusDot,
  className,
}) => {
  const showDot = showStatusDot !== undefined ? showStatusDot : showStatusIndicator;
  const sizeMap = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const iconSizeMap = {
    sm: 15,
    md: 18,
    lg: 22,
    xl: 28,
  };

  const statusSizeMap = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
  };

  const hasCustomImage = Boolean(config.avatarUrl && config.avatarUrl.trim().length > 0);

  return (
    <div className={cn("relative shrink-0 select-none", className)}>
      <div 
        className={cn(
          "rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-300 shadow-md",
          sizeMap[size],
          config.borderGlow && "shadow-[0_0_15px_rgba(212,175,55,0.25)]"
        )}
        style={{
          border: `1.5px solid ${config.accentColor || '#d4af37'}`,
          background: hasCustomImage ? '#080808' : 'linear-gradient(135deg, #18160f 0%, #0d0d0d 100%)',
        }}
      >
        {hasCustomImage ? (
          <img
            src={config.avatarUrl}
            alt={config.name}
            className="w-full h-full object-cover transition-transform duration-150"
            style={{
              transform: `scale(${config.zoom || 1})`,
              objectPosition: `${config.positionX ?? 50}% ${config.positionY ?? 50}%`,
            }}
          />
        ) : type === 'ai' ? (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${config.accentColor || '#d4af37'}33, transparent 70%)`,
            }}
          >
            <Sparkles 
              size={iconSizeMap[size]} 
              style={{ color: config.accentColor || '#d4af37' }}
              className="drop-shadow-[0_0_6px_rgba(212,175,55,0.6)] animate-pulse" 
            />
          </div>
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${config.accentColor || '#d4af37'}33, transparent 70%)`,
            }}
          >
            <Headphones 
              size={iconSizeMap[size]} 
              style={{ color: config.accentColor || '#d4af37' }}
              className="drop-shadow-[0_0_6px_rgba(212,175,55,0.6)]" 
            />
          </div>
        )}
      </div>

      {showDot && (
        <span 
          className={cn(
            "absolute -bottom-0.5 -right-0.5 bg-emerald-500 rounded-full border-2 border-[#0a0a0a]",
            statusSizeMap[size]
          )}
        >
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
        </span>
      )}
    </div>
  );
};
