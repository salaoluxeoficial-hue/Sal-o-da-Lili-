import React from 'react';
import { 
  Sparkles, 
  Calendar, 
  Scissors, 
  ShoppingBag, 
  Users, 
  ChevronRight, 
  ArrowRight,
  MapPin, 
  Clock, 
  Phone, 
  ShieldCheck
} from 'lucide-react';
import { useLocalStorage } from '@/src/hooks/useLocalStorage';
import { Service, Product, Professional, ViewType, PixConfig } from '@/src/types';
import { initialServicesList } from '@/src/components/Services';
import { initialProfessionalsList } from '@/src/components/Professionals';
import { getInitialProducts } from '@/src/services/productStorage';
import { formatCurrency } from '@/src/lib/utils';

interface PublicHomeProps {
  onNavigate: (view: ViewType) => void;
}

export const PublicHome: React.FC<PublicHomeProps> = ({ onNavigate }) => {
  const [services] = useLocalStorage<Service[]>('services', initialServicesList);
  const [professionals] = useLocalStorage<Professional[]>('professionals', initialProfessionalsList);
  const [products] = useLocalStorage<Product[]>('products', getInitialProducts());
  const [pixConfig] = useLocalStorage<PixConfig>('pix_config', {
    keyType: 'cnpj',
    key: '12345678000195',
    receiverName: 'Salão Luxe LTDA',
    receiverCity: 'São Paulo',
    gatewayProvider: 'manual',
    autoWebhookEnabled: true,
    webhookSecret: 'whsec_luxe_live',
    webhookEndpoint: 'https://api.salaoluxe.com/webhooks/pix'
  });

  const featuredServices = services.slice(0, 4);
  const featuredProfessionals = professionals.slice(0, 4);
  const featuredProducts = products.filter(p => p.status === 'ativo').slice(0, 4);

  return (
    <div className="space-y-10 sm:space-y-14 animate-in fade-in duration-500 pb-12">
      {/* 1. BANNER PRINCIPAL ELEGANTE COM IMAGEM DE ALTA QUALIDADE */}
      <div className="relative overflow-hidden rounded-3xl border border-[#d4af37]/30 min-h-[380px] sm:min-h-[440px] flex items-center p-6 sm:p-12 shadow-2xl bg-[#070707]">
        {/* Imagem de Fundo Premium */}
        <img
          src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=80"
          alt="Salão Luxe Interior"
          className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.4] contrast-[1.1]"
        />

        {/* Gradientes de Fusão e Escurecimento */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Conteúdo do Banner */}
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-[#d4af37]">
            <Sparkles size={14} className="text-[#d4af37]" />
            <span>Experiência VIP em Beleza & Estética</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
            Salão Luxe{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] via-[#f7e7a9] to-[#b8860b]">
              Unissex
            </span>
          </h1>

          <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed max-w-lg">
            Cortes de precisão, estética avançada e tratamentos capilares de alto padrão em um ambiente pensado para o seu conforto e exclusividade.
          </p>

          {/* APENAS UM BOTÃO PRINCIPAL: AGENDAR HORÁRIO */}
          <div className="pt-2">
            <button
              onClick={() => onNavigate('area_cliente')}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-[#d4af37] to-[#b8860b] hover:from-[#e5c158] hover:to-[#c69512] text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#d4af37]/25 group"
            >
              <Calendar size={17} className="text-black" />
              <span>Agendar Horário</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. SEÇÃO SERVIÇOS EM DESTAQUE */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Scissors size={18} className="text-[#d4af37]" />
              Serviços em Destaque
            </h2>
            <p className="text-neutral-400 text-xs mt-0.5">Os procedimentos mais desejados pelos clientes do Salão Luxe</p>
          </div>
          <button
            onClick={() => onNavigate('vitrine')}
            className="text-xs font-bold text-[#d4af37] hover:text-[#f7e7a9] transition-colors flex items-center gap-1 self-start sm:self-auto group"
          >
            Ver todos os serviços <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {featuredServices.map(service => (
            <div
              key={service.id}
              className="bg-[#0b0b0b] hover:bg-[#111111] border border-white/5 hover:border-[#d4af37]/40 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between space-y-3 group shadow-sm"
            >
              <div>
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                  {service.category} · {service.duration} min
                </span>
                <h3 className="text-sm font-bold text-white group-hover:text-[#f7e7a9] transition-colors mt-1">
                  {service.name}
                </h3>
                <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                  {service.description || 'Procedimento exclusivo realizado com cosméticos de alta performance.'}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[#d4af37] font-extrabold text-sm">{formatCurrency(service.price)}</span>
                <button
                  onClick={() => onNavigate('area_cliente')}
                  className="px-3 py-1.5 bg-[#d4af37]/15 hover:bg-[#d4af37] text-[#d4af37] hover:text-black font-bold text-xs rounded-lg border border-[#d4af37]/30 hover:border-transparent transition-all"
                >
                  Agendar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. SEÇÃO NOSSOS ESPECIALISTAS */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Users size={18} className="text-[#d4af37]" />
              Nossos Especialistas
            </h2>
            <p className="text-neutral-400 text-xs mt-0.5">Profissionais renomados dedicados a valorizar o seu estilo</p>
          </div>
          <button
            onClick={() => onNavigate('area_cliente')}
            className="text-xs font-bold text-[#d4af37] hover:text-[#f7e7a9] transition-colors flex items-center gap-1 self-start sm:self-auto group"
          >
            Escolher profissional <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {featuredProfessionals.map(prof => {
            const hasPhoto = prof.photoUrl && (prof.photoUrl.startsWith('http') || prof.photoUrl.startsWith('data:'));
            const initials = prof.name
              .split(' ')
              .map(n => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={prof.id}
                className="bg-[#0b0b0b] hover:bg-[#111111] border border-white/5 hover:border-[#d4af37]/40 rounded-2xl p-4 transition-all duration-200 flex items-center gap-3.5 group shadow-sm"
              >
                <div className="w-12 h-12 rounded-full border border-[#d4af37]/40 bg-gradient-to-br from-[#1c1912] to-[#0c0c0c] flex items-center justify-center text-[#d4af37] font-bold text-xs shrink-0 shadow-md overflow-hidden">
                  {hasPhoto ? (
                    <img src={prof.photoUrl} alt={prof.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{prof.photoUrl && prof.photoUrl.length <= 3 ? prof.photoUrl : initials}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#f7e7a9] transition-colors truncate">
                    {prof.name}
                  </h3>
                  <p className="text-[11px] text-neutral-400 truncate">{prof.role}</p>
                  <p className="text-[10px] text-[#d4af37]/80 truncate mt-0.5">
                    {prof.specialties.slice(0, 2).join(' · ')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. SEÇÃO PRODUTOS EM DESTAQUE (VITRINE) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <ShoppingBag size={18} className="text-[#d4af37]" />
              Boutique & Vitrine Luxe
            </h2>
            <p className="text-neutral-400 text-xs mt-0.5">Cosméticos e finalizadores profissionais para uso home care</p>
          </div>
          <button
            onClick={() => onNavigate('vitrine')}
            className="text-xs font-bold text-[#d4af37] hover:text-[#f7e7a9] transition-colors flex items-center gap-1 self-start sm:self-auto group"
          >
            Explorar vitrine completa <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {featuredProducts.map(product => (
            <div
              key={product.id}
              className="bg-[#0b0b0b] hover:bg-[#111111] border border-white/5 hover:border-[#d4af37]/40 rounded-2xl p-3.5 transition-all duration-200 flex flex-col justify-between space-y-3 group shadow-sm"
            >
              <div className="space-y-2">
                <div className="h-36 sm:h-40 rounded-xl overflow-hidden bg-neutral-900 border border-white/5 relative">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                  {product.category}
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-[#f7e7a9] transition-colors">
                  {product.name}
                </h3>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[#d4af37] font-extrabold text-sm">{formatCurrency(product.price)}</span>
                <button
                  onClick={() => onNavigate('vitrine')}
                  className="px-3 py-1.5 bg-white/5 hover:bg-[#d4af37] text-neutral-300 hover:text-black font-bold text-xs rounded-lg border border-white/10 hover:border-transparent transition-all"
                >
                  Ver Produto
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. INFORMAÇÕES ESSENCIAIS DO SALÃO (RODAPÉ UNIFICADO E MINIMALISTA) */}
      <div className="bg-[#080808] border border-[#d4af37]/20 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 divide-y md:divide-y-0 md:divide-x divide-white/5 text-xs">
          {/* Localização */}
          <div className="flex items-start gap-3 pt-3 md:pt-0">
            <div className="w-8 h-8 rounded-lg bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center shrink-0 border border-[#d4af37]/20">
              <MapPin size={16} />
            </div>
            <div>
              <span className="text-white font-bold block">Localização</span>
              <p className="text-neutral-400 text-[11px] mt-0.5 leading-relaxed">
                Av. Paulista, 1000 - Bela Vista<br />São Paulo - SP
              </p>
            </div>
          </div>

          {/* Horários e Recepção */}
          <div className="flex items-start gap-3 pt-3 md:pt-0 md:pl-6">
            <div className="w-8 h-8 rounded-lg bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center shrink-0 border border-[#d4af37]/20">
              <Clock size={16} />
            </div>
            <div>
              <span className="text-white font-bold block">Atendimento</span>
              <p className="text-neutral-400 text-[11px] mt-0.5 leading-relaxed">
                Terça a Sábado: 09h às 20h<br />WhatsApp: (11) 99999-8888
              </p>
            </div>
          </div>

          {/* Chave Pix e Confirmação */}
          <div className="flex items-start gap-3 pt-3 md:pt-0 md:pl-6">
            <div className="w-8 h-8 rounded-lg bg-[#d4af37]/10 text-[#d4af37] flex items-center justify-center shrink-0 border border-[#d4af37]/20">
              <ShieldCheck size={16} />
            </div>
            <div>
              <span className="text-white font-bold block">Pagamento Pix Oficial</span>
              <p className="text-neutral-400 text-[11px] mt-0.5 leading-relaxed font-mono">
                CNPJ: {pixConfig.key}
              </p>
              <span className="text-[10px] text-neutral-500 block">{pixConfig.receiverName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
