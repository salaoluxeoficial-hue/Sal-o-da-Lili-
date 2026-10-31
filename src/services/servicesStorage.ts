import { Service } from '@/src/types';

export function getInitialServices(): Service[] {
  return [
    { id: '1', name: 'Corte Masculino', category: 'Cabelo', price: 60, duration: 30 },
    { id: '2', name: 'Corte Feminino', category: 'Cabelo', price: 120, duration: 60 },
    { id: '3', name: 'Barba Terapia', category: 'Barba', price: 45, duration: 30 },
    { id: '4', name: 'Coloração', category: 'Química', price: 180, duration: 120 },
    { id: '5', name: 'Escova Modeladora', category: 'Finalização', price: 80, duration: 45 },
  ];
}

export const SERVICE_CATEGORIES = [
  'Todas',
  'Cabelo',
  'Barba',
  'Química',
  'Finalização',
  'Estética',
  'Unhas',
  'Maquiagem',
];
