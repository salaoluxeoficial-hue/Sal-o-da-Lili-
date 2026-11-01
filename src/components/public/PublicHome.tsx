import React from 'react';
import { Calendar, ArrowRight, Clock, MapPin, ShieldCheck, Sparkles, Scissors, ShoppingBag } from 'lucide-react';
import { useLocalStorage } from '@/src/hooks/useLocalStorage';
import { Service, Product, Professional, ViewType, PixConfig } from '@/src/types';
import { initialServicesList } from '@/src/components/Services';
import { initialProfessionalsList } from '@/src/components/Professionals';
import { getInitialProducts } from '@/src/services/productStorage';
import { formatCurrency } from '@/src/lib/utils';
import heroBgImage from '@/src/assets/images/hero_luxury_salon_bg_1793496320557.jpg';

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

  const featuredServices = services.slice(0, 3);
  const featuredProfessionals = professionals.slice(0, 3);
  const featuredProducts = products.filter(p => p.status === 'ativo').slice(0, 3);

  return (
    <div className="space-y-16 sm:space-y-24 animate-in fade-in duration-700 pb-16 max-w-6xl mx-auto">
      {/* 1. HERO MINIMALISTA & ELEGANTE */}
      <section className="relative overflow-hidden rounded-3xl border border-[#c5a059]/20 bg-[#080808] min-h-[460px] sm:min-h-[520px] flex items-center p-8 sm:p-16 shadow-2xl">
        {/* Imagem de Fundo de Alta Resolução */}
        <img
          src={heroBgImage}
          alt="Salão Luxe Interior"
          className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.35] contrast-[1.05] transition-transform duration-1000 scale-105"
        />

        {/* Scrims de Escurecimento e Proteção de Legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/40" />

        {/* Conteúdo Principal */}
        <div className="relative z-10 max-w-xl space-y-6">
          <div className="space-y-2">
            <span className="text-[11px] font-medium tracking-[0.25em] uppercase text-[#c5a059] block">
              Sua experiência exclusiva
            </span>
            <h1 className="text-3xl sm:text-5xl font-light text-white tracking-tight leading-[1.15]">
              Bem-vindo ao <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#e5c158] via-[#d4af37] to-[#c5a059]">Salão Luxe</span>
            </h1>
          </div>

          <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed font-light max-w-md">
            Cortes de alta precisão, visagismo e tratamentos capilares em um ambiente privado e sofisticado.
          </p>

          {/* Duas Ações Principais Minimalistas */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
            <button
              onClick={() => onNavigate('area_cliente')}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-[#d4af37] hover:bg-[#e5c158] text-black font-semibold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#d4af37]/15 group"
            >
              <Calendar size={15} />
              <span>Agendar Atendimento</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate('vitrine')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/5 hover:bg-white/10 text-neutral-200 hover:text-white font-medium text-xs uppercase tracking-wider rounded-xl border border-white/10 hover:border-[#c5a059]/40 transition-all"
            >
              <span>Conhecer Serviços</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. SERVIÇOS EXCLUSIVOS (DESIGN LIMPO COM MUITO ESPAÇO) */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-white/5 pb-4">
          <div>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#c5a059] block mb-1">
              Atendimentos de Assinatura
            </span>
            <h2 className="text-xl sm:text-2xl font-light text-white tracking-tight">
              Serviços Selecionados
            </h2>
          </div>
          <button
            onClick={() => onNavigate('vitrine')}
            className="text-xs font-medium text-[#c5a059] hover:text-[#e5c158] transition-colors flex items-center gap-1 group"
          >
            <span>Ver catálogo</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {featuredServices.map(service => (
            <div
              key={service.id}
              onClick={() => onNavigate('area_cliente')}
              className="bg-[#0b0b0b] hover:bg-[#111111] border border-white/5 hover:border-[#c5a059]/30 rounded-2xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between group space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-neutral-400 font-light">
                  <span>{service.category}</span>
                  <span>{service.duration} min</span>
                </div>
                <h3 className="text-base font-medium text-white group-hover:text-[#e5c158] transition-colors">
                  {service.name}
                </h3>
                <p className="text-xs text-neutral-400 font-light leading-relaxed line-clamp-2">
                  {service.description || 'Tratamento capilar com ativos selecionados e atendimento individual.'}
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-white font-medium text-sm">{formatCurrency(service.price)}</span>
                <span className="text-xs text-[#c5a059] font-medium group-hover:underline">Agendar →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. NOSSA EQUIPE DE ESPECIALISTAS */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-white/5 pb-4">
          <div>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#c5a059] block mb-1">
              Corpo Técnico
            </span>
            <h2 className="text-xl sm:text-2xl font-light text-white tracking-tight">
              Especialistas Luxe
            </h2>
          </div>
          <button
            onClick={() => onNavigate('area_cliente')}
            className="text-xs font-medium text-[#c5a059] hover:text-[#e5c158] transition-colors flex items-center gap-1 group"
          >
            <span>Reservar com especialista</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                onClick={() => onNavigate('area_cliente')}
                className="bg-[#0b0b0b] hover:bg-[#111111] border border-white/5 hover:border-[#c5a059]/30 rounded-2xl p-5 transition-all duration-300 cursor-pointer flex items-center gap-4 group"
              >
                <div className="w-13 h-13 rounded-full border border-[#c5a059]/30 bg-neutral-900 flex items-center justify-center text-[#c5a059] font-medium text-xs shrink-0 overflow-hidden">
                  {hasPhoto ? (
                    <img src={prof.photoUrl} alt={prof.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-white group-hover:text-[#e5c158] transition-colors truncate">
                    {prof.name}
                  </h3>
                  <p className="text-xs text-neutral-400 font-light truncate mt-0.5">{prof.role}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. INFORMAÇÕES DE ATENDIMENTO MINIMALISTAS */}
      <div className="bg-[#080808] border border-white/5 rounded-2xl p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-light divide-y md:divide-y-0 md:divide-x divide-white/5">
          <div className="space-y-1.5 pt-4 md:pt-0">
            <span className="text-[#c5a059] font-medium uppercase tracking-wider block text-[10px]">Endereço VIP</span>
            <p className="text-neutral-200">Av. Paulista, 1000 - Bela Vista</p>
            <p className="text-neutral-500">São Paulo, SP</p>
          </div>

          <div className="space-y-1.5 pt-4 md:pt-0 md:pl-6">
            <span className="text-[#c5a059] font-medium uppercase tracking-wider block text-[10px]">Funcionamento</span>
            <p className="text-neutral-200">Terça a Sábado — 09h às 20h</p>
            <p className="text-neutral-500">Atendimento presencial e agendamento prévio</p>
          </div>

          <div className="space-y-1.5 pt-4 md:pt-0 md:pl-6">
            <span className="text-[#c5a059] font-medium uppercase tracking-wider block text-[10px]">Contato Direct</span>
            <p className="text-neutral-200">(11) 99999-8888</p>
            <p className="text-neutral-500">Pix CNPJ: {pixConfig.key}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
