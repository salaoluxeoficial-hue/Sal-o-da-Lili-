import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Package, 
  ShoppingCart, 
  AlertCircle, 
  Edit2, 
  Trash2, 
  Tag, 
  Image as ImageIcon,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  DollarSign,
  TrendingUp,
  BarChart3,
  Video,
  CheckCircle2,
  Ban,
  Eye,
  ExternalLink,
  Award,
  Filter,
  X
} from 'lucide-react';
import { useLocalStorage } from '@/src/hooks/useLocalStorage';
import { formatCurrency, cn } from '@/src/lib/utils';
import { Product, Supplier, StockMovement, Order, Client, ClientPurchase } from '@/src/types';
import { 
  getInitialProducts, 
  getInitialSuppliers, 
  getInitialStockMovements, 
  getInitialOrders, 
  PRODUCT_CATEGORIES,
  processOrderSale
} from '@/src/services/productStorage';
import { initialClientsList } from '@/src/components/Clients';
import { ProductModal } from '@/src/components/products/ProductModal';
import { StockMovementModal } from '@/src/components/products/StockMovementModal';
import { SupplierModal } from '@/src/components/products/SupplierModal';
import { CartDrawer, CartItem } from '@/src/components/products/CartDrawer';
import { StockReportsView } from '@/src/components/products/StockReportsView';

export const Products: React.FC = () => {
  // Shared persistent storages
  const [products, setProducts] = useLocalStorage<Product[]>('products', getInitialProducts());
  const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('suppliers', getInitialSuppliers());
  const [movements, setMovements] = useLocalStorage<StockMovement[]>('stock_movements', getInitialStockMovements());
  const [orders, setOrders] = useLocalStorage<Order[]>('orders', getInitialOrders());
  const [clients, setClients] = useLocalStorage<Client[]>('clients', initialClientsList);
  const [purchases, setPurchases] = useLocalStorage<ClientPurchase[]>('client_purchases', []);

  // UI state
  const [activeTab, setActiveTab] = useState<'catalogo' | 'movimentacoes' | 'fornecedores' | 'relatorios'>('catalogo');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'inativo' | 'baixo_estoque' | 'mais_vendidos'>('all');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementProductId, setMovementProductId] = useState<string | undefined>();

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch = !query ||
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        (p.barcode && p.barcode.includes(query)) ||
        (p.supplierName && p.supplierName.toLowerCase().includes(query));

      const matchesCategory = categoryFilter === 'Todas' || p.category === categoryFilter;

      let matchesStatus = true;
      if (statusFilter === 'ativo') matchesStatus = p.status === 'ativo';
      else if (statusFilter === 'inativo') matchesStatus = p.status === 'inativo';
      else if (statusFilter === 'baixo_estoque') matchesStatus = p.stock <= p.minStock;
      else if (statusFilter === 'mais_vendidos') matchesStatus = (p.salesCount || 0) >= 30;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, categoryFilter, statusFilter]);

  // General counts
  const totalItems = products.reduce((acc, p) => acc + p.stock, 0);
  const lowStockItems = products.filter(p => p.stock <= p.minStock).length;
  const totalStockValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);

  // Cart actions
  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (product.status === 'inativo') {
      alert('Produto inativo no catálogo.');
      return;
    }
    if (product.stock <= 0) {
      alert('Produto sem saldo em estoque.');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Limite de estoque atingido (${product.stock} un).`);
          return prev;
        }
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    setCart(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Order completed
  const handleOrderCompleted = (
    newOrder: Order, 
    _updatedProducts: Product[], 
    _newMovements: StockMovement[], 
    _newClientPurchase?: ClientPurchase
  ) => {
    const result = processOrderSale({
      order: newOrder,
      products,
      stockMovements: movements,
      clientPurchases: purchases,
      clients,
      performedBy: 'PDV Balcão Salão Luxe'
    });

    setOrders(prev => [result.order, ...prev]);
    if (newOrder.paymentStatus === 'pago') {
      setProducts(result.products);
      setMovements(result.stockMovements);
      setPurchases(result.clientPurchases);
      setClients(result.clients);
    }
  };

  // Product CRUD
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (productData: Product) => {
    setProducts(prev => {
      const exists = prev.some(p => p.id === productData.id);
      if (exists) {
        return prev.map(p => p.id === productData.id ? productData : p);
      }
      return [productData, ...prev];
    });
  };

  const handleDeleteProduct = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este produto do catálogo?')) {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  const handleToggleProductStatus = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          status: p.status === 'ativo' ? 'inativo' : 'ativo',
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    }));
  };

  // Movement modal
  const handleOpenMovementModal = (productId?: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setMovementProductId(productId);
    setIsMovementModalOpen(true);
  };

  const handleConfirmMovement = (movement: StockMovement) => {
    setMovements(prev => [movement, ...prev]);
    // update product stock
    setProducts(prev => prev.map(p => {
      if (p.id === movement.productId) {
        return {
          ...p,
          stock: movement.newStock,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    }));
  };

  // Supplier CRUD
  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = (supplierData: Supplier) => {
    setSuppliers(prev => {
      const exists = prev.some(s => s.id === supplierData.id);
      if (exists) {
        return prev.map(s => s.id === supplierData.id ? supplierData : s);
      }
      return [supplierData, ...prev];
    });
  };

  const handleDeleteSupplier = (supplierId: string) => {
    if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
      setSuppliers(prev => prev.filter(s => s.id !== supplierId));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">Produtos & Estoque</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#d4af37] text-xs font-bold uppercase tracking-wider">
              Controle Inteligente
            </span>
          </div>
          <p className="text-neutral-400 mt-1">
            Gestão de inventário, custos, preços de venda, entradas/saídas, fornecedores e PDV.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Cart Floating / PDV Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 bg-[#141414] hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all"
          >
            <ShoppingCart size={16} className="text-[#d4af37]" />
            Sacola de Balcão
            {cart.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#d4af37] text-black font-extrabold text-[10px] flex items-center justify-center">
                {cart.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            )}
          </button>

          {/* Quick Movement */}
          <button
            onClick={() => handleOpenMovementModal()}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all"
          >
            <ArrowUpRight size={16} className="text-emerald-400" />
            Entrada / Saída
          </button>

          {/* Add Product */}
          <button 
            onClick={handleOpenAddProduct}
            className="flex items-center gap-2 bg-[#d4af37] text-black px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-[#d4af37]/90 transition-all shadow-lg shadow-[#d4af37]/10"
          >
            <Plus size={16} />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111111] border border-[#d4af37]/10 p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
              <Package size={20} />
            </div>
            <span className="text-neutral-400 text-xs font-semibold uppercase tracking-wider">Itens Cadastrados</span>
          </div>
          <p className="text-2xl font-bold text-white">{products.length} Produtos</p>
          <span className="text-[11px] text-neutral-500 mt-1 block">{totalItems} unidades no total</span>
        </div>

        <div className="bg-[#111111] border border-[#d4af37]/10 p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500">
              <AlertCircle size={20} />
            </div>
            <span className="text-neutral-400 text-xs font-semibold uppercase tracking-wider">Estoque Crítico</span>
          </div>
          <p className={cn(
            "text-2xl font-bold",
            lowStockItems > 0 ? "text-rose-400" : "text-white"
          )}>
            {lowStockItems} Itens
          </p>
          <span className="text-[11px] text-rose-400/80 mt-1 block">Abaixo do estoque mínimo</span>
        </div>

        <div className="bg-[#111111] border border-[#d4af37]/10 p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
              <Tag size={20} />
            </div>
            <span className="text-neutral-400 text-xs font-semibold uppercase tracking-wider">Valor em Venda</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalStockValue)}</p>
          <span className="text-[11px] text-emerald-400 mt-1 block font-medium">Potencial em prateleira</span>
        </div>

        <div className="bg-[#111111] border border-[#d4af37]/10 p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#d4af37]/10 rounded-xl text-[#d4af37]">
              <Building2 size={20} />
            </div>
            <span className="text-neutral-400 text-xs font-semibold uppercase tracking-wider">Fornecedores</span>
          </div>
          <p className="text-2xl font-bold text-[#d4af37]">{suppliers.length} Ativos</p>
          <span className="text-[11px] text-neutral-500 mt-1 block">Distribuidores homologados</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-[#111111] border border-white/10 rounded-2xl p-1.5 overflow-x-auto gap-1">
        {[
          { id: 'catalogo', label: 'Catálogo & Estoque', icon: Package },
          { id: 'movimentacoes', label: `Movimentações (${movements.length})`, icon: ArrowUpRight },
          { id: 'fornecedores', label: `Fornecedores (${suppliers.length})`, icon: Building2 },
          { id: 'relatorios', label: 'Relatórios & Lucratividade', icon: BarChart3 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap",
              activeTab === tab.id
                ? "bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: CATÁLOGO & ESTOQUE */}
      {activeTab === 'catalogo' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Search & Filter Toolbar */}
          <div className="bg-[#111111] border border-[#d4af37]/15 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
              <input 
                type="text"
                placeholder="Buscar por nome, categoria, código de barras ou fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#d4af37]/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Category Select */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]/50"
              >
                {PRODUCT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat === 'Todas' ? 'Todas as Categorias' : cat}</option>
                ))}
              </select>

              {/* Status Select */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]/50"
              >
                <option value="all">Todos os Status</option>
                <option value="ativo">Apenas Ativos</option>
                <option value="inativo">Inativos</option>
                <option value="baixo_estoque">Estoque Baixo</option>
                <option value="mais_vendidos">Mais Vendidos</option>
              </select>
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const isLowStock = product.stock <= product.minStock;
              const isOutOfStock = product.stock === 0;
              const isTopSeller = (product.salesCount || 0) >= 30;
              const unitProfit = Math.max(0, product.price - product.costPrice);

              return (
                <div 
                  key={product.id} 
                  className={cn(
                    "bg-[#111111] border rounded-2xl overflow-hidden transition-all group flex flex-col justify-between",
                    product.status === 'inativo' 
                      ? "opacity-60 border-white/5" 
                      : isLowStock 
                        ? "border-rose-500/30 hover:border-rose-500/50" 
                        : "border-[#d4af37]/15 hover:border-[#d4af37]/40 shadow-lg shadow-black/40"
                  )}
                >
                  {/* Image Container with Badges */}
                  <div className="aspect-[4/3] bg-neutral-900 relative overflow-hidden flex items-center justify-center">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <ImageIcon size={48} className="text-neutral-800" />
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[#d4af37] text-[10px] font-bold uppercase tracking-wider border border-[#d4af37]/30">
                        {product.category}
                      </span>
                      {isTopSeller && (
                        <span className="px-2 py-0.5 rounded-full bg-[#d4af37] text-black text-[10px] font-extrabold flex items-center gap-1 shadow-md">
                          <Award size={11} /> Top Seller
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                      {isOutOfStock ? (
                        <span className="bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                          ESGOTADO
                        </span>
                      ) : isLowStock ? (
                        <span className="bg-rose-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                          <AlertCircle size={10} /> Baixo Estoque
                        </span>
                      ) : null}

                      {product.status === 'inativo' && (
                        <span className="bg-neutral-800 text-neutral-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-neutral-700">
                          Inativo
                        </span>
                      )}
                    </div>

                    {/* Quick video button if available */}
                    {product.videoUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setVideoModalUrl(product.videoUrl || null);
                        }}
                        className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-[#d4af37] text-white hover:text-black backdrop-blur-md transition-all border border-white/10"
                        title="Assistir Vídeo Demonstrativo"
                      >
                        <Video size={14} />
                      </button>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-white font-bold text-sm group-hover:text-[#d4af37] transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                      </div>
                      <p className="text-neutral-400 text-xs line-clamp-2 leading-relaxed">
                        {product.description || 'Produto de alta qualidade para salão de beleza.'}
                      </p>
                      {product.supplierName && (
                        <p className="text-[11px] text-neutral-500 flex items-center gap-1">
                          <Building2 size={11} className="text-[#d4af37]" />
                          {product.supplierName}
                        </p>
                      )}
                    </div>

                    {/* Pricing and Stock Row */}
                    <div className="pt-3 border-t border-white/5 space-y-2">
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Preço de Venda</span>
                          <span className="text-white font-bold text-lg">{formatCurrency(product.price)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Em Estoque</span>
                          <span className={cn(
                            "text-sm font-bold",
                            isOutOfStock ? "text-rose-500" : isLowStock ? "text-amber-400" : "text-emerald-400"
                          )}>
                            {product.stock} un
                          </span>
                        </div>
                      </div>

                      {/* Cost and Profit Margin */}
                      <div className="flex justify-between items-center text-[11px] text-neutral-400 bg-white/[0.02] p-2 rounded-xl border border-white/5">
                        <span>Custo: {formatCurrency(product.costPrice)}</span>
                        <span className="text-emerald-400 font-semibold">
                          Lucro: {formatCurrency(unitProfit)} ({(unitProfit / product.price * 100).toFixed(0)}%)
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-white/5 flex items-center gap-2">
                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={product.stock <= 0 || product.status === 'inativo'}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#d4af37] text-black font-bold text-xs hover:bg-[#d4af37]/90 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[#d4af37]/10 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Adicionar à Sacola de Balcão"
                      >
                        <ShoppingCart size={14} />
                        Vender
                      </button>

                      <button
                        onClick={(e) => handleOpenMovementModal(product.id, e)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
                        title="Entrada / Saída de Estoque"
                      >
                        <ArrowUpRight size={15} />
                      </button>

                      <button
                        onClick={(e) => handleOpenEditProduct(product, e)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-[#d4af37] transition-colors"
                        title="Editar Produto"
                      >
                        <Edit2 size={15} />
                      </button>

                      <button
                        onClick={(e) => handleToggleProductStatus(product.id, e)}
                        className={cn(
                          "p-2 rounded-xl transition-colors",
                          product.status === 'ativo' 
                            ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white"
                            : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black"
                        )}
                        title={product.status === 'ativo' ? 'Desativar Produto' : 'Ativar Produto'}
                      >
                        {product.status === 'ativo' ? <Ban size={15} /> : <CheckCircle2 size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-3 bg-[#111111] border border-white/5 rounded-2xl">
                <Package size={40} className="mx-auto text-neutral-600" />
                <h4 className="text-white font-bold text-base">Nenhum produto encontrado</h4>
                <p className="text-neutral-500 text-xs">Tente ajustar seus termos de pesquisa ou filtros de categoria.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MOVIMENTAÇÕES DE ESTOQUE */}
      {activeTab === 'movimentacoes' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-white">Auditoria de Entradas e Baixas</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Todas as alterações de saldo físico registradas.</p>
            </div>
            <button
              onClick={() => handleOpenMovementModal()}
              className="flex items-center gap-1.5 bg-[#d4af37] text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#d4af37]/90 transition-all shadow-md"
            >
              <Plus size={15} />
              Nova Movimentação Manual
            </button>
          </div>

          <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-neutral-500 uppercase tracking-wider bg-white/[0.02]">
                    <th className="px-5 py-3.5 font-semibold">Data / Hora</th>
                    <th className="px-5 py-3.5 font-semibold">Produto</th>
                    <th className="px-5 py-3.5 font-semibold">Tipo</th>
                    <th className="px-5 py-3.5 font-semibold">Quantidade</th>
                    <th className="px-5 py-3.5 font-semibold">Saldo Atualizado</th>
                    <th className="px-5 py-3.5 font-semibold">Motivo / Documento</th>
                    <th className="px-5 py-3.5 font-semibold text-right">Responsável</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {movements.map(m => (
                    <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5 text-neutral-400">
                        {new Date(m.date).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-white">
                        {m.productName}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          m.type === 'entrada' ? "bg-emerald-500/15 text-emerald-400" :
                          m.type === 'venda' ? "bg-[#d4af37]/15 text-[#d4af37]" : "bg-rose-500/15 text-rose-400"
                        )}>
                          {m.type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold">
                        <span className={m.type === 'entrada' ? 'text-emerald-400' : 'text-rose-400'}>
                          {m.type === 'entrada' ? '+' : '-'}{m.quantity} un
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-neutral-300">
                        {m.previousStock} → <strong className="text-white">{m.newStock} un</strong>
                      </td>
                      <td className="px-5 py-3.5 text-neutral-400 truncate max-w-xs">
                        {m.reason}
                      </td>
                      <td className="px-5 py-3.5 text-right text-neutral-400">
                        {m.performedBy}
                      </td>
                    </tr>
                  ))}
                  {movements.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-500">
                        Nenhuma movimentação de estoque registrada até o momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FORNECEDORES */}
      {activeTab === 'fornecedores' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-white">Fornecedores Homologados</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Gestão de contatos comerciais, CNPJs e prazos.</p>
            </div>
            <button
              onClick={handleOpenAddSupplier}
              className="flex items-center gap-1.5 bg-[#d4af37] text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#d4af37]/90 transition-all shadow-md"
            >
              <Plus size={15} />
              Novo Fornecedor
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map(sup => (
              <div 
                key={sup.id}
                className="p-5 rounded-2xl bg-[#111111] border border-[#d4af37]/15 hover:border-[#d4af37]/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
                      <Building2 size={18} />
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenEditSupplier(sup)}
                        className="p-1.5 text-neutral-400 hover:text-[#d4af37] transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(sup.id)}
                        className="p-1.5 text-neutral-400 hover:text-rose-400 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-white font-bold text-base">{sup.name}</h4>
                  {sup.cnpj && <p className="text-[11px] font-mono text-neutral-500">CNPJ: {sup.cnpj}</p>}

                  <div className="space-y-1 text-xs text-neutral-400 pt-2 border-t border-white/5">
                    <p><strong className="text-neutral-300">Contato:</strong> {sup.contactName || 'Comercial'}</p>
                    <p><strong className="text-neutral-300">Telefone:</strong> {sup.phone}</p>
                    <p><strong className="text-neutral-300">E-mail:</strong> {sup.email}</p>
                  </div>

                  {sup.categories && sup.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {sup.categories.map(c => (
                        <span key={c} className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-neutral-400 font-semibold">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}

                  {sup.notes && (
                    <p className="text-[11px] text-neutral-400 italic bg-black/40 p-2 rounded-lg border border-white/5">
                      "{sup.notes}"
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-neutral-500">
                  <span>Cadastrado em {new Date(sup.createdAt).toLocaleDateString('pt-BR')}</span>
                  <button
                    onClick={() => handleOpenMovementModal(undefined)}
                    className="text-xs font-bold text-[#d4af37] hover:underline"
                  >
                    + Registrar Entrada
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: RELATÓRIOS & LUCRATIVIDADE */}
      {activeTab === 'relatorios' && (
        <StockReportsView
          products={products}
          movements={movements}
          suppliers={suppliers}
          orders={orders}
          onOpenQuickMovement={(prodId) => handleOpenMovementModal(prodId)}
        />
      )}

      {/* MODALS */}
      {/* Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        existingProduct={editingProduct}
        suppliers={suppliers}
      />

      {/* Stock Movement Modal */}
      <StockMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        products={products}
        initialProductId={movementProductId}
        onConfirmMovement={handleConfirmMovement}
      />

      {/* Supplier Modal */}
      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        onSave={handleSaveSupplier}
        existingSupplier={editingSupplier}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        clients={clients}
        products={products}
        onOrderCompleted={handleOrderCompleted}
      />

      {/* Video Modal Preview */}
      {videoModalUrl && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-[#0c0c0c] border border-[#d4af37]/40 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Video size={18} className="text-[#d4af37]" />
                Vídeo Demonstrativo do Produto
              </h4>
              <button 
                onClick={() => setVideoModalUrl(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>
            <div className="aspect-video bg-neutral-900 rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-3 border border-white/10">
              <Video size={48} className="text-[#d4af37] animate-pulse" />
              <p className="text-xs text-neutral-300">
                Link do vídeo: <a href={videoModalUrl} target="_blank" rel="noopener noreferrer" className="text-[#d4af37] underline break-all">{videoModalUrl}</a>
              </p>
              <a
                href={videoModalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#d4af37] text-black rounded-xl text-xs font-bold hover:bg-[#d4af37]/90 transition-all flex items-center gap-1.5"
              >
                <ExternalLink size={14} /> Abrir Vídeo na Nova Guia
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
