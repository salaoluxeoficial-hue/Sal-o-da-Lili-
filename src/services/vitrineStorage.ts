import { 
  ShowcaseBanner, 
  ShowcaseGalleryItem, 
  ShowcaseBeforeAfter, 
  ShowcaseTestimonial,
  ShowcaseCategory 
} from '@/src/types';

export const INITIAL_BANNERS: ShowcaseBanner[] = [
  {
    id: 'banner-1',
    title: 'A Arte da Transformação Capilar',
    subtitle: 'Experiência & Sofisticação',
    description: 'Técnicas exclusivas de mechas, cortes de precisão e tratamentos luxuosos para realçar sua melhor versão.',
    badge: 'Destaque Luxe',
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=80',
    videoUrl: '',
    ctaText: 'Agendar Experiência',
    ctaAction: 'agendar',
    order: 1,
    published: true,
    createdAt: '2026-01-10T10:00:00.000Z'
  },
  {
    id: 'banner-2',
    title: 'Barbearia Premium & Barba Terapia',
    subtitle: 'Cuidado Masculino Exclusivo',
    description: 'Toalhas quentes, óleos essenciais nobres e alinhamento milimétrico em um ambiente sofisticado com café e lounge.',
    badge: 'Exclusivo',
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1600&q=80',
    videoUrl: '',
    ctaText: 'Reservar Horário',
    ctaAction: 'agendar',
    order: 2,
    published: true,
    createdAt: '2026-01-12T10:00:00.000Z'
  },
  {
    id: 'banner-3',
    title: 'Linha Home Care Salão Luxe',
    subtitle: 'Cosméticos de Alta Performance',
    description: 'Traga os rituais de salão para o seu dia a dia. Fórmulas botânicas com infusão de ouro e queratina pura.',
    badge: 'Nova Coleção',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1600&q=80',
    videoUrl: '',
    ctaText: 'Conhecer Produtos',
    ctaAction: 'produtos',
    order: 3,
    published: true,
    createdAt: '2026-01-15T10:00:00.000Z'
  }
];

export const INITIAL_BEFORE_AFTER: ShowcaseBeforeAfter[] = [
  {
    id: 'ba-1',
    title: 'Loiras de Luxo: Balayage Champagne',
    category: 'cabelo',
    serviceName: 'Coloração & Mechas Premium',
    professionalName: 'Ana Oliveira',
    beforeImageUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80',
    afterImageUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80',
    description: 'Clareamento saudável sem quebra com reconstrução molecular de queratina e acabamento em ondas naturais.',
    order: 1,
    published: true,
    createdAt: '2026-02-01T12:00:00.000Z'
  },
  {
    id: 'ba-2',
    title: 'Design de Barba & Alinhamento Térmico',
    category: 'barba',
    serviceName: 'Barba Terapia Completa',
    professionalName: 'Ricardo Silva',
    beforeImageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80',
    afterImageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    description: 'Hidratação profunda com vapor de ozônio, toalha quente aromática e finalização com navalha vintage.',
    order: 2,
    published: true,
    createdAt: '2026-02-05T14:00:00.000Z'
  },
  {
    id: 'ba-3',
    title: 'Alongamento em Gel & Esmaltação Dourada',
    category: 'unhas',
    serviceName: 'Nail Spa & Gel Premium',
    professionalName: 'Fernanda Costa',
    beforeImageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=800&q=80',
    afterImageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80',
    description: 'Alongamento em fibra de vidro com encapsulado em folha de ouro champanhe e cuticulagem russa.',
    order: 3,
    published: true,
    createdAt: '2026-02-10T16:00:00.000Z'
  },
  {
    id: 'ba-4',
    title: 'Revitalização Facial & Peeling de Diamante',
    category: 'estetica',
    serviceName: 'Limpeza de Pele Glow',
    professionalName: 'Dra. Camila Rocha',
    beforeImageUrl: 'https://images.unsplash.com/photo-1512290900672-1f55b93557e1?auto=format&fit=crop&w=800&q=80',
    afterImageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
    description: 'Renovação celular completa, controle de oleosidade e efeito glow instantâneo com fotoproteção ativa.',
    order: 4,
    published: true,
    createdAt: '2026-02-12T11:00:00.000Z'
  },
  {
    id: 'ba-5',
    title: 'Maquiagem Noiva Glamour & Iluminada',
    category: 'maquiagem',
    serviceName: 'Make VIP Especial Noivas',
    professionalName: 'Juliana Mendes',
    beforeImageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80',
    afterImageUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80',
    description: 'Pele blindada à prova d’água, olhos esfumados com brilho sofisticado e lábios acetinados de longa duração.',
    order: 5,
    published: true,
    createdAt: '2026-02-14T09:00:00.000Z'
  }
];

export const INITIAL_GALLERY: ShowcaseGalleryItem[] = [
  {
    id: 'gal-1',
    title: 'Lounge Principal & Recepção Dourada',
    category: 'ambiente',
    imageUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=1200&q=80',
    caption: 'Espaço acolhedor com café espresso, espumante de boas-vindas e iluminação cenográfica suave.',
    order: 1,
    published: true,
    createdAt: '2026-01-05T10:00:00.000Z'
  },
  {
    id: 'gal-2',
    title: 'Espaço VIP & Noivas Privativo',
    category: 'espaco_vip',
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
    caption: 'Suíte exclusiva para atendimento privativo de noivas, formandas e clientes VIP.',
    order: 2,
    published: true,
    createdAt: '2026-01-06T10:00:00.000Z'
  },
  {
    id: 'gal-3',
    title: 'Estação de Barboterapia & Spa dos Fios',
    category: 'procedimentos',
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
    caption: 'Lavatórios reclináveis com massagem corporal e cromoterapia relaxante.',
    order: 3,
    published: true,
    createdAt: '2026-01-07T10:00:00.000Z'
  },
  {
    id: 'gal-4',
    title: 'Nossa Equipe de Mestres da Beleza',
    category: 'equipe',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
    caption: 'Profissionais certificados internacionalmente com atualização contínua em tendências.',
    order: 4,
    published: true,
    createdAt: '2026-01-08T10:00:00.000Z'
  }
];

export const INITIAL_TESTIMONIALS: ShowcaseTestimonial[] = [
  {
    id: 'test-1',
    clientName: 'Mariana Santos',
    clientPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    comment: 'O atendimento no Salão Luxe é incomparável. O clareamento com a Ana ficou exatamente do tom que sonhei, e meus fios continuam sedosos e saudáveis.',
    serviceOrProduct: 'Coloração & Mechas Premium',
    date: '2026-02-15',
    verified: true,
    published: true
  },
  {
    id: 'test-2',
    clientName: 'Carlos Eduardo Souza',
    clientPhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    comment: 'Ambiente sensacional. A barboterapia do Ricardo é a melhor da cidade, além do café de primeira. Vale cada centavo investido.',
    serviceOrProduct: 'Barba Terapia Completa',
    date: '2026-02-18',
    verified: true,
    published: true
  },
  {
    id: 'test-3',
    clientName: 'Camila Fernandes',
    clientPhotoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    comment: 'Fiz minha produção de maquiagem para um evento especial e durou a noite inteira intacta. Pontualidade britânica e recepção nota 10!',
    serviceOrProduct: 'Make VIP Glamour',
    date: '2026-02-22',
    verified: true,
    published: true
  }
];

// Fallback high-res photo mapping for services based on category
export const SERVICE_CATEGORY_IMAGES: Record<string, string> = {
  'cabelo': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
  'barba': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
  'unhas': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80',
  'estética': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
  'estetica': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
  'maquiagem': 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80',
  'química': 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80',
  'finalização': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
  'default': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80'
};

export function getServiceImage(serviceName: string, category: string, explicitUrl?: string): string {
  if (explicitUrl && explicitUrl.length > 5) return explicitUrl;
  const cat = category.toLowerCase().trim();
  if (SERVICE_CATEGORY_IMAGES[cat]) return SERVICE_CATEGORY_IMAGES[cat];
  const name = serviceName.toLowerCase();
  if (name.includes('barba')) return SERVICE_CATEGORY_IMAGES['barba'];
  if (name.includes('unha') || name.includes('manicure') || name.includes('pedicure')) return SERVICE_CATEGORY_IMAGES['unhas'];
  if (name.includes('maquiagem') || name.includes('make')) return SERVICE_CATEGORY_IMAGES['maquiagem'];
  if (name.includes('pele') || name.includes('facial') || name.includes('estética') || name.includes('massagem')) return SERVICE_CATEGORY_IMAGES['estética'];
  return SERVICE_CATEGORY_IMAGES['cabelo'];
}

export async function shareContent(title: string, text: string, url: string = window.location.href): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch {
      // User cancelled or share failed, fallback to clipboard
    }
  }

  // Fallback: clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
