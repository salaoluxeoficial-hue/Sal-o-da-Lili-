import React, { useState } from 'react';
import { 
  Sparkles, 
  Eye, 
  Settings2, 
  Calendar, 
  ShoppingBag, 
  Heart, 
  Share2, 
  Check, 
  Scissors,
  ArrowRight,
  Sliders,
  CheckCircle2,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { useLocalStorage } from '@/src/hooks/useLocalStorage';
import { 
  ShowcaseBanner, 
  ShowcaseGalleryItem, 
  ShowcaseBeforeAfter, 
  ShowcaseTestimonial,
  Service,
  Product,
  Client,
  Professional,
  Appointment,
  ProfessionalAbsence,
  Order,
  StockMovement,
  ClientPurchase
} from '@/src/types';
import { 
  INITIAL_BANNERS, 
  INITIAL_GALLERY, 
  INITIAL_BEFORE_AFTER, 
  INITIAL_TESTIMONIALS 
} from '@/src/services/vitrineStorage';
import { initialServicesList } from '@/src/components/Services';
import { 
  getInitialProducts, 
  getInitialOrders, 
  getInitialStockMovements, 
  processOrderSale 
} from '@/src/services/productStorage';
import { getInitialClients, getInitialPurchases } from '@/src/services/clientStorage';
import { initialProfessionalsList } from '@/src/components/Professionals';
import { getInitialAppointments, getInitialAbsences } from '@/src/services/agendaStorage';
import { BannerCarousel } from './vitrine/BannerCarousel';
import { ServicesShowcase } from './vitrine/ServicesShowcase';
import { ProductsShowcase } from './vitrine/ProductsShowcase';
import { BeforeAfterSection } from './vitrine/BeforeAfterSection';
import { SalonGallery } from './vitrine/SalonGallery';
import { TestimonialsSection } from './vitrine/TestimonialsSection';
import { AdminShowcaseManager } from './vitrine/AdminShowcaseManager';
import { QuickBuyModal } from './vitrine/QuickBuyModal';
import { AppointmentModal } from './agenda/AppointmentModal';
import { cn } from '@/src/lib/utils';

interface VitrineProps {
  onNavigateToAgenda?: () => void;
  onNavigateToProducts?: () => void;
  onBack?: () => void;
  isAdmin?: boolean;
}

export const Vitrine: React.FC<VitrineProps> = ({ 
  onNavigateToAgenda,
  onNavigateToProducts,
  onBack,
  isAdmin = false
}) => {
  // Persistent showcase collections
  const [banners, setBanners] = useLocalStorage<ShowcaseBanner[]>('showcase_banners', INITIAL_BANNERS);
  const [gallery, setGallery] = useLocalStorage<ShowcaseGalleryItem[]>('showcase_gallery', INITIAL_GALLERY);
  const [beforeAfter, setBeforeAfter] = useLocalStorage<ShowcaseBeforeAfter[]>('showcase_before_after', INITIAL_BEFORE_AFTER);
  const [testimonials, setTestimonials] = useLocalStorage<ShowcaseTestimonial[]>('showcase_testimonials', INITIAL_TESTIMONIALS);
  const [favoriteIds, setFavoriteIds] = useLocalStorage<string[]>('showcase_favorites', []);

  // System persistent entities
  const [services] = useLocalStorage<Service[]>('services', initialServicesList);
  const [products, setProducts] = useLocalStorage<Product[]>('products', getInitialProducts());
  const [clients, setClients] = useLocalStorage<Client[]>('clients', getInitialClients());
  const [professionals] = useLocalStorage<Professional[]>('professionals', initialProfessionalsList);
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>('appointments', getInitialAppointments());
  const [absences] = useLocalStorage<ProfessionalAbsence[]>('absences', getInitialAbsences());
  const [orders, setOrders] = useLocalStorage<Order[]>('orders', getInitialOrders());
  const [stockMovements, setStockMovements] = useLocalStorage<StockMovement[]>('stock_movements', getInitialStockMovements());
  const [clientPurchases, setClientPurchases] = useLocalStorage<ClientPurchase[]>('client_purchases', getInitialPurchases());

  // View switch: Customer live preview vs Admin Manager
  const [viewMode, setViewMode] = useState<'preview' | 'admin'>('preview');

  // Modals
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [selectedServiceToBook, setSelectedServiceToBook] = useState<Service | null>(null);

  const [isQuickBuyOpen, setIsQuickBuyOpen] = useState(false);
  const [selectedProductToBuy, setSelectedProductToBuy] = useState<Product | null>(null);

  // Toast alert
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleToggleFavorite = (id: string, type: 'servico' | 'produto') => {
    setFavoriteIds(prev => {
      const exists = prev.includes(id);
      if (exists) {
        showToast('Removido da sua lista de favoritos.');
        return prev.filter(item => item !== id);
      } else {
        showToast('Salvo nos seus favoritos do Salão Luxe! ❤️');
        return [...prev, id];
      }
    });
  };

  const handleBookService = (service: Service) => {
    setSelectedServiceToBook(service);
    setIsAppointmentModalOpen(true);
  };

  const handleBookServiceByName = (serviceName: string) => {
    const matched = services.find(s => s.name.toLowerCase() === serviceName.toLowerCase()) || services[0];
    if (matched) {
      setSelectedServiceToBook(matched);
      setIsAppointmentModalOpen(true);
    } else if (onNavigateToAgenda) {
      onNavigateToAgenda();
    }
  };

  const handleBannerAction = (banner: ShowcaseBanner) => {
    if (banner.ctaAction === 'agendar') {
      setIsAppointmentModalOpen(true);
    } else if (banner.ctaAction === 'produtos') {
      const el = document.getElementById('vitrine-produtos');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else if (onNavigateToProducts) {
        onNavigateToProducts();
      }
    } else if (banner.ctaAction === 'servicos') {
      const el = document.getElementById('vitrine-servicos');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleBuyProduct = (product: Product) => {
    setSelectedProductToBuy(product);
    setIsQuickBuyOpen(true);
  };

  const handleConfirmOrder = (newOrder: Order) => {
    const result = processOrderSale({
      order: newOrder,
      products,
      stockMovements,
      clientPurchases,
      clients,
      performedBy: 'Checkout Vitrine Digital'
    });

    setOrders(prev => [result.order, ...prev]);
    setProducts(result.products);
    setStockMovements(result.stockMovements);
    setClientPurchases(result.clientPurchases);
    setClients(result.clients);
    showToast(`Pedido #${newOrder.id.slice(-6)} confirmado com sucesso!`);
  };

  const handleSaveAppointment = (newApp: Appointment) => {
    setAppointments(prev => [newApp, ...prev]);
    setIsAppointmentModalOpen(false);
    showToast(`Agendamento confirmado para ${newApp.date} às ${newApp.startTime}!`);
  };

  const handleAddClient = (newClient: Client) => {
    setClients(prev => [...prev, newClient]);
  };

  const currentViewMode = isAdmin ? viewMode : 'preview';

  return (
    <div className="space-y-10 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161616] border border-[#d4af37] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="w-7 h-7 rounded-full bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center">
            <CheckCircle2 size={16} />
          </div>
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header & View Mode Switcher (Admin Only) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-[#d4af37] border border-white/10 rounded-2xl transition-all flex items-center gap-1.5 text-xs font-bold shrink-0"
              title="Voltar à tela anterior"
            >
              <ArrowLeft size={18} className="text-[#d4af37]" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Vitrine Digital
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30">
                Salão Luxe
              </span>
            </div>
            <p className="text-neutral-400 text-xs sm:text-sm mt-1">
              Apresentação visual de serviços, produtos, galeria de resultados e depoimentos reais.
            </p>
          </div>
        </div>

        {/* View Mode Toggle (Displayed ONLY for Admin) */}
        {isAdmin && (
          <div className="flex items-center bg-[#111111] p-1.5 rounded-2xl border border-[#d4af37]/30 shadow-lg">
            <button
              onClick={() => setViewMode('preview')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2",
                viewMode === 'preview'
                  ? "bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              <Eye size={16} />
              <span>Ver Vitrine do Cliente</span>
            </button>

            <button
              onClick={() => setViewMode('admin')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2",
                viewMode === 'admin'
                  ? "bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              <Settings2 size={16} />
              <span>Gerenciador da Vitrine</span>
            </button>
          </div>
        )}
      </div>

      {/* VIEW MODE 1: CLIENT LIVE VITRINE */}
      {currentViewMode === 'preview' ? (
        <div className="space-y-16">
          {/* 1. Promotional Carousel */}
          <section>
            <BannerCarousel
              banners={banners}
              onActionClick={handleBannerAction}
            />
          </section>

          {/* 2. Services Showcase */}
          <section id="vitrine-servicos">
            <ServicesShowcase
              services={services}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
              onBookService={handleBookService}
              onToast={showToast}
            />
          </section>

          {/* 3. Interactive Before & After */}
          <section>
            <BeforeAfterSection
              items={beforeAfter}
              onBookServiceByName={handleBookServiceByName}
            />
          </section>

          {/* 4. Products Boutique Showcase */}
          <section id="vitrine-produtos">
            <ProductsShowcase
              products={products}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
              onBuyProduct={handleBuyProduct}
              onToast={showToast}
            />
          </section>

          {/* 5. Salon Structure & Gallery */}
          <section>
            <SalonGallery items={gallery} />
          </section>

          {/* 6. Testimonials Section */}
          <section>
            <TestimonialsSection testimonials={testimonials} />
          </section>

          {/* Luxury Salon Footer Banner */}
          <div className="bg-gradient-to-r from-[#141208] via-[#0c0c0c] to-[#141208] border border-[#d4af37]/30 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-2xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#d4af37]/20 text-[#d4af37] mb-2 border border-[#d4af37]/40">
              <Sparkles size={24} />
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Pronto para viver uma experiência inesquecível?
            </h3>
            <p className="text-neutral-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
              Agende seu atendimento com nossos especialistas ou fale diretamente com a nossa recepção pelo WhatsApp oficial.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => setIsAppointmentModalOpen(true)}
                className="px-6 py-3 bg-[#d4af37] hover:bg-[#e5c158] text-black font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-[#d4af37]/20 flex items-center gap-2"
              >
                <Calendar size={18} />
                <span>Agendar Horário Agora</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: ADMIN SHOWCASE MANAGER */
        <AdminShowcaseManager
          banners={banners}
          setBanners={setBanners}
          gallery={gallery}
          setGallery={setGallery}
          beforeAfter={beforeAfter}
          setBeforeAfter={setBeforeAfter}
          testimonials={testimonials}
          setTestimonials={setTestimonials}
          onToast={showToast}
        />
      )}

      {/* Appointment Booking Modal */}
      {isAppointmentModalOpen && (
        <AppointmentModal
          isOpen={isAppointmentModalOpen}
          onClose={() => {
            setIsAppointmentModalOpen(false);
            setSelectedServiceToBook(null);
          }}
          onSave={handleSaveAppointment}
          clients={clients}
          onAddClient={handleAddClient}
          professionals={professionals}
          services={services}
          appointments={appointments}
          absences={absences}
        />
      )}

      {/* Quick Buy Product Modal */}
      {isQuickBuyOpen && (
        <QuickBuyModal
          product={selectedProductToBuy}
          onClose={() => {
            setIsQuickBuyOpen(false);
            setSelectedProductToBuy(null);
          }}
          clients={clients}
          onConfirmOrder={handleConfirmOrder}
        />
      )}
    </div>
  );
};
