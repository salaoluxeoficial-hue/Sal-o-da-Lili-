import { Professional } from '@/src/types';

export function getInitialProfessionals(): Professional[] {
  return [
    { id: '1', name: 'Ricardo Silva', role: 'Cabeleireiro Master', commission: 40, specialties: ['Corte', 'Barba'], photoUrl: 'RS' },
    { id: '2', name: 'Ana Oliveira', role: 'Colorista Premium', commission: 35, specialties: ['Coloração', 'Mechas'], photoUrl: 'AO' },
  ];
}
