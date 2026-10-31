export type ViewType = 
  | 'dashboard' 
  | 'agenda' 
  | 'profissionais' 
  | 'clientes' 
  | 'servicos' 
  | 'produtos' 
  | 'pedidos' 
  | 'financeiro' 
  | 'chat' 
  | 'vitrine' 
  | 'configuracoes'
  | 'area_cliente';

export type UserRole = 'publico' | 'cliente' | 'profissional' | 'admin';

export interface DynamicMenuItem {
  id: string;
  label: string;
  iconName: string; // e.g. 'UserSquare2', 'Users', 'Lock', 'Download', 'Image', 'Sparkles', 'Calendar', 'ShoppingBag', 'MessageSquare'
  targetView: ViewType | 'pwa_install' | 'espaco_profissional' | 'area_restrita_admin' | 'galeria';
  roles: UserRole[]; // Which roles can see this menu option
  order: number;
  active: boolean;
  visible: boolean;
  isAction?: boolean;
}

export interface UserSession {
  userId: string;
  userName: string;
  userEmail: string;
  role: UserRole;
  photoUrl?: string;
  token?: string;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export interface Professional {
  id: string;
  name: string;
  role: string;
  photoUrl?: string;
  commission: number;
  specialties: string[];
}

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number; // in minutes
  imageUrl?: string;
  description?: string;
}

export type ClientStatus = 'ativo' | 'bloqueado' | 'inativo';

export interface ClientPurchase {
  id: string;
  clientId: string;
  date: string; // YYYY-MM-DD
  description: string;
  category: 'servico' | 'produto' | 'pacote';
  amount: number;
  paymentMethod: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro';
  status: 'pago' | 'pendente' | 'estornado';
  invoiceNumber?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  photoUrl?: string;
  birthDate?: string; // YYYY-MM-DD
  status: ClientStatus;
  
  // Acesso individual da Área do Cliente
  hasPortalAccess: boolean;
  password?: string;
  lastLoginAt?: string;

  // Preferências e notas
  notes?: string;
  preferences?: string;
  allergies?: string;
  favoriteServiceIds?: string[];

  // Métricas
  totalSpent: number;
  lastVisit?: string;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus = 
  | 'aguardando' 
  | 'confirmado' 
  | 'em_atendimento' 
  | 'concluido' 
  | 'cancelado';

export interface RescheduleRecord {
  previousDate: string;
  previousStartTime: string;
  previousEndTime: string;
  rescheduledAt: string;
  reason?: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  professionalId: string;
  professionalName: string;
  serviceIds: string[];
  serviceNames: string[];
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  totalDuration: number; // minutes
  totalPrice: number; // BRL
  status: AppointmentStatus;
  paymentStatus?: 'pago' | 'pendente' | 'cancelado';
  paymentMethod?: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro';
  notes?: string;
  cancellationReason?: string;
  rescheduleHistory?: RescheduleRecord[];
  createdAt: string;
  updatedAt: string;
}

export type AbsenceType = 'folga' | 'intervalo' | 'almoco' | 'ferias' | 'curso' | 'outro';

export interface ProfessionalAbsence {
  id: string;
  professionalId: string;
  professionalName: string;
  type: AbsenceType;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm (if not all day)
  endTime?: string; // HH:mm (if not all day)
  allDay: boolean;
  notes?: string;
}

// ----------------------------------------------------
// PRODUTOS, ESTOQUE, FORNECEDORES E PEDIDOS
// ----------------------------------------------------

export type ProductStatus = 'ativo' | 'inativo';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number; // Preço de venda
  costPrice: number; // Custo de aquisição
  stock: number; // Quantidade atual em estoque
  minStock: number; // Alerta de estoque baixo
  maxStock?: number;
  imageUrl: string;
  videoUrl?: string;
  barcode?: string;
  supplierId?: string;
  supplierName?: string;
  status: ProductStatus;
  salesCount: number; // Quantidade total vendida
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  cnpj?: string;
  categories: string[];
  notes?: string;
  createdAt: string;
}

export type StockMovementType = 'entrada' | 'saida' | 'venda' | 'ajuste';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  date: string; // ISO
  performedBy: string;
  unitCost?: number;
  orderId?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  costPrice: number;
  quantity: number;
  imageUrl?: string;
}

export type OrderPaymentStatus = 'pago' | 'pendente' | 'cancelado';

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  items: OrderItem[];
  totalAmount: number;
  totalCost: number;
  paymentMethod: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro';
  paymentStatus: OrderPaymentStatus;
  stockDeducted: boolean;
  date: string; // YYYY-MM-DD
  createdAt: string;
  notes?: string;
}

// ----------------------------------------------------
// FINANCEIRO, DESPESAS, FLUXO DE CAIXA E PAGAMENTOS
// ----------------------------------------------------

export type ExpenseCategory = 
  | 'aluguel' 
  | 'produtos' 
  | 'comissao' 
  | 'energia_agua' 
  | 'marketing' 
  | 'manutencao' 
  | 'impostos' 
  | 'salarios' 
  | 'outros';

export type ExpenseStatus = 'paga' | 'pendente' | 'vencida';

export type FinancialPaymentMethod = 
  | 'pix' 
  | 'cartao_credito' 
  | 'cartao_debito' 
  | 'dinheiro' 
  | 'boleto' 
  | 'transferencia';

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  paymentDate?: string; // YYYY-MM-DD
  status: ExpenseStatus;
  supplierId?: string;
  supplierName?: string;
  isRecurring?: boolean;
  recurrenceInterval?: 'mensal' | 'anual' | 'semanal';
  paymentMethod?: FinancialPaymentMethod;
  notes?: string;
  receiptNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialTransaction {
  id: string;
  type: 'receita' | 'despesa';
  origin: 'servico' | 'produto' | 'despesa_avulsa' | 'comissao';
  referenceId?: string; // appointmentId, orderId, or expenseId
  description: string;
  category: string;
  amount: number;
  cost?: number; // Custo de aquisição do produto ou comissão
  date: string; // YYYY-MM-DD
  paymentMethod: FinancialPaymentMethod;
  paymentStatus: 'pago' | 'pendente' | 'cancelado' | 'estornado';
  clientOrRecipientName?: string;
  professionalId?: string;
  professionalName?: string;
  createdAt: string;
}

export interface ProfessionalCommission {
  id: string;
  appointmentId: string;
  professionalId: string;
  professionalName: string;
  clientName: string;
  serviceNames: string[];
  servicePrice: number;
  commissionRate: number; // ex: 50%
  commissionAmount: number;
  date: string; // YYYY-MM-DD
  status: 'pendente' | 'pago';
  paidAt?: string;
  paymentMethod?: FinancialPaymentMethod;
  expenseId?: string; // reference to expense created when paid
}

export interface PixConfig {
  keyType: 'cnpj' | 'cpf' | 'email' | 'telefone' | 'aleatoria';
  key: string;
  receiverName: string;
  receiverCity: string;
  postalCode?: string;
  gatewayProvider: 'manual' | 'mercadopago' | 'asaas' | 'inter' | 'gerencianet';
  autoWebhookEnabled: boolean;
  webhookSecret: string;
  webhookEndpoint: string;
}

export interface PixWebhookLog {
  id: string;
  timestamp: string;
  event: string;
  txid: string;
  amount: number;
  senderName?: string;
  status: 'processado' | 'erro' | 'ignorado';
  payloadSummary: string;
}

export interface PixCharge {
  txid: string;
  amount: number;
  description: string;
  clientName: string;
  referenceType: 'servico' | 'produto' | 'avulso';
  referenceId?: string;
  brCode: string;
  qrCodeDataUrl: string;
  status: 'pendente' | 'pago' | 'expirado';
  createdAt: string;
  expiresAt: string;
  paidAt?: string;
  endToEndId?: string;
}

// ----------------------------------------------------
// CHAT INTEGRADO
// ----------------------------------------------------
export type ChatParticipantType = 'cliente' | 'profissional' | 'admin' | 'dono';
export type MessageStatus = 'enviada' | 'entregue' | 'lida';

export interface ChatAttachment {
  id: string;
  url: string; // data url or image link
  name: string;
  type: 'image' | 'file';
  sizeFormatted?: string;
  mimeType?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string; // 'admin-luxe', 'dono-luxe', client.id, or professional.id
  senderName: string;
  senderRole: ChatParticipantType;
  senderPhotoUrl?: string;
  recipientId: string;
  content: string;
  attachment?: ChatAttachment;
  status: MessageStatus;
  timestamp: string; // ISO
}

export interface ChatConversation {
  id: string;
  type: 'cliente' | 'profissional';
  assignedType?: 'recepcao_adm' | 'profissional_direto';
  assignedProfessionalId?: string;
  assignedProfessionalName?: string;
  takenOverByAdmin?: boolean;
  takenOverByRole?: 'admin' | 'dono';
  participantId: string;
  participantName: string;
  participantPhone?: string;
  participantWhatsapp?: string;
  participantEmail?: string;
  participantPhotoUrl?: string;
  participantRoleDescription?: string;
  lastMessage?: string;
  lastMessageTimestamp?: string;
  unreadCountAdmin: number;
  unreadCountParticipant: number;
  unreadCountProfessional?: number;
  isOnline?: boolean;
  notes?: string;
  updatedAt: string;
}

export interface QuickReply {
  id: string;
  title: string;
  shortcut: string;
  content: string;
  category: 'agendamento' | 'atendimento' | 'equipe' | 'informacoes';
}

// ----------------------------------------------------
// VITRINE DIGITAL
// ----------------------------------------------------
export type ShowcaseCategory = 'cabelo' | 'barba' | 'unhas' | 'estetica' | 'maquiagem';

export interface ShowcaseBanner {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  badge?: string; // ex: "Exclusivo", "Destaque", "Promoção"
  imageUrl: string;
  videoUrl?: string;
  ctaText: string;
  ctaAction: 'agendar' | 'produtos' | 'servicos' | 'link';
  ctaLink?: string;
  order: number;
  published: boolean;
  createdAt: string;
}

export interface ShowcaseGalleryItem {
  id: string;
  title: string;
  category: 'ambiente' | 'equipe' | 'procedimentos' | 'espaco_vip';
  imageUrl: string;
  videoUrl?: string;
  caption?: string;
  order: number;
  published: boolean;
  createdAt: string;
}

export interface ShowcaseBeforeAfter {
  id: string;
  title: string;
  category: ShowcaseCategory;
  serviceName: string;
  professionalName?: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  description: string;
  order: number;
  published: boolean;
  createdAt: string;
}

export interface ShowcaseTestimonial {
  id: string;
  clientName: string;
  clientPhotoUrl?: string;
  rating: number; // 1 to 5
  comment: string;
  serviceOrProduct: string;
  date: string; // YYYY-MM-DD
  verified: boolean;
  published: boolean;
}
