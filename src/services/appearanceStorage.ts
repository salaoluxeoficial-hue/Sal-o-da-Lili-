export interface AppearanceSettings {
  fontSize: 'pequena' | 'media' | 'grande';
  titleScale: 'compacto' | 'padrao' | 'destacado';
  cardRadius: 'suave' | 'padrao' | 'arredondado';
  cardPadding: 'compacto' | 'confortavel' | 'espacoso';
  buttonStyle: 'padrao' | 'elegante' | 'minimalista';
  density: 'confortavel' | 'compacto' | 'expandido';
}

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  fontSize: 'media',
  titleScale: 'padrao',
  cardRadius: 'padrao',
  cardPadding: 'confortavel',
  buttonStyle: 'elegante',
  density: 'confortavel',
};

export function getInitialAppearance(): AppearanceSettings {
  try {
    const raw = localStorage.getItem('salon_appearance_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_APPEARANCE, ...parsed };
      }
    }
  } catch (err) {
    console.error('Error reading salon_appearance_settings:', err);
  }
  return DEFAULT_APPEARANCE;
}

export function saveAppearance(settings: AppearanceSettings): void {
  try {
    localStorage.setItem('salon_appearance_settings', JSON.stringify(settings));
    window.dispatchEvent(new Event('salao-luxe-appearance-update'));
  } catch (err) {
    console.error('Error saving salon_appearance_settings:', err);
  }
}
