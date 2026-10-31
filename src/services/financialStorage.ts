import { 
  Expense, 
  ExpenseCategory, 
  FinancialTransaction, 
  ProfessionalCommission, 
  Appointment, 
  Order, 
  Professional,
  FinancialPaymentMethod
} from '@/src/types';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

export const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string; color: string }[] = [
  { id: 'aluguel', label: 'Aluguel & Imóvel', color: '#f59e0b' },
  { id: 'produtos', label: 'Reposição de Produtos / Estoque', color: '#3b82f6' },
  { id: 'comissao', label: 'Comissões de Profissionais', color: '#d4af37' },
  { id: 'energia_agua', label: 'Energia, Água & Conectividade', color: '#10b981' },
  { id: 'marketing', label: 'Marketing & Tráfego Pago', color: '#ec4899' },
  { id: 'manutencao', label: 'Manutenção & Equipamentos', color: '#8b5cf6' },
  { id: 'impostos', label: 'Impostos & Taxas Fiscais', color: '#ef4444' },
  { id: 'salarios', label: 'Salários & Pró-labore', color: '#06b6d4' },
  { id: 'outros', label: 'Outras Despesas Operacionais', color: '#6b7280' },
];

export function getInitialCommissions(): ProfessionalCommission[] {
  return [
    {
      id: 'comm-1',
      appointmentId: 'apt-101',
      professionalId: 'prof-1',
      professionalName: 'Carlos Oliveira',
      clientName: 'Mariana Silva',
      serviceNames: ['Corte Feminino Vip', 'Escova Modeladora'],
      servicePrice: 180.00,
      commissionRate: 50,
      commissionAmount: 90.00,
      date: format(new Date(), 'yyyy-MM-dd'),
      status: 'pendente'
    },
    {
      id: 'comm-2',
      appointmentId: 'apt-102',
      professionalId: 'prof-2',
      professionalName: 'Ana Souza',
      clientName: 'Lucas Mendes',
      serviceNames: ['Corte Masculino Fade'],
      servicePrice: 90.00,
      commissionRate: 50,
      commissionAmount: 45.00,
      date: format(new Date(), 'yyyy-MM-dd'),
      status: 'pago',
      paidAt: format(new Date(), 'yyyy-MM-dd')
    }
  ];
}

export function getInitialExpenses(): Expense[] {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const past5Days = format(subDays(new Date(), 5), 'yyyy-MM-dd');
  const past12Days = format(subDays(new Date(), 12), 'yyyy-MM-dd');
  const in3Days = format(subDays(new Date(), -3), 'yyyy-MM-dd');
  const in8Days = format(subDays(new Date(), -8), 'yyyy-MM-dd');

  return [
    {
      id: 'exp-1',
      description: 'Aluguel do Espaço Comercial Jardins',
      category: 'aluguel',
      amount: 4500.00,
      dueDate: past5Days,
      paymentDate: past5Days,
      status: 'paga',
      supplierName: 'Imobiliária Prime Properties',
      isRecurring: true,
      recurrenceInterval: 'mensal',
      paymentMethod: 'boleto',
      notes: 'Aluguel referente ao mês atual com taxa de condomínio inclusa',
      receiptNumber: 'NF-88219',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'exp-2',
      description: 'Conta de Energia Elétrica (Enel)',
      category: 'energia_agua',
      amount: 680.40,
      dueDate: past12Days,
      paymentDate: past12Days,
      status: 'paga',
      supplierName: 'Enel Distribuição SP',
      isRecurring: true,
      recurrenceInterval: 'mensal',
      paymentMethod: 'pix',
      notes: 'Consumo referente ao ciclo anterior de ar-condicionado e secadores',
      receiptNumber: 'ENEL-440192',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'exp-3',
      description: 'Internet Fibra 600MB & Telefonia Fixa',
      category: 'energia_agua',
      amount: 219.90,
      dueDate: monthStart,
      paymentDate: monthStart,
      status: 'paga',
      supplierName: 'Vivo Empresas',
      isRecurring: true,
      recurrenceInterval: 'mensal',
      paymentMethod: 'cartao_credito',
      notes: 'Link dedicado para Wi-Fi dos clientes e sistema do salão',
      receiptNumber: 'FAT-99011',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'exp-4',
      description: 'Fatura Fornecedor L\'Oréal & Kérastase Brasil',
      category: 'produtos',
      amount: 2850.00,
      dueDate: past5Days,
      paymentDate: past5Days,
      status: 'paga',
      supplierId: 'sup-1',
      supplierName: 'L\'Oréal & Kérastase Brasil',
      isRecurring: false,
      paymentMethod: 'boleto',
      notes: 'Pedido de reposição de máscaras capilares e óleos elixir Ultime',
      receiptNumber: 'NFe-128470',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'exp-5',
      description: 'Reposição Pomadas Modeladoras Barba Forte',
      category: 'produtos',
      amount: 940.00,
      dueDate: in3Days,
      status: 'pendente',
      supplierId: 'sup-3',
      supplierName: 'Barba Forte Indústria',
      isRecurring: false,
      paymentMethod: 'boleto',
      notes: 'Boleto a vencer para recebimento na próxima semana',
      receiptNumber: 'NFe-5519',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'exp-6',
      description: 'Campanhas de Anúncios no Instagram & Google Ads',
      category: 'marketing',
      amount: 550.00,
      dueDate: today,
      paymentDate: today,
      status: 'paga',
      supplierName: 'Meta Platforms / Google',
      isRecurring: true,
      recurrenceInterval: 'mensal',
      paymentMethod: 'cartao_credito',
      notes: 'Tráfego geo-localizado para atração de novos clientes no raio de 5km',
      receiptNumber: 'REC-ADS-019',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'exp-7',
      description: 'Manutenção Preventiva de Lavatórios e Poltronas',
      category: 'manutencao',
      amount: 380.00,
      dueDate: past12Days,
      paymentDate: past12Days,
      status: 'paga',
      supplierName: 'Técnica Hidráulica Express',
      isRecurring: false,
      paymentMethod: 'pix',
      notes: 'Revisão das mangueiras de aquecimento e pistões hidráulicos',
      receiptNumber: 'OS-7712',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'exp-8',
      description: 'Licença do Software de Gestão & Emissor Fiscal',
      category: 'outros',
      amount: 179.90,
      dueDate: in8Days,
      status: 'pendente',
      supplierName: 'Cloud Beauty ERP',
      isRecurring: true,
      recurrenceInterval: 'mensal',
      paymentMethod: 'cartao_credito',
      notes: 'Mensalidade do módulo fiscal de emissão NFC-e',
      receiptNumber: 'FAT-2024-10',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

/**
 * Calculates commissions for all completed appointments based on each professional's rate
 */
export function calculateProfessionalCommissions(params: {
  appointments: Appointment[];
  professionals: Professional[];
  existingCommissions?: ProfessionalCommission[];
}): ProfessionalCommission[] {
  const { appointments, professionals, existingCommissions = [] } = params;

  // Index existing commissions by appointmentId
  const existingMap = new Map<string, ProfessionalCommission>();
  existingCommissions.forEach(c => existingMap.set(c.appointmentId, c));

  const result: ProfessionalCommission[] = [];

  appointments.forEach(apt => {
    // Only calculate for completed appointments or confirmed/in-progress
    if (apt.status === 'cancelado') return;

    const existing = existingMap.get(apt.id);
    if (existing) {
      result.push(existing);
      return;
    }

    const prof = professionals.find(p => p.id === apt.professionalId);
    const rate = prof?.commission || 50; // default 50%
    const commissionAmount = Number((apt.totalPrice * (rate / 100)).toFixed(2));

    // If appointment is already completed, it's eligible to be paid
    const isCompleted = apt.status === 'concluido';

    result.push({
      id: `comm-${apt.id}`,
      appointmentId: apt.id,
      professionalId: apt.professionalId,
      professionalName: apt.professionalName,
      clientName: apt.clientName,
      serviceNames: apt.serviceNames,
      servicePrice: apt.totalPrice,
      commissionRate: rate,
      commissionAmount,
      date: apt.date,
      status: isCompleted ? 'pendente' : 'pendente',
    });
  });

  return result;
}

/**
 * Exports financial records to formatted CSV (compatible with Excel UTF-8)
 */
export function exportToCSV(data: {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
}) {
  const { filename, headers, rows } = data;
  const csvContent = '\uFEFF' + [
    headers.join(';'),
    ...rows.map(row => 
      row.map(field => {
        const str = String(field ?? '').replace(/"/g, '""');
        return `"${str}"`;
      }).join(';')
    )
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Calculates unified financial metrics and real weekly chart data for the Dashboard and Financial view.
 */
export function getFinancialDashboardMetrics(params: {
  appointments: Appointment[];
  orders: Order[];
  expenses: Expense[];
}) {
  const { appointments, orders, expenses } = params;

  // Active appointments (services revenue)
  const validAppointments = appointments.filter(a => a.status !== 'cancelado');
  const serviceRevenue = validAppointments.reduce((acc, a) => acc + (a.totalPrice || 0), 0);

  // Paid orders (product revenue)
  const paidOrders = orders.filter(o => o.paymentStatus === 'pago');
  const productRevenue = paidOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

  // Paid expenses
  const paidExpenses = expenses.filter(e => e.status === 'paga').reduce((acc, e) => acc + (e.amount || 0), 0);

  // Total gross revenue & net profit
  const totalGrossRevenue = serviceRevenue + productRevenue;
  const netProfit = totalGrossRevenue - paidExpenses;

  // Weekly real chart data calculation (for current week Mon-Sun)
  const dayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon...
  const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = subDays(today, distanceToMonday);

  const weeklyChartData = dayLabels.map((name, index) => {
    const targetDate = format(subDays(monday, -index), 'yyyy-MM-dd');

    const dayServices = validAppointments
      .filter(a => a.date === targetDate)
      .reduce((acc, a) => acc + (a.totalPrice || 0), 0);

    const dayProducts = paidOrders
      .filter(o => o.date === targetDate)
      .reduce((acc, o) => acc + (o.totalAmount || 0), 0);

    return {
      name,
      date: targetDate,
      vlr: dayServices + dayProducts,
      servicos: dayServices,
      produtos: dayProducts,
    };
  });

  return {
    serviceRevenue,
    productRevenue,
    paidExpenses,
    totalGrossRevenue,
    netProfit,
    appointmentCount: validAppointments.length,
    paidOrdersCount: paidOrders.length,
    weeklyChartData,
  };
}
