export interface AdminProfile {
  name: string;
  email: string;
  avatarUrl: string;
  roleTitle: string;
  phone?: string;
  updatedAt: string;
}

export const DEFAULT_ADMIN_PROFILE: AdminProfile = {
  name: 'Administrador Luxe',
  email: 'salaoluxe.oficial@gmail.com',
  avatarUrl: '',
  roleTitle: 'Gerência & Gestão VIP',
  phone: '(11) 99999-0000',
  updatedAt: new Date().toISOString(),
};

const STORAGE_KEY = 'salao_luxe_admin_profile';

export function getAdminProfile(): AdminProfile {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ADMIN_PROFILE;
    return { ...DEFAULT_ADMIN_PROFILE, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Error loading admin profile:', err);
    return DEFAULT_ADMIN_PROFILE;
  }
}

export function saveAdminProfile(profile: Partial<AdminProfile>): AdminProfile {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_PROFILE;
  try {
    const current = getAdminProfile();
    const updated: AdminProfile = {
      ...current,
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    broadcastAdminProfileUpdate();
    return updated;
  } catch (err) {
    console.error('Error saving admin profile:', err);
    return DEFAULT_ADMIN_PROFILE;
  }
}

export function broadcastAdminProfileUpdate(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('salao-luxe-admin-profile-sync'));
  }
}
