
import { addDays, format, subDays, subHours, subMinutes, startOfToday, addMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  role: 'admin' | 'owner';
};

export const users: User[] = [
    { id: 'user-1', firstName: 'Admin', lastName: 'SaaS', email: 'admin@barbersaas.com', avatar: 'https://picsum.photos/seed/admin-avatar/100/100', role: 'admin' },
    { id: 'user-2', firstName: 'João', lastName: 'Silva', email: 'joao.silva@example.com', avatar: 'https://picsum.photos/seed/user-avatar-1/100/100', role: 'owner' },
    { id: 'user-3', firstName: 'Maria', lastName: 'Oliveira', email: 'maria.oliveira@example.com', avatar: 'https://picsum.photos/seed/user-avatar-2/100/100', role: 'owner' },
];


export type Shop = {
  id: string;
  name: string;
  location: string;
  owner: string;
  todayAppointments: number;
  totalClients: number;
  status: 'Ativo' | 'Inativo';
  plan: 'Básico' | 'Pro' | 'Premium';
  totalRevenue: number;
  paymentStatus: 'Pago' | 'Pendente' | 'Vencido';
  planDueDate: string;
  openTickets: number;
};

export const shops: Shop[] = [
  { id: 'shop-1', name: 'Corte Clássico', location: 'Centro, SP', owner: 'João da Silva', todayAppointments: 5, totalClients: 124, status: 'Ativo', plan: 'Pro', totalRevenue: 5250.00, paymentStatus: 'Pago', planDueDate: '15/08/2024', openTickets: 0 },
  { id: 'shop-2', name: 'Barbearia Moderna', location: 'Zona Sul, RJ', owner: 'Maria Oliveira', todayAppointments: 8, totalClients: 250, status: 'Ativo', plan: 'Premium', totalRevenue: 8900.50, paymentStatus: 'Pago', planDueDate: '20/08/2024', openTickets: 1 },
  { id: 'shop-3', name: 'Escolha do Cavalheiro', location: 'Belo Horizonte, MG', owner: 'Carlos Pereira', todayAppointments: 12, totalClients: 480, status: 'Ativo', plan: 'Premium', totalRevenue: 12300.00, paymentStatus: 'Pendente', planDueDate: '05/08/2024', openTickets: 0 },
  { id: 'shop-4', name: 'O Ponto do Barbeiro', location: 'Curitiba, PR', owner: 'Ana Souza', todayAppointments: 3, totalClients: 89, status: 'Inativo', plan: 'Básico', totalRevenue: 2100.75, paymentStatus: 'Vencido', planDueDate: '25/07/2024', openTickets: 2 },
];

export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastVisit: string;
  totalSpent: number;
};

// predictable number generator
const pseudoRandom = (seed: number) => {
    let value = (seed * 9301 + 49297) % 233280;
    return value / 233280;
};

export const clients: Client[] = Array.from({ length: 25 }, (_, i) => ({
  id: `client-${i + 1}`,
  name: `Cliente ${i + 1}`,
  email: `cliente${i + 1}@example.com`,
  phone: `(11) 98765-43${String(i).padStart(2, '0')}`,
  lastVisit: format(new Date(2023, 10, 15 - i), 'dd/MM/yyyy', { locale: ptBR }),
  totalSpent: Math.round(pseudoRandom(i + 1) * 2000 + 50),
}));

export type Appointment = {
  id: string;
  clientName: string;
  service: string;
  barber: string;
  dateTime: Date;
  status: 'Confirmado' | 'Concluído' | 'Cancelado';
};

const today = startOfToday();
export const appointments: Appointment[] = [
  { id: 'apt-1', clientName: 'Miguel Silva', service: 'Corte + Barba', barber: 'Carlos Alberto', dateTime: subHours(today, 2), status: 'Concluído' },
  { id: 'apt-2', clientName: 'Arthur Costa', service: 'Degradê', barber: 'Roberto Almeida', dateTime: subHours(today, 1), status: 'Concluído' },
  { id: 'apt-3', clientName: 'Helena Santos', service: 'Corte', barber: 'Fernanda Lima', dateTime: addMinutes(today, 30), status: 'Confirmado' },
  { id: 'apt-4', clientName: 'Bernardo Lima', service: 'Corte Americano', barber: 'Carlos Alberto', dateTime: addDays(today, 1), status: 'Confirmado' },
  { id: 'apt-5', clientName: 'Sophia Pereira', service: 'Penteado', barber: 'Fernanda Lima', dateTime: addDays(today, 1), status: 'Confirmado' },
  { id: 'apt-6', clientName: 'Davi Ferreira', service: 'Corte + Barba', barber: 'Roberto Almeida', dateTime: addDays(today, 2), status: 'Confirmado' },
];


export type Transaction = {
    id: string;
    date: string; // "dd/MM/yyyy"
    description: string;
    type: 'Receita' | 'Despesa';
    amount: number;
    category: string;
    paymentMethod?: string;
};
  
const incomeCategories = ['Venda de Serviço', 'Venda de Produto', 'Outros'];
const expenseCategories = ['Aluguel', 'Salários', 'Fornecedores', 'Marketing', 'Contas (Água, Luz, etc.)', 'Outros'];
const paymentMethods = ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Pix'];

export const transactions: Transaction[] = Array.from({ length: 150 }, (_, i) => {
    const isIncome = (pseudoRandom(i) > 0.3); // More income than expense
    const type = isIncome ? 'Receita' : 'Despesa';
    const amount = isIncome
        ? Math.round(pseudoRandom(i + 1) * 100 + 20)
        : Math.round(pseudoRandom(i + 1) * 200 + 10);
    const description = isIncome
        ? `Serviço - Cliente ${Math.floor(pseudoRandom(i + 5) * 10) + 1}`
        : `Compra de Suprimentos ${i+1}`;
    
    const category = isIncome
        ? incomeCategories[i % incomeCategories.length]
        : expenseCategories[i % expenseCategories.length];
        
    const paymentMethod = isIncome
        ? paymentMethods[i % paymentMethods.length]
        : undefined;

    return {
        id: `txn-${i + 1}`,
        date: format(subDays(today, Math.floor(i / 2)), 'dd/MM/yyyy', { locale: ptBR }),
        description,
        type,
        amount,
        category,
        paymentMethod,
    };
});


export const monthlyRevenue = [
  { month: "Janeiro", income: 4230, expense: 2100 },
  { month: "Fevereiro", income: 3890, expense: 2200 },
  { month: "Março", income: 4500, expense: 2300 },
  { month: "Abril", income: 4880, expense: 2500 },
  { month: "Maio", income: 5120, expense: 2400 },
  { month: "Junho", income: 5500, expense: 2600 },
  { month: "Julho", income: 5300, expense: 2550 },
  { month: "Agosto", income: 5800, expense: 2700 },
  { month: "Setembro", income: 6100, expense: 2800 },
  { month: "Outubro", income: 6500, expense: 2900 },
  { month: "Novembro", income: 7200, expense: 3100 },
  { month: "Dezembro", income: 8000, expense: 3500 },
];

export const revenueByService = [
    { name: 'Corte + Barba', revenue: 3200 },
    { name: 'Degradê', revenue: 2400 },
    { name: 'Corte de Cabelo', revenue: 1800 },
    { name: 'Barba', revenue: 1200 },
    { name: 'Pintura', revenue: 800 },
];

export const revenueByPaymentMethod = [
    { method: 'Pix', revenue: 4500 },
    { method: 'Crédito', revenue: 2800 },
    { method: 'Débito', revenue: 1500 },
    { method: 'Dinheiro', revenue: 1200 },
];

export type Barber = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  avatar: string;
};

export const barbers: Barber[] = [
    { id: 'barber-1', firstName: 'Carlos', lastName: 'Alberto', email: 'carlos.alberto@example.com', phone: '(11) 91111-1111', bio: 'Especialista em cortes clássicos e barba.', avatar: 'https://picsum.photos/seed/barber-1/100/100' },
    { id: 'barber-2', firstName: 'Roberto', lastName: 'Almeida', email: 'roberto.almeida@example.com', phone: '(11) 92222-2222', bio: 'Focado em tendências modernas e degradês.', avatar: 'https://picsum.photos/seed/barber-2/100/100' },
    { id: 'barber-3', firstName: 'Fernanda', lastName: 'Lima', email: 'fernanda.lima@example.com', phone: '(11) 93333-3333', bio: 'Especialista em coloração e penteados.', avatar: 'https://picsum.photos/seed/barber-3/100/100' },
];

export type Service = {
    id: string;
    name: string;
    description: string;
    price: number;
    cost: number;
    duration: number; // in minutes
    imageUrl: string;
    isCommissionEnabled?: boolean;
    commissionType?: 'fixed' | 'percentage';
    commissionValue?: number;
};

export const services: Service[] = [
    { id: 'service-1', name: 'Corte de Cabelo', description: 'Corte clássico ou moderno, na tesoura ou máquina.', price: 50, cost: 10, duration: 30, imageUrl: 'https://picsum.photos/seed/haircut/200/200' },
    { id: 'service-2', name: 'Barba', description: 'Modelagem e aparo da barba com toalha quente.', price: 35, cost: 5, duration: 25, imageUrl: 'https://picsum.photos/seed/beard/200/200' },
    { id: 'service-3', name: 'Corte + Barba', description: 'Pacote completo de corte de cabelo e barba.', price: 80, cost: 15, duration: 55, imageUrl: 'https://picsum.photos/seed/haircut-beard/200/200' },
    { id: 'service-4', name: 'Degradê', description: 'Corte com efeito degradê (fade) preciso.', price: 60, cost: 12, duration: 40, imageUrl: 'https://picsum.photos/seed/fade/200/200' },
    { id: 'service-5', name: 'Pintura Capilar', description: 'Coloração completa do cabelo.', price: 120, cost: 40, duration: 60, imageUrl: 'https://picsum.photos/seed/hair-color/200/200' },
];

export type Supplier = {
    id: string;
    name: string;
    contactPerson: string;
    phone: string;
    category: string;
    notes: string;
};

export const suppliers: Supplier[] = [
    { id: 'supplier-1', name: 'Cosméticos Pro', contactPerson: 'Fernanda Costa', phone: '(11) 98888-1111', category: 'Produtos de Cabelo', notes: 'Entrega rápida, sempre às terças. Ótimos preços em pomadas.' },
    { id: 'supplier-2', name: 'Lâminas & Cia', contactPerson: 'Ricardo Alves', phone: '(21) 97777-2222', category: 'Equipamentos', notes: 'Fornecedor principal de lâminas e navalhas. Pedir com 1 semana de antecedência.' },
    { id: 'supplier-3', name: 'Toalhas & Uniformes', contactPerson: 'Beatriz Martins', phone: '(31) 96666-3333', category: 'Uniformes', notes: 'Uniformes personalizados. Boa qualidade, mas prazo de entrega longo.' },
];

export type Ticket = {
    id: string;
    shopId: string;
    subject: string;
    status: 'Aberto' | 'Em Andamento' | 'Fechado';
    lastUpdate: Date;
    priority: 'Baixa' | 'Média' | 'Alta';
};

export const tickets: Ticket[] = [
    { id: 'ticket-1', shopId: 'shop-2', subject: 'Problema com fatura de Julho', status: 'Aberto', lastUpdate: subDays(today, 1), priority: 'Alta' },
    { id: 'ticket-2', shopId: 'shop-4', subject: 'Dúvida sobre integração com Google Agenda', status: 'Em Andamento', lastUpdate: subHours(today, 3), priority: 'Média' },
    { id: 'ticket-3', shopId: 'shop-4', subject: 'Sugestão: adicionar novo tipo de relatório', status: 'Aberto', lastUpdate: subDays(today, 2), priority: 'Baixa' },
    { id: 'ticket-4', shopId: 'shop-3', subject: 'Erro ao adicionar novo cliente', status: 'Fechado', lastUpdate: subDays(today, 5), priority: 'Média' },
];
    
