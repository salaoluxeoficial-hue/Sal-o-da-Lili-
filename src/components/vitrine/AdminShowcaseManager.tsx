import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Image as ImageIcon, 
  Play, 
  Check, 
  X, 
  Upload, 
  Sliders, 
  Sparkles,
  ArrowLeftRight,
  MessageSquareQuote
} from 'lucide-react';
import { 
  ShowcaseBanner, 
  ShowcaseGalleryItem, 
  ShowcaseBeforeAfter, 
  ShowcaseTestimonial,
  ShowcaseCategory 
} from '@/src/types';
import { cn } from '@/src/lib/utils';

interface AdminShowcaseManagerProps {
  banners: ShowcaseBanner[];
  setBanners: React.Dispatch<React.SetStateAction<ShowcaseBanner[]>>;
  gallery: ShowcaseGalleryItem[];
  setGallery: React.Dispatch<React.SetStateAction<ShowcaseGalleryItem[]>>;
  beforeAfter: ShowcaseBeforeAfter[];
  setBeforeAfter: React.Dispatch<React.SetStateAction<ShowcaseBeforeAfter[]>>;
  testimonials: ShowcaseTestimonial[];
  setTestimonials: React.Dispatch<React.SetStateAction<ShowcaseTestimonial[]>>;
  onToast: (msg: string) => void;
}

export const AdminShowcaseManager: React.FC<AdminShowcaseManagerProps> = ({
  banners,
  setBanners,
  gallery,
  setGallery,
  beforeAfter,
  setBeforeAfter,
  testimonials,
  setTestimonials,
  onToast
}) => {
  const [activeTab, setActiveTab] = useState<'banners' | 'gallery' | 'beforeAfter' | 'testimonials'>('banners');

  // Modal states
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<ShowcaseBanner | null>(null);

  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<ShowcaseGalleryItem | null>(null);

  const [isBAModalOpen, setIsBAModalOpen] = useState(false);
  const [editingBA, setEditingBA] = useState<ShowcaseBeforeAfter | null>(null);

  // Form states - Banner
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerDesc, setBannerDesc] = useState('');
  const [bannerBadge, setBannerBadge] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerVideo, setBannerVideo] = useState('');
  const [bannerCtaText, setBannerCtaText] = useState('Agendar Horário');
  const [bannerCtaAction, setBannerCtaAction] = useState<'agendar' | 'produtos' | 'servicos' | 'link'>('agendar');

  // Form states - Gallery
  const [galTitle, setGalTitle] = useState('');
  const [galCategory, setGalCategory] = useState<'ambiente' | 'equipe' | 'procedimentos' | 'espaco_vip'>('ambiente');
  const [galImage, setGalImage] = useState('');
  const [galVideo, setGalVideo] = useState('');
  const [galCaption, setGalCaption] = useState('');

  // Form states - Before & After
  const [baTitle, setBaTitle] = useState('');
  const [baCategory, setBaCategory] = useState<ShowcaseCategory>('cabelo');
  const [baServiceName, setBaServiceName] = useState('');
  const [baProfessionalName, setBaProfessionalName] = useState('');
  const [baBeforeImage, setBaBeforeImage] = useState('');
  const [baAfterImage, setBaAfterImage] = useState('');
  const [baDesc, setBaDesc] = useState('');

  // File Upload helper
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setter(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // BANNER HANDLERS
  const openNewBanner = () => {
    setEditingBanner(null);
    setBannerTitle('');
    setBannerSubtitle('');
    setBannerDesc('');
    setBannerBadge('Destaque');
    setBannerImage('https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=80');
    setBannerVideo('');
    setBannerCtaText('Agendar Horário');
    setBannerCtaAction('agendar');
    setIsBannerModalOpen(true);
  };

  const openEditBanner = (b: ShowcaseBanner) => {
    setEditingBanner(b);
    setBannerTitle(b.title);
    setBannerSubtitle(b.subtitle || '');
    setBannerDesc(b.description);
    setBannerBadge(b.badge || '');
    setBannerImage(b.imageUrl);
    setBannerVideo(b.videoUrl || '');
    setBannerCtaText(b.ctaText);
    setBannerCtaAction(b.ctaAction);
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle.trim() || !bannerImage.trim()) return;

    if (editingBanner) {
      setBanners(prev => prev.map(b => b.id === editingBanner.id ? {
        ...b,
        title: bannerTitle,
        subtitle: bannerSubtitle,
        description: bannerDesc,
        badge: bannerBadge,
        imageUrl: bannerImage,
        videoUrl: bannerVideo,
        ctaText: bannerCtaText,
        ctaAction: bannerCtaAction
      } : b));
      onToast('Banner atualizado com sucesso!');
    } else {
      const newBanner: ShowcaseBanner = {
        id: `banner-${Date.now()}`,
        title: bannerTitle,
        subtitle: bannerSubtitle,
        description: bannerDesc,
        badge: bannerBadge,
        imageUrl: bannerImage,
        videoUrl: bannerVideo,
        ctaText: bannerCtaText,
        ctaAction: bannerCtaAction,
        order: banners.length + 1,
        published: true,
        createdAt: new Date().toISOString()
      };
      setBanners(prev => [...prev, newBanner]);
      onToast('Novo banner cadastrado e publicado!');
    }
    setIsBannerModalOpen(false);
  };

  const toggleBannerPublish = (id: string) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, published: !b.published } : b));
  };

  const deleteBanner = (id: string) => {
    if (confirm('Excluir este banner da vitrine?')) {
      setBanners(prev => prev.filter(b => b.id !== id));
      onToast('Banner removido!');
    }
  };

  const moveBanner = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;
    const copy = [...banners];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    // Reassign order
    const updated = copy.map((b, idx) => ({ ...b, order: idx + 1 }));
    setBanners(updated);
  };

  // GALLERY HANDLERS
  const openNewGallery = () => {
    setEditingGallery(null);
    setGalTitle('');
    setGalCategory('ambiente');
    setGalImage('https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=1200&q=80');
    setGalVideo('');
    setGalCaption('');
    setIsGalleryModalOpen(true);
  };

  const handleSaveGallery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!galTitle.trim() || !galImage.trim()) return;

    if (editingGallery) {
      setGallery(prev => prev.map(g => g.id === editingGallery.id ? {
        ...g,
        title: galTitle,
        category: galCategory,
        imageUrl: galImage,
        videoUrl: galVideo,
        caption: galCaption
      } : g));
      onToast('Item da galeria atualizado!');
    } else {
      const newItem: ShowcaseGalleryItem = {
        id: `gal-${Date.now()}`,
        title: galTitle,
        category: galCategory,
        imageUrl: galImage,
        videoUrl: galVideo,
        caption: galCaption,
        order: gallery.length + 1,
        published: true,
        createdAt: new Date().toISOString()
      };
      setGallery(prev => [...prev, newItem]);
      onToast('Foto/Vídeo adicionado à galeria!');
    }
    setIsGalleryModalOpen(false);
  };

  // BEFORE & AFTER HANDLERS
  const openNewBA = () => {
    setEditingBA(null);
    setBaTitle('');
    setBaCategory('cabelo');
    setBaServiceName('Coloração & Mechas');
    setBaProfessionalName('');
    setBaBeforeImage('https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80');
    setBaAfterImage('https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80');
    setBaDesc('');
    setIsBAModalOpen(true);
  };

  const handleSaveBA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!baTitle.trim() || !baBeforeImage.trim() || !baAfterImage.trim()) return;

    if (editingBA) {
      setBeforeAfter(prev => prev.map(ba => ba.id === editingBA.id ? {
        ...ba,
        title: baTitle,
        category: baCategory,
        serviceName: baServiceName,
        professionalName: baProfessionalName,
        beforeImageUrl: baBeforeImage,
        afterImageUrl: baAfterImage,
        description: baDesc
      } : ba));
      onToast('Transformação atualizada!');
    } else {
      const newBA: ShowcaseBeforeAfter = {
        id: `ba-${Date.now()}`,
        title: baTitle,
        category: baCategory,
        serviceName: baServiceName,
        professionalName: baProfessionalName,
        beforeImageUrl: baBeforeImage,
        afterImageUrl: baAfterImage,
        description: baDesc,
        order: beforeAfter.length + 1,
        published: true,
        createdAt: new Date().toISOString()
      };
      setBeforeAfter(prev => [...prev, newBA]);
      onToast('Antes & Depois publicado na vitrine!');
    }
    setIsBAModalOpen(false);
  };

  return (
    <div className="space-y-6 bg-[#0a0a0a] border border-[#d4af37]/20 rounded-3xl p-6 sm:p-8">
      {/* Subnav Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('banners')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2",
              activeTab === 'banners'
                ? "bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20"
                : "bg-white/5 text-neutral-400 hover:text-white"
            )}
          >
            <Sliders size={16} />
            <span>Banners do Carrossel ({banners.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('gallery')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2",
              activeTab === 'gallery'
                ? "bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20"
                : "bg-white/5 text-neutral-400 hover:text-white"
            )}
          >
            <ImageIcon size={16} />
            <span>Galeria de Fotos & Vídeos ({gallery.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('beforeAfter')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2",
              activeTab === 'beforeAfter'
                ? "bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20"
                : "bg-white/5 text-neutral-400 hover:text-white"
            )}
          >
            <ArrowLeftRight size={16} />
            <span>Antes & Depois ({beforeAfter.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('testimonials')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2",
              activeTab === 'testimonials'
                ? "bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20"
                : "bg-white/5 text-neutral-400 hover:text-white"
            )}
          >
            <MessageSquareQuote size={16} />
            <span>Depoimentos ({testimonials.length})</span>
          </button>
        </div>

        {/* Create trigger depending on active tab */}
        {activeTab === 'banners' && (
          <button
            onClick={openNewBanner}
            className="px-4 py-2 bg-[#d4af37] hover:bg-[#e5c158] text-black text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Plus size={16} />
            <span>Novo Banner</span>
          </button>
        )}
        {activeTab === 'gallery' && (
          <button
            onClick={openNewGallery}
            className="px-4 py-2 bg-[#d4af37] hover:bg-[#e5c158] text-black text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Plus size={16} />
            <span>Adicionar Foto/Vídeo</span>
          </button>
        )}
        {activeTab === 'beforeAfter' && (
          <button
            onClick={openNewBA}
            className="px-4 py-2 bg-[#d4af37] hover:bg-[#e5c158] text-black text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Plus size={16} />
            <span>Nova Transformação</span>
          </button>
        )}
      </div>

      {/* TAB 1: BANNERS */}
      {activeTab === 'banners' && (
        <div className="space-y-4">
          <p className="text-xs text-neutral-400">
            Ordene os banners em destaque, altere títulos, fotos, botões de ação e visibilidade no carrossel.
          </p>
          <div className="space-y-3">
            {banners.map((b, idx) => (
              <div
                key={b.id}
                className="bg-[#121212] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:border-[#d4af37]/40 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={b.imageUrl}
                    alt={b.title}
                    className="w-20 h-14 rounded-xl object-cover border border-white/10 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm truncate">{b.title}</span>
                      {b.badge && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#d4af37]/20 text-[#d4af37]">
                          {b.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-neutral-400 text-xs truncate max-w-md">{b.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-500">
                      <span>Ordem #{b.order}</span>
                      <span>•</span>
                      <span>Ação: {b.ctaText} ({b.ctaAction})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  {/* Move up / down */}
                  <button
                    onClick={() => moveBanner(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 rounded hover:bg-white/5"
                    title="Mover para cima"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => moveBanner(idx, 'down')}
                    disabled={idx === banners.length - 1}
                    className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 rounded hover:bg-white/5"
                    title="Mover para baixo"
                  >
                    <ArrowDown size={16} />
                  </button>

                  {/* Toggle publish */}
                  <button
                    onClick={() => toggleBannerPublish(b.id)}
                    className={cn(
                      "p-1.5 rounded transition-colors",
                      b.published ? "text-emerald-400 hover:bg-emerald-500/10" : "text-neutral-500 hover:bg-white/5"
                    )}
                    title={b.published ? "Ocultar banner" : "Publicar banner"}
                  >
                    {b.published ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => openEditBanner(b)}
                    className="p-1.5 text-neutral-400 hover:text-[#d4af37] rounded hover:bg-white/5"
                    title="Editar banner"
                  >
                    <Edit2 size={16} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => deleteBanner(b.id)}
                    className="p-1.5 text-neutral-400 hover:text-rose-400 rounded hover:bg-white/5"
                    title="Excluir banner"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: GALLERY */}
      {activeTab === 'gallery' && (
        <div className="space-y-4">
          <p className="text-xs text-neutral-400">
            Gerencie as fotos e vídeos que mostram as instalações, equipe e serviços do salão.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {gallery.map(item => (
              <div
                key={item.id}
                className="bg-[#121212] border border-white/10 rounded-2xl overflow-hidden group hover:border-[#d4af37]/40 flex flex-col justify-between"
              >
                <div className="relative h-40 bg-black">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  {item.videoUrl && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-[#d4af37] text-black text-[10px] font-bold flex items-center gap-1">
                      <Play size={10} className="fill-black" /> Vídeo
                    </span>
                  )}
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 text-[#d4af37] text-[10px] font-bold uppercase">
                    {item.category.replace('_', ' ')}
                  </span>
                </div>
                <div className="p-3.5 space-y-2">
                  <h4 className="text-white text-xs font-bold line-clamp-1">{item.title}</h4>
                  {item.caption && <p className="text-neutral-400 text-[11px] line-clamp-2">{item.caption}</p>}
                  
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <button
                      onClick={() => setGallery(prev => prev.map(g => g.id === item.id ? { ...g, published: !g.published } : g))}
                      className={cn(
                        "text-[10px] font-bold flex items-center gap-1",
                        item.published ? "text-emerald-400" : "text-neutral-500"
                      )}
                    >
                      {item.published ? <Eye size={12} /> : <EyeOff size={12} />}
                      <span>{item.published ? 'Publicado' : 'Oculto'}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Excluir este item da galeria?')) {
                          setGallery(prev => prev.filter(g => g.id !== item.id));
                          onToast('Foto/Vídeo removido!');
                        }
                      }}
                      className="text-neutral-400 hover:text-rose-400 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: BEFORE & AFTER */}
      {activeTab === 'beforeAfter' && (
        <div className="space-y-4">
          <p className="text-xs text-neutral-400">
            Cadastre fotos de Antes e Depois para demonstrar a excelência técnica dos tratamentos.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {beforeAfter.map(item => (
              <div
                key={item.id}
                className="bg-[#121212] border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-4 group hover:border-[#d4af37]/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-4">
                    <img
                      src={item.beforeImageUrl}
                      alt="Antes"
                      className="w-16 h-16 rounded-xl object-cover border-2 border-neutral-700"
                      title="Antes"
                    />
                    <img
                      src={item.afterImageUrl}
                      alt="Depois"
                      className="w-16 h-16 rounded-xl object-cover border-2 border-[#d4af37]"
                      title="Depois"
                    />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">{item.title}</h4>
                    <span className="text-[10px] uppercase font-bold text-[#d4af37]">
                      {item.category} • {item.serviceName}
                    </span>
                    {item.professionalName && (
                      <p className="text-[11px] text-neutral-400">Por: {item.professionalName}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-2 text-xs">
                  <button
                    onClick={() => setBeforeAfter(prev => prev.map(b => b.id === item.id ? { ...b, published: !b.published } : b))}
                    className={cn(
                      "font-bold flex items-center gap-1",
                      item.published ? "text-emerald-400" : "text-neutral-500"
                    )}
                  >
                    {item.published ? <Eye size={14} /> : <EyeOff size={14} />}
                    <span>{item.published ? 'Visível na Vitrine' : 'Oculto'}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Excluir esta transformação?')) {
                        setBeforeAfter(prev => prev.filter(b => b.id !== item.id));
                        onToast('Transformação removida!');
                      }
                    }}
                    className="p-1 text-neutral-400 hover:text-rose-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TESTIMONIALS */}
      {activeTab === 'testimonials' && (
        <div className="space-y-4">
          <p className="text-xs text-neutral-400">
            Aprovações e depoimentos de clientes que visitaram o Salão Luxe.
          </p>
          <div className="space-y-3">
            {testimonials.map(item => (
              <div
                key={item.id}
                className="bg-[#121212] border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{item.clientName}</span>
                    <span className="text-[11px] text-[#d4af37] font-bold">★ {item.rating}.0</span>
                    <span className="text-[10px] text-neutral-400">({item.serviceOrProduct})</span>
                  </div>
                  <p className="text-neutral-300 text-xs italic mt-1 max-w-2xl">"{item.comment}"</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setTestimonials(prev => prev.map(t => t.id === item.id ? { ...t, published: !t.published } : t))}
                    className={cn(
                      "p-1.5 rounded",
                      item.published ? "text-emerald-400" : "text-neutral-500"
                    )}
                    title={item.published ? "Ocultar" : "Publicar"}
                  >
                    {item.published ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Excluir depoimento?')) {
                        setTestimonials(prev => prev.filter(t => t.id !== item.id));
                        onToast('Depoimento removido!');
                      }
                    }}
                    className="p-1.5 text-neutral-400 hover:text-rose-400 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: NOVO / EDITAR BANNER */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveBanner} className="bg-[#121212] border border-[#d4af37]/30 rounded-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-white font-bold text-base">
                {editingBanner ? 'Editar Banner do Carrossel' : 'Novo Banner Promocional'}
              </h3>
              <button type="button" onClick={() => setIsBannerModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">Título Principal *</label>
              <input
                type="text"
                required
                value={bannerTitle}
                onChange={e => setBannerTitle(e.target.value)}
                placeholder="Ex: A Arte da Transformação Capilar"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Subtítulo</label>
                <input
                  type="text"
                  value={bannerSubtitle}
                  onChange={e => setBannerSubtitle(e.target.value)}
                  placeholder="Ex: Experiência & Sofisticação"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Selo / Badge</label>
                <input
                  type="text"
                  value={bannerBadge}
                  onChange={e => setBannerBadge(e.target.value)}
                  placeholder="Ex: Destaque Luxe"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">Descrição</label>
              <textarea
                rows={2}
                value={bannerDesc}
                onChange={e => setBannerDesc(e.target.value)}
                placeholder="Breve texto promocional impactante..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37] resize-none"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">URL da Imagem de Fundo *</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  required
                  value={bannerImage}
                  onChange={e => setBannerImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                />
                <label className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1">
                  <Upload size={14} />
                  <span>Arquivo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, setBannerImage)} />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Texto do Botão (CTA)</label>
                <input
                  type="text"
                  value={bannerCtaText}
                  onChange={e => setBannerCtaText(e.target.value)}
                  placeholder="Ex: Agendar Experiência"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Ação ao Clicar</label>
                <select
                  value={bannerCtaAction}
                  onChange={e => setBannerCtaAction(e.target.value as any)}
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                >
                  <option value="agendar">Abrir Agenda</option>
                  <option value="produtos">Ver Produtos</option>
                  <option value="servicos">Ver Serviços</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsBannerModalOpen(false)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#d4af37] text-black text-xs font-bold rounded-xl hover:bg-[#e5c158] transition-colors flex items-center gap-1.5"
              >
                <Check size={16} />
                <span>Salvar Banner</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: NOVA FOTO/VÍDEO GALERIA */}
      {isGalleryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveGallery} className="bg-[#121212] border border-[#d4af37]/30 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-white font-bold text-base">Adicionar Mídia à Galeria</h3>
              <button type="button" onClick={() => setIsGalleryModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">Título da Foto / Espaço *</label>
              <input
                type="text"
                required
                value={galTitle}
                onChange={e => setGalTitle(e.target.value)}
                placeholder="Ex: Estação de Barboterapia"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">Categoria da Galeria</label>
              <select
                value={galCategory}
                onChange={e => setGalCategory(e.target.value as any)}
                className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]"
              >
                <option value="ambiente">Ambiente & Design</option>
                <option value="espaco_vip">Espaço VIP & Noivas</option>
                <option value="procedimentos">Procedimentos & Tratamentos</option>
                <option value="equipe">Equipe de Mestres</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">URL da Imagem / Capa *</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  required
                  value={galImage}
                  onChange={e => setGalImage(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                />
                <label className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1">
                  <Upload size={14} />
                  <span>Arquivo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, setGalImage)} />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">URL de Vídeo (Opcional - YouTube ou MP4)</label>
              <input
                type="url"
                value={galVideo}
                onChange={e => setGalVideo(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">Legenda Explicativa</label>
              <textarea
                rows={2}
                value={galCaption}
                onChange={e => setGalCaption(e.target.value)}
                placeholder="Descreva o espaço, benefícios ou equipamentos..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsGalleryModalOpen(false)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#d4af37] text-black text-xs font-bold rounded-xl hover:bg-[#e5c158] transition-colors flex items-center gap-1.5"
              >
                <Check size={16} />
                <span>Salvar Mídia</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: NOVA TRANSFORMAÇÃO ANTES & DEPOIS */}
      {isBAModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveBA} className="bg-[#121212] border border-[#d4af37]/30 rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-white font-bold text-base">Nova Transformação Antes & Depois</h3>
              <button type="button" onClick={() => setIsBAModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">Título do Trabalho *</label>
              <input
                type="text"
                required
                value={baTitle}
                onChange={e => setBaTitle(e.target.value)}
                placeholder="Ex: Balayage Champagne & Corte em Camadas"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Categoria *</label>
                <select
                  value={baCategory}
                  onChange={e => setBaCategory(e.target.value as any)}
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                >
                  <option value="cabelo">Cabelo</option>
                  <option value="barba">Barba</option>
                  <option value="unhas">Unhas</option>
                  <option value="estetica">Estética</option>
                  <option value="maquiagem">Maquiagem</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Profissional Responsável</label>
                <input
                  type="text"
                  value={baProfessionalName}
                  onChange={e => setBaProfessionalName(e.target.value)}
                  placeholder="Ex: Ana Oliveira"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">Serviço Realizado</label>
              <input
                type="text"
                value={baServiceName}
                onChange={e => setBaServiceName(e.target.value)}
                placeholder="Ex: Coloração & Mechas Premium"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">URL da Imagem ANTES *</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  required
                  value={baBeforeImage}
                  onChange={e => setBaBeforeImage(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                />
                <label className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1">
                  <Upload size={14} />
                  <span>Arquivo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, setBaBeforeImage)} />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">URL da Imagem DEPOIS *</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  required
                  value={baAfterImage}
                  onChange={e => setBaAfterImage(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                />
                <label className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1">
                  <Upload size={14} />
                  <span>Arquivo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, setBaAfterImage)} />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">Descrição do Procedimento</label>
              <textarea
                rows={2}
                value={baDesc}
                onChange={e => setBaDesc(e.target.value)}
                placeholder="Técnica utilizada, resultado alcançado..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsBAModalOpen(false)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#d4af37] text-black text-xs font-bold rounded-xl hover:bg-[#e5c158] transition-colors flex items-center gap-1.5"
              >
                <Check size={16} />
                <span>Salvar Transformação</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
