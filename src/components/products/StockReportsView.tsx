import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Package, 
  DollarSign, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter, 
  Calendar,
  Building2,
  Award,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Product, StockMovement, Supplier, Order } from '@/src/types';
import { formatCurrency, cn } from '@/src/lib/utils';

interface StockReportsViewProps {
  products: Product[];
  movements: StockMovement[];
  suppliers: Supplier[];
  orders: Order[];
  onOpenQuickMovement: (productId?: string) => void;
}

export const StockReportsView: React.FC<StockReportsViewProps> = ({
  products,
  movements,
  suppliers,
  orders,
  onOpenQuickMovement,
}) => {
  const [movementSearch, setMovementSearch] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('all');

  // Calculations
  const metrics = useMemo(() => {
    const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);
    const totalCostValue = products.reduce((acc, p) => acc + (p.costPrice * p.stock), 0);
    const totalSaleValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
    const projectedProfit = Math.max(0, totalSaleValue - totalCostValue);
    const averageMargin = totalSaleValue > 0 ? (projectedProfit / totalSaleValue) * 100 : 0;
    const lowStockCount = products.filter(p => p.stock < p.minStock).length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;

    return {
      totalUnits,
      totalCostValue,
      totalSaleValue,
      projectedProfit,
      averageMargin,
      lowStockCount,
      outOfStockCount,
    };
  }, [products]);

  // Top Selling Products (Sorted by salesCount desc)
  const topSellers = useMemo(() => {
    return [...products]
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 5);
  }, [products]);

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const matchSearch = !movementSearch.trim() || 
        m.productName.toLowerCase().includes(movementSearch.toLowerCase()) ||
        m.reason.toLowerCase().includes(movementSearch.toLowerCase());

      const matchType = movementTypeFilter === 'all' || m.type === movementTypeFilter;

      return matchSearch && matchType;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [movements, movementSearch, movementTypeFilter]);

  // Critical Low Stock Products
  const criticalProducts = useMemo(() => {
    return products.filter(p => p.stock <= p.minStock);
  }, [products]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Financial Valuation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111111] border border-white/5 p-5 rounded-2xl relative overflow-hidden">
          <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold block">
            Capital Imobilizado (Custo)
          </span>
          <p className="text-2xl font-bold text-white mt-1">
            {formatCurrency(metrics.totalCostValue)}
          </p>
          <span className="text-[11px] text-neutral-400 mt-2 block">
            {metrics.totalUnits} unidades em prateleira
          </span>
        </div>

        <div className="bg-[#111111] border border-white/5 p-5 rounded-2xl relative overflow-hidden">
          <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold block">
            Potencial de Faturamento
          </span>
          <p className="text-2xl font-bold text-[#d4af37] mt-1">
            {formatCurrency(metrics.totalSaleValue)}
          </p>
          <span className="text-[11px] text-emerald-400 mt-2 block font-medium">
            Valor de venda total estimado
          </span>
        </div>

        <div className="bg-[#111111] border border-white/5 p-5 rounded-2xl relative overflow-hidden">
          <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold block">
            Lucro Bruto Projetado
          </span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {formatCurrency(metrics.projectedProfit)}
          </p>
          <span className="text-[11px] text-neutral-400 mt-2 block">
            Margem média de {metrics.averageMargin.toFixed(1)}%
          </span>
        </div>

        <div className="bg-[#111111] border border-white/5 p-5 rounded-2xl relative overflow-hidden">
          <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold block">
            Alerta de Reposição
          </span>
          <p className={cn(
            "text-2xl font-bold mt-1",
            metrics.lowStockCount > 0 ? "text-rose-400" : "text-white"
          )}>
            {metrics.lowStockCount} produto{metrics.lowStockCount === 1 ? '' : 's'}
          </p>
          <span className="text-[11px] text-neutral-400 mt-2 block">
            {metrics.outOfStockCount} item{metrics.outOfStockCount === 1 ? '' : 'ns'} esgotado{metrics.outOfStockCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-[#111111] border border-[#d4af37]/20 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award size={18} className="text-[#d4af37]" />
              Produtos Mais Vendidos (Top Sellers)
            </h3>
            <span className="text-xs text-neutral-400 font-medium">Ranking por Unidades</span>
          </div>

          <div className="space-y-3">
            {topSellers.map((prod, index) => {
              const maxSales = topSellers[0]?.salesCount || 1;
              const percentage = (prod.salesCount / maxSales) * 100;

              return (
                <div key={prod.id} className="p-3.5 bg-white/5 border border-white/5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                        index === 0 ? "bg-[#d4af37] text-black" : index === 1 ? "bg-neutral-300 text-black" : "bg-neutral-800 text-neutral-400"
                      )}>
                        {index + 1}
                      </span>
                      <h4 className="text-white font-bold text-xs">{prod.name}</h4>
                    </div>
                    <span className="text-xs font-bold text-[#d4af37] whitespace-nowrap">
                      {prod.salesCount} vendid{prod.salesCount === 1 ? 'o' : 'os'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#d4af37] h-full rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-neutral-400">
                    <span>{prod.category} • Preço: {formatCurrency(prod.price)}</span>
                    <span className="text-emerald-400 font-medium">
                      Total gerado: {formatCurrency(prod.price * prod.salesCount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Critical Low Stock Alert & Actions */}
        <div className="bg-[#111111] border border-rose-500/25 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-400" />
              Necessidade de Reposição Imediata
            </h3>
            <span className="text-xs text-rose-400 font-bold">{criticalProducts.length} itens</span>
          </div>

          <div className="space-y-3">
            {criticalProducts.map(prod => (
              <div 
                key={prod.id}
                className="p-3.5 bg-rose-500/5 border border-rose-500/20 rounded-xl flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-white font-bold text-xs">{prod.name}</h4>
                  <p className="text-[11px] text-neutral-400">
                    Fornecedor: <span className="text-neutral-300">{prod.supplierName || 'Não atribuído'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-400 block">{prod.stock} un</span>
                    <span className="text-[10px] text-neutral-500">Mínimo: {prod.minStock} un</span>
                  </div>

                  <button
                    onClick={() => onOpenQuickMovement(prod.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#d4af37] text-black font-bold text-xs hover:bg-[#d4af37]/90 transition-all"
                  >
                    Repor
                  </button>
                </div>
              </div>
            ))}

            {criticalProducts.length === 0 && (
              <div className="py-12 text-center text-neutral-500 text-xs">
                Todos os produtos estão com níveis de estoque saudáveis acima do mínimo.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Movement History Table */}
      <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-base font-bold text-white">Histórico de Movimentações de Estoque</h3>
            <p className="text-neutral-400 text-xs mt-0.5">Auditoria de entradas, baixas internas e saídas por vendas.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
              <input
                type="text"
                placeholder="Buscar produto ou motivo..."
                value={movementSearch}
                onChange={(e) => setMovementSearch(e.target.value)}
                className="w-full sm:w-56 bg-[#161616] border border-white/10 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#d4af37]/50"
              />
            </div>

            {/* Filter */}
            <select
              value={movementTypeFilter}
              onChange={(e) => setMovementTypeFilter(e.target.value)}
              className="bg-[#161616] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#d4af37]/50"
            >
              <option value="all">Todos os Tipos</option>
              <option value="entrada">Entradas</option>
              <option value="saida">Saídas / Baixas</option>
              <option value="venda">Vendas Balcão</option>
              <option value="ajuste">Ajustes</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-neutral-500 text-xs uppercase tracking-wider bg-white/[0.02]">
                <th className="px-4 py-3 font-semibold">Data / Hora</th>
                <th className="px-4 py-3 font-semibold">Produto</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Qtd.</th>
                <th className="px-4 py-3 font-semibold">Saldo (Ant. → Novo)</th>
                <th className="px-4 py-3 font-semibold">Motivo / Justificativa</th>
                <th className="px-4 py-3 font-semibold text-right">Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredMovements.map(m => (
                <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-neutral-400">
                    {new Date(m.date).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 font-bold text-white">
                    {m.productName}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      m.type === 'entrada' ? "bg-emerald-500/15 text-emerald-400" :
                      m.type === 'venda' ? "bg-[#d4af37]/15 text-[#d4af37]" : "bg-rose-500/15 text-rose-400"
                    )}>
                      {m.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold">
                    <span className={m.type === 'entrada' ? 'text-emerald-400' : 'text-rose-400'}>
                      {m.type === 'entrada' ? '+' : '-'}{m.quantity} un
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-300">
                    {m.previousStock} → <strong className="text-white">{m.newStock} un</strong>
                  </td>
                  <td className="px-4 py-3 text-neutral-400 truncate max-w-xs" title={m.reason}>
                    {m.reason}
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-400">
                    {m.performedBy}
                  </td>
                </tr>
              ))}

              {filteredMovements.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    Nenhuma movimentação encontrada para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
