import { DynamicMenuItem } from '@/src/types';

export const INITIAL_DYNAMIC_MENU: DynamicMenuItem[] = [
  {
    id: 'menu-cliente',
    label: 'Cliente',
    iconName: 'UserSquare2',
    targetView: 'area_cliente',
    roles: ['publico', 'cliente', 'admin'],
    order: 1,
    active: true,
    visible: true
  },
  {
    id: 'menu-profissional',
    label: 'Profissional',
    iconName: 'Users',
    targetView: 'espaco_profissional',
    roles: ['publico', 'profissional', 'admin'],
    order: 2,
    active: true,
    visible: true
  },
  {
    id: 'menu-painel-adm',
    label: 'Painel ADM',
    iconName: 'Lock',
    targetView: 'area_restrita_admin',
    roles: ['publico', 'admin'],
    order: 3,
    active: true,
    visible: true
  },
  {
    id: 'menu-pwa-install',
    label: 'Instalar aplicativo PWA',
    iconName: 'Download',
    targetView: 'pwa_install',
    roles: ['publico', 'cliente', 'profissional', 'admin'],
    order: 4,
    active: true,
    visible: true,
    isAction: true
  },
  {
    id: 'menu-galeria',
    label: 'Galeria',
    iconName: 'Image',
    targetView: 'galeria',
    roles: ['publico', 'cliente', 'profissional', 'admin'],
    order: 5,
    active: true,
    visible: true
  },
  {
    id: 'menu-vitrine',
    label: 'Vitrine',
    iconName: 'Sparkles',
    targetView: 'vitrine',
    roles: ['publico', 'cliente', 'profissional', 'admin'],
    order: 6,
    active: true,
    visible: true
  }
];

export function getInitialDynamicMenu(): DynamicMenuItem[] {
  try {
    const raw = localStorage.getItem('dynamic_public_menu');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => a.order - b.order);
      }
    }
  } catch (err) {
    console.error('Error reading dynamic_public_menu:', err);
  }
  return INITIAL_DYNAMIC_MENU;
}

export function saveDynamicMenu(items: DynamicMenuItem[]): void {
  try {
    localStorage.setItem('dynamic_public_menu', JSON.stringify(items));
    window.dispatchEvent(new Event('salao-luxe-menu-update'));
  } catch (err) {
    console.error('Error saving dynamic_public_menu:', err);
  }
}
