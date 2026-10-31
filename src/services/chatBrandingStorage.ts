export interface ChatAppearanceConfig {
  name: string;
  subtitle: string;
  avatarUrl: string; // Data URL or Image URL
  zoom: number; // 1.0 to 2.5
  positionX: number; // 0 to 100%
  positionY: number; // 0 to 100%
  accentColor: string;
  tagText: string;
  onlineStatusText: string;
  borderGlow: boolean;
}

export interface ChatBrandingSettings {
  aiAssistant: ChatAppearanceConfig;
  receptionChat: ChatAppearanceConfig;
}

export const LUXURY_ACCENT_COLORS = [
  { id: 'champagne', label: 'Dourado Champanhe', hex: '#d4af37' },
  { id: 'amber', label: 'Âmbar Real', hex: '#f59e0b' },
  { id: 'rose_gold', label: 'Ouro Rosa / Rosé', hex: '#e0a96d' },
  { id: 'platinum', label: 'Platina Nobre', hex: '#e2e8f0' },
  { id: 'emerald', label: 'Esmeralda Luxe', hex: '#10b981' },
];

export const DEFAULT_CHAT_BRANDING: ChatBrandingSettings = {
  aiAssistant: {
    name: 'Assistente IA Luxe',
    subtitle: 'Inteligência Artificial VIP',
    avatarUrl: '',
    zoom: 1.0,
    positionX: 50,
    positionY: 50,
    accentColor: '#d4af37',
    tagText: '24/7 VIP',
    onlineStatusText: 'Online e Ativa',
    borderGlow: true,
  },
  receptionChat: {
    name: 'Atendimento Luxe',
    subtitle: 'Recepção Humana & Concierge',
    avatarUrl: '',
    zoom: 1.0,
    positionX: 50,
    positionY: 50,
    accentColor: '#d4af37',
    tagText: 'Humano',
    onlineStatusText: 'Equipe Conectada',
    borderGlow: true,
  },
};

const STORAGE_KEY = 'chat_branding_settings';

export function getInitialChatBranding(): ChatBrandingSettings {
  if (typeof window === 'undefined') return DEFAULT_CHAT_BRANDING;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CHAT_BRANDING;
    const parsed = JSON.parse(raw);
    return {
      aiAssistant: { ...DEFAULT_CHAT_BRANDING.aiAssistant, ...(parsed.aiAssistant || {}) },
      receptionChat: { ...DEFAULT_CHAT_BRANDING.receptionChat, ...(parsed.receptionChat || {}) },
    };
  } catch (err) {
    console.error('Error loading chat branding:', err);
    return DEFAULT_CHAT_BRANDING;
  }
}

export function saveChatBranding(settings: ChatBrandingSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    broadcastChatBrandingUpdate();
  } catch (err) {
    console.error('Error saving chat branding:', err);
  }
}

export function broadcastChatBrandingUpdate(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('salao-luxe-branding-sync'));
  }
}
