import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  DollarSign, 
  User, 
  CreditCard, 
  Calendar,
  AlertTriangle,
  Receipt,
  Eye,
  TrendingUp,
  Package,
  X
} from 'lucide-react';
import { useLocalStorage } from '@/src/hooks/useLocalStorage';
import { formatCurrency, cn } from '@/src/lib/utils';
import { Order, OrderPaymentStatus, Product, StockMovement, ClientPurchase, Client } from '@/src/types';
import { getInitialOrders, getInitialProducts, getInitialStockMovements, processOrderSale } from '@/src/services/productStorage';
import { getInitialPurchases, getInitialClients } from '@/src/services/clientStorage';

interface OrdersProps {
  onNavigateToProducts?: () => void;
}

export const Orders: React.FC<OrdersProps> = ({ onNavigateToProducts }) => {
  const [orders, setOrders] = useLocalStorage<Order[]>('orders', getInitialOrders());
  const [products, setProducts] = useLocalStorage<Product[]>('products', getInitialProducts());
  const [stockMovements, setStockMovements] = useLocalStorage<StockMovement[]>('stock_movements', getInitialStockMovements());
  const [clientPurchases, setClientPurchases] = useLocalStorage<ClientPurchase[]>('client_purchases', getInitialPurchases());
  const [clients, setClients] = useLocalStorage<Client[]>('clients', getInitialClients());

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | OrderPaymentStatus>('todos');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Financial summary of orders
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let pendingValue = 0;

    orders.forEach(order => {
      if (order.paymentStatus === 'pago') {
        totalRevenue += order.totalAmount;
        totalCost += order.totalCost;
        paidCount++;
      } else if (order.paymentStatus === 'pendente') {
        pendingCount++;
        pendingValue += order.totalAmount;
      }
    });

    const netProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      paidCount,
      pendingCount,
      pendingValue,
      netProfit,
      profitMargin
    };
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.clientPhone && order.clientPhone.includes(searchTerm)) ||
        order.items.some(i => i.productName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'todos' || order.paymentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, searchTerm, statusFilter]);

  // Action: Confirm payment of pending order (triggers stock deduction)
  const handleConfirmPayment = (orderToConfirm: Order) => {
    if (orderToConfirm.paymentStatus === 'pago') return;

    const confirmAction = window.confirm(
      `Confirmar pagamento do pedido #${orderToConfirm.id} no valor de ${formatCurrency(orderToConfirm.totalAmount)}?\n\nEsta ação irá dar baixa no estoque dos produtos correspondentes.`
    );
    if (!confirmAction) return;

    const paidOrder: Order = {
      ...orderToConfirm,
      paymentStatus: 'pago',
      stockDeducted: false, // processOrderSale will set it true and deduct stock
    };

    const result = processOrderSale({
      order: paidOrder,
      products,
      stockMovements,
      clientPurchases,
      clients,
      performedBy: 'Gerente Salão Luxe (Confirmação de Pedido)'
    });

    setOrders(prev => prev.map(o => o.id === orderToConfirm.id ? result.order : o));
    setProducts(result.products);
    setStockMovements(result.stockMovements);
    setClientPurchases(result.clientPurchases);
    setClients(result.clients);

    if (selectedOrder && selectedOrder.id === orderToConfirm.id) {
      setSelectedOrder(result.order);
    }
  };

  // Action: Cancel order
  const handleCancelOrder = (order: Order) => {
    const confirmCancel = window.confirm(
      `Deseja realmente cancelar o pedido #${order.id}?` + 
      (order.stockDeducted ? `\n\nATENÇÃO: Os produtos que tiveram baixa no estoque serão devolvidos ao inventário!` : '')
    );
    if (!confirmCancel) return;

    // If stock was already deducted, restore items back into stock
    if (order.stockDeducted) {
      let updatedProducts = [...products];
      const newMovements: StockMovement[] = [];

      order.items.forEach(item => {
        const prodIndex = updatedProducts.findIndex(p => p.id === item.productId);
        if (prodIndex !== -1) {
          const prod = updatedProducts[prodIndex];
          const prevStock = prod.stock;
          const newStock = prevStock + item.quantity;

          updatedProducts[prodIndex] = {
            ...prod,
            stock: newStock,
            salesCount: Math.max(0, (prod.salesCount || 0) - item.quantity),
            updatedAt: new Date().toISOString()
          };

          newMovements.push({
            id: `mov-${Date.now()}-${item.productId}`,
            productId: item.productId,
            productName: item.productName,
            type: 'ajuste',
            quantity: item.quantity,
            previousStock: prevStock,
            newStock: newStock,
            reason: `Devolução ao estoque por cancelamento do pedido #${order.id}`,
            date: new Date().toISOString(),
            performedBy: 'Gerente Salão Luxe',
            orderId: order.id
          });
        }
      });

      setProducts(updatedProducts);
      setStockMovements(prev => [...newMovements, ...prev]);
    }

    const updatedOrder: Order = {
      ...order,
      paymentStatus: 'cancelado',
      stockDeducted: false
    };

    setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
    if (selectedOrder && selectedOrder.id === order.id) {
      setSelectedOrder(updatedOrder);
    }
  };

  const getPaymentMethodLabel = (method: Order['paymentMethod']) => {
    switch (method) {
      case 'pix': return 'PIX';
      case 'cartao_credito': return 'Cartão de Crédito';
      case 'cartao_debito': return 'Cartão de Débito';
      case 'dinheiro': return 'Dinheiro';
      default: return method;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0a0a0a] p-6 rounded-2xl border border-[#d4af37]/20 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#d4af37]/10 text-[#d4af37] rounded-xl border border-[#d4af37]/30">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-white tracking-wide">
                Pedidos & Vendas no Balcão
              </h1>
              <p className="text-sm text-neutral-400">
                Gerencie pedidos emitidos, confirme recebimentos e consulte notas de venda
              </p>
            </div>
          </div>
        </div>

        {onNavigateToProducts && (
          <button
            onClick={onNavigateToProducts}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#d4af37] to-[#b38f2a] text-black font-semibold rounded-xl hover:brightness-110 transition shadow-lg shadow-[#d4af37]/20"
          >
            <Package size={18} />
            <span>Abrir Balcão de Produtos & PDV</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0c0c0c] p-5 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#d4af37]/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold tracking-wider uppercase">Faturamento Recebido</span>
            <DollarSign size={18} className="text-[#d4af37]" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(stats.totalRevenue)}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {stats.paidCount} pedido(s) faturado(s) com sucesso
          </p>
        </div>

        <div className="bg-[#0c0c0c] p-5 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold tracking-wider uppercase">Lucro Operacional Líquido</span>
            <TrendingUp size={18} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            {formatCurrency(stats.netProfit)}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Margem comercial de {stats.profitMargin.toFixed(1)}% nas vendas
          </p>
        </div>

        <div className="bg-[#0c0c0c] p-5 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold tracking-wider uppercase">Pagamentos Pendentes</span>
            <Clock size={18} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">
            {formatCurrency(stats.pendingValue)}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {stats.pendingCount} pedido(s) aguardando liquidação
          </p>
        </div>

        <div className="bg-[#0c0c0c] p-5 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold tracking-wider uppercase">Regra de Segurança</span>
            <CheckCircle2 size={18} className="text-blue-400" />
          </div>
          <div className="text-sm font-semibold text-white tracking-tight mt-1">
            Estoque Bloqueado
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            O estoque físico só sofre baixa quando o status é <strong className="text-white">Pago</strong>.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-[#0c0c0c] p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar por ID, cliente, telefone ou item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#141414] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#d4af37]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Filter size={14} /> Status:
          </span>
          {(['todos', 'pago', 'pendente', 'cancelado'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap",
                statusFilter === st 
                  ? "bg-[#d4af37] text-black font-semibold shadow-md shadow-[#d4af37]/20"
                  : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 border border-white/5"
              )}
            >
              {st === 'todos' ? 'Todos' : st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#0c0c0c] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-300">
            <thead className="bg-[#141414] text-xs uppercase tracking-wider text-neutral-400 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold">Código / Data</th>
                <th className="px-6 py-4 font-semibold">Cliente</th>
                <th className="px-6 py-4 font-semibold">Itens</th>
                <th className="px-6 py-4 font-semibold">Total</th>
                <th className="px-6 py-4 font-semibold">Forma de Pagto</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Estoque</th>
                <th className="px-6 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-neutral-500">
                    Nenhum pedido encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-6 py-4">
                      <div className="font-mono font-medium text-white">#{order.id}</div>
                      <div className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                        <Calendar size={12} />
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')} às {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-white flex items-center gap-1.5">
                        <User size={14} className="text-[#d4af37]" />
                        {order.clientName}
                      </div>
                      {order.clientPhone && (
                        <div className="text-xs text-neutral-500">{order.clientPhone}</div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-xs text-neutral-300 max-w-xs truncate">
                        {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {order.items.reduce((acc, i) => acc + i.quantity, 0)} unidade(s) total
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">
                        {formatCurrency(order.totalAmount)}
                      </div>
                      <div className="text-xs text-emerald-400">
                        Lucro: {formatCurrency(order.totalAmount - order.totalCost)}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-300">
                        <CreditCard size={14} className="text-neutral-500" />
                        {getPaymentMethodLabel(order.paymentMethod)}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {order.paymentStatus === 'pago' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 size={12} /> Pago
                        </span>
                      )}
                      {order.paymentStatus === 'pendente' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock size={12} /> Pendente
                        </span>
                      )}
                      {order.paymentStatus === 'cancelado' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <XCircle size={12} /> Cancelado
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {order.stockDeducted ? (
                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Baixado
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-500 flex items-center gap-1">
                          <Clock size={12} /> Não deduzido
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-neutral-400 hover:text-[#d4af37] hover:bg-white/5 rounded-lg transition"
                          title="Ver Recibo Completo"
                        >
                          <Eye size={16} />
                        </button>

                        {order.paymentStatus === 'pendente' && (
                          <button
                            onClick={() => handleConfirmPayment(order)}
                            className="px-2.5 py-1 text-xs bg-[#d4af37]/20 hover:bg-[#d4af37] text-[#d4af37] hover:text-black font-semibold rounded-lg border border-[#d4af37]/40 transition"
                            title="Confirmar pagamento e baixar estoque"
                          >
                            Dar Baixa
                          </button>
                        )}

                        {order.paymentStatus !== 'cancelado' && (
                          <button
                            onClick={() => handleCancelOrder(order)}
                            className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            title="Cancelar Pedido"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Receipt Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0f0f0f] border border-[#d4af37]/30 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl space-y-5">
            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div>
                <div className="text-xs font-semibold text-[#d4af37] uppercase tracking-wider flex items-center gap-1">
                  <Receipt size={14} /> Recibo de Venda Balcão
                </div>
                <h3 className="text-xl font-serif font-bold text-white mt-1">
                  Pedido #{selectedOrder.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5"
              >
                <X size={20} />
              </button>
            </div>

            {/* Client & Date */}
            <div className="grid grid-cols-2 gap-4 bg-[#141414] p-4 rounded-xl text-xs">
              <div>
                <span className="text-neutral-500 block">Cliente</span>
                <span className="text-white font-medium text-sm">{selectedOrder.clientName}</span>
                {selectedOrder.clientPhone && (
                  <span className="text-neutral-400 block">{selectedOrder.clientPhone}</span>
                )}
              </div>
              <div>
                <span className="text-neutral-500 block">Data & Hora</span>
                <span className="text-white font-medium">
                  {new Date(selectedOrder.createdAt).toLocaleString('pt-BR')}
                </span>
                <span className="text-neutral-400 block">
                  Pagamento: {getPaymentMethodLabel(selectedOrder.paymentMethod)}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                Itens Adquiridos
              </span>
              <div className="bg-[#141414] rounded-xl divide-y divide-white/5 max-h-48 overflow-y-auto">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-white font-medium block">{item.productName}</span>
                      <span className="text-neutral-500">
                        {item.quantity}x de {formatCurrency(item.price)}
                      </span>
                    </div>
                    <span className="text-white font-semibold">
                      {formatCurrency(item.quantity * item.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="border-t border-white/10 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>Custo Total de Aquisição:</span>
                <span>{formatCurrency(selectedOrder.totalCost)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Margem de Lucro Bruto:</span>
                <span>{formatCurrency(selectedOrder.totalAmount - selectedOrder.totalCost)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/5">
                <span>Total Final:</span>
                <span className="text-[#d4af37] font-serif text-lg">
                  {formatCurrency(selectedOrder.totalAmount)}
                </span>
              </div>
            </div>

            {/* Status Footer */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">Status:</span>
                {selectedOrder.paymentStatus === 'pago' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Pago & Estoque Baixado
                  </span>
                ) : selectedOrder.paymentStatus === 'pendente' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Pagamento Pendente
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Cancelado
                  </span>
                )}
              </div>

              {selectedOrder.paymentStatus === 'pendente' && (
                <button
                  onClick={() => handleConfirmPayment(selectedOrder)}
                  className="px-4 py-2 bg-[#d4af37] text-black font-semibold text-xs rounded-xl hover:brightness-110 transition shadow-lg shadow-[#d4af37]/20"
                >
                  Confirmar Pagamento & Baixar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
