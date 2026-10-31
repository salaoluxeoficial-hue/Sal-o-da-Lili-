import { Product, Supplier, StockMovement, Order, Client, ClientPurchase } from '@/src/types';

export function getInitialSuppliers(): Supplier[] {
  return [
    {
      id: 'sup-1',
      name: "L'Oréal Professionnel & Kérastase Brasil",
      contactName: 'Carlos Mendonça',
      phone: '(11) 3244-5500',
      email: 'pedidos@lorealpro.com.br',
      cnpj: '33.000.111/0001-52',
      categories: ['Cabelo', 'Tratamento', 'Finalização'],
      notes: 'Entrega semanal às terças-feiras. Faturamento em 28 dias.',
      createdAt: '2026-01-15T10:00:00.000Z',
    },
    {
      id: 'sup-2',
      name: 'Barba Forte Cosméticos Masculinos',
      contactName: 'Juliana Pires',
      phone: '(11) 98765-4321',
      email: 'vendas@barbaforte.com.br',
      cnpj: '24.555.888/0001-99',
      categories: ['Barba', 'Finalização', 'Acessórios'],
      notes: 'Representante regional exclusivo. Desconto de 10% para compras acima de R$ 1.500.',
      createdAt: '2026-02-10T14:30:00.000Z',
    },
    {
      id: 'sup-3',
      name: 'Wella Professionals Distribuição',
      contactName: 'Rodrigo Antunes',
      phone: '(11) 4004-9889',
      email: 'contato@welladistribuidora.com.br',
      cnpj: '05.888.777/0001-34',
      categories: ['Coloração/Química', 'Tratamento'],
      notes: 'Fornecedor de pós-descolorantes e colorações da linha Illumina Color.',
      createdAt: '2026-03-05T09:15:00.000Z',
    },
  ];
}

export function getInitialProducts(): Product[] {
  return [
    {
      id: 'prod-1',
      name: 'Shampoo Kérastase Nutritive Bain Satin 1L',
      description: 'Shampoo nutritivo de alta performance para cabelos normais a secos. Proporciona brilho extremo, maleabilidade e hidratação profunda sem pesar os fios.',
      category: 'Cabelo',
      price: 185.00,
      costPrice: 95.00,
      stock: 14,
      minStock: 6,
      maxStock: 40,
      imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      barcode: '7891000234561',
      supplierId: 'sup-1',
      supplierName: "L'Oréal Professionnel & Kérastase Brasil",
      status: 'ativo',
      salesCount: 42,
      createdAt: '2026-01-20T10:00:00.000Z',
      updatedAt: '2026-10-25T14:00:00.000Z',
    },
    {
      id: 'prod-2',
      name: 'Pomada Modeladora Barba Forte Efeito Matte 80g',
      description: 'Fixação forte e duradoura com acabamento 100% fosco e sem brilho. Ideal para cortes modernos, texturizados e penteados estruturados ao longo de todo o dia.',
      category: 'Finalização',
      price: 55.00,
      costPrice: 22.00,
      stock: 4, // Estoque baixo! Menor que minStock 8
      minStock: 8,
      maxStock: 35,
      imageUrl: 'https://images.unsplash.com/photo-1598452963314-b09f397a5c48?w=500&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      barcode: '7891000987654',
      supplierId: 'sup-2',
      supplierName: 'Barba Forte Cosméticos Masculinos',
      status: 'ativo',
      salesCount: 78,
      createdAt: '2026-02-12T11:00:00.000Z',
      updatedAt: '2026-10-28T16:00:00.000Z',
    },
    {
      id: 'prod-3',
      name: 'Óleo Hidratante Premium para Barba 30ml',
      description: 'Blend de óleos vegetais nobres (argan, jojoba e semente de uva) que amacia a barba, combate a coceira e perfuma com aroma amadeirado sofisticado.',
      category: 'Barba',
      price: 48.00,
      costPrice: 19.50,
      stock: 22,
      minStock: 5,
      maxStock: 30,
      imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=80',
      barcode: '7891000345678',
      supplierId: 'sup-2',
      supplierName: 'Barba Forte Cosméticos Masculinos',
      status: 'ativo',
      salesCount: 35,
      createdAt: '2026-02-15T09:30:00.000Z',
      updatedAt: '2026-10-24T18:00:00.000Z',
    },
    {
      id: 'prod-4',
      name: 'Máscara Wella Professionals Oil Reflections 500ml',
      description: 'Tratamento intensivo que restaura a estrutura capilar com óleos preciosos de camélia e chá branco. Deixa os cabelos instantaneamente sedosos e luminosos.',
      category: 'Tratamento',
      price: 160.00,
      costPrice: 78.00,
      stock: 2, // Estoque crítico!
      minStock: 6,
      maxStock: 25,
      imageUrl: 'https://images.unsplash.com/photo-1608248597359-715764d85834?w=500&auto=format&fit=crop&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      barcode: '7891000567890',
      supplierId: 'sup-3',
      supplierName: 'Wella Professionals Distribuição',
      status: 'ativo',
      salesCount: 29,
      createdAt: '2026-03-10T14:00:00.000Z',
      updatedAt: '2026-10-20T10:00:00.000Z',
    },
    {
      id: 'prod-5',
      name: 'Balm Multifuncional Barba e Rosto 120g',
      description: 'Ação 2 em 1 que acalma a pele pós-barbear e alinha os fios da barba. Contém extrato de camomila e aloe vera, prevenindo irritações.',
      category: 'Barba',
      price: 42.00,
      costPrice: 17.00,
      stock: 18,
      minStock: 5,
      maxStock: 30,
      imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80',
      barcode: '7891000678901',
      supplierId: 'sup-2',
      supplierName: 'Barba Forte Cosméticos Masculinos',
      status: 'ativo',
      salesCount: 19,
      createdAt: '2026-03-18T16:00:00.000Z',
      updatedAt: '2026-10-15T12:00:00.000Z',
    },
    {
      id: 'prod-6',
      name: 'Leave-in Protetor Térmico L’Oréal Absolut Repair 90ml',
      description: 'Proteção térmica até 230°C com proteína de trigo dourada e quinoa dourada. Reparação instantânea para cabelos danificados por secador e chapinha.',
      category: 'Finalização',
      price: 110.00,
      costPrice: 52.00,
      stock: 12,
      minStock: 5,
      maxStock: 25,
      imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80',
      barcode: '7891000789012',
      supplierId: 'sup-1',
      supplierName: "L'Oréal Professionnel & Kérastase Brasil",
      status: 'ativo',
      salesCount: 31,
      createdAt: '2026-04-02T13:00:00.000Z',
      updatedAt: '2026-10-22T15:00:00.000Z',
    },
  ];
}

export function getInitialStockMovements(): StockMovement[] {
  return [
    {
      id: 'mov-1',
      productId: 'prod-1',
      productName: 'Shampoo Kérastase Nutritive Bain Satin 1L',
      type: 'entrada',
      quantity: 20,
      previousStock: 0,
      newStock: 20,
      reason: 'Compra inicial junto ao fornecedor L’Oréal NF 45892',
      date: '2026-09-15T10:30:00.000Z',
      performedBy: 'Gerência de Estoque',
      unitCost: 95.00,
    },
    {
      id: 'mov-2',
      productId: 'prod-2',
      productName: 'Pomada Modeladora Barba Forte Efeito Matte 80g',
      type: 'entrada',
      quantity: 25,
      previousStock: 0,
      newStock: 25,
      reason: 'Reposição quinzenal Barba Forte NF 1204',
      date: '2026-09-18T14:00:00.000Z',
      performedBy: 'Gerência de Estoque',
      unitCost: 22.00,
    },
    {
      id: 'mov-3',
      productId: 'prod-2',
      productName: 'Pomada Modeladora Barba Forte Efeito Matte 80g',
      type: 'venda',
      quantity: 1,
      previousStock: 5,
      newStock: 4,
      reason: 'Venda de balcão confirmada (Pedido #ORD-1049)',
      date: '2026-10-28T16:00:00.000Z',
      performedBy: 'PDV Balcão',
      orderId: 'ord-1',
    },
    {
      id: 'mov-4',
      productId: 'prod-4',
      productName: 'Máscara Wella Professionals Oil Reflections 500ml',
      type: 'saida',
      quantity: 1,
      previousStock: 3,
      newStock: 2,
      reason: 'Consumo interno para bancada do lavatório',
      date: '2026-10-26T11:15:00.000Z',
      performedBy: 'Ana Oliveira (Colorista)',
    },
  ];
}

export function getInitialOrders(): Order[] {
  return [
    {
      id: 'ord-1',
      clientId: '1',
      clientName: 'Carlos Alberto',
      clientPhone: '(11) 98888-7777',
      items: [
        {
          productId: 'prod-3',
          productName: 'Óleo Hidratante Premium para Barba 30ml',
          price: 48.00,
          costPrice: 19.50,
          quantity: 1,
          imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=80',
        }
      ],
      totalAmount: 48.00,
      totalCost: 19.50,
      paymentMethod: 'pix',
      paymentStatus: 'pago',
      stockDeducted: true,
      date: '2026-10-25',
      createdAt: '2026-10-25T11:00:00.000Z',
      notes: 'Retirado na recepção após corte e barba.',
    },
    {
      id: 'ord-2',
      clientId: '2',
      clientName: 'Mariana Costa',
      clientPhone: '(11) 97777-6666',
      items: [
        {
          productId: 'prod-1',
          productName: 'Shampoo Kérastase Nutritive Bain Satin 1L',
          price: 185.00,
          costPrice: 95.00,
          quantity: 1,
          imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop&q=80',
        }
      ],
      totalAmount: 185.00,
      totalCost: 95.00,
      paymentMethod: 'cartao_credito',
      paymentStatus: 'pago',
      stockDeducted: true,
      date: '2026-10-26',
      createdAt: '2026-10-26T17:10:00.000Z',
    },
    {
      id: 'ord-3',
      clientId: '3',
      clientName: 'Roberto Junior',
      clientPhone: '(11) 96666-5555',
      items: [
        {
          productId: 'prod-2',
          productName: 'Pomada Modeladora Barba Forte Efeito Matte 80g',
          price: 55.00,
          costPrice: 22.00,
          quantity: 1,
        }
      ],
      totalAmount: 55.00,
      totalCost: 22.00,
      paymentMethod: 'pix',
      paymentStatus: 'pendente', // Pendente: não descontou estoque!
      stockDeducted: false,
      date: '2026-10-30',
      createdAt: '2026-10-30T09:00:00.000Z',
      notes: 'Aguardando confirmação de comprovante via WhatsApp.',
    }
  ];
}

export const PRODUCT_CATEGORIES = [
  'Todas',
  'Cabelo',
  'Barba',
  'Finalização',
  'Tratamento',
  'Coloração/Química',
  'Acessórios',
  'Perfumaria',
];

/**
  Processes a new order atomically across products, stock movements, client purchases and client totals.
 */
export function processOrderSale(params: {
  order: Order;
  products: Product[];
  stockMovements: StockMovement[];
  clientPurchases: ClientPurchase[];
  clients: Client[];
  performedBy?: string;
}) {
  const { order, products, stockMovements, clientPurchases, clients, performedBy = 'PDV Salão Luxe' } = params;

  let updatedProducts = [...products];
  const newMovements: StockMovement[] = [];
  let updatedOrder = { ...order };

  if (order.paymentStatus === 'pago' && !order.stockDeducted) {
    updatedOrder.stockDeducted = true;

    // 1. Deduct stock and increment salesCount
    order.items.forEach(item => {
      const idx = updatedProducts.findIndex(p => p.id === item.productId);
      if (idx !== -1) {
        const prod = updatedProducts[idx];
        const prevStock = prod.stock;
        const newStock = Math.max(0, prevStock - item.quantity);

        updatedProducts[idx] = {
          ...prod,
          stock: newStock,
          salesCount: (prod.salesCount || 0) + item.quantity,
          updatedAt: new Date().toISOString(),
        };

        newMovements.push({
          id: `mov-${Date.now()}-${item.productId}`,
          productId: item.productId,
          productName: item.productName,
          type: 'venda',
          quantity: item.quantity,
          previousStock: prevStock,
          newStock,
          reason: `Venda Pedido #${order.id} - ${order.clientName}`,
          date: new Date().toISOString(),
          performedBy,
          orderId: order.id,
        });
      }
    });
  }

  // 2. Add client purchase and update client totalSpent if paid and valid client
  let updatedPurchases = [...clientPurchases];
  let updatedClients = [...clients];

  if (order.paymentStatus === 'pago' && order.clientId && order.clientId !== 'balcao' && order.clientId !== 'guest') {
    const existingPurchaseIndex = updatedPurchases.findIndex(p => p.id === `cp-${order.id}`);
    if (existingPurchaseIndex === -1) {
      const newPurchase: ClientPurchase = {
        id: `cp-${order.id}`,
        clientId: order.clientId,
        date: order.date,
        description: order.items.map(i => `${i.quantity}x ${i.productName}`).join(', '),
        category: 'produto',
        amount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        status: 'pago',
        invoiceNumber: `PED-${order.id}`,
      };
      updatedPurchases = [newPurchase, ...updatedPurchases];
    }

    updatedClients = updatedClients.map(c => {
      if (c.id === order.clientId) {
        return {
          ...c,
          totalSpent: (c.totalSpent || 0) + order.totalAmount,
          lastVisit: order.date,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });
  }

  return {
    order: updatedOrder,
    products: updatedProducts,
    stockMovements: [...newMovements, ...stockMovements],
    clientPurchases: updatedPurchases,
    clients: updatedClients,
  };
}

