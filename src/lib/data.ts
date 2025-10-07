
import { addDays, format, subDays, subHours, subMinutes } from "date-fns";
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
};

export const shops: Shop[] = [
  { id: 'shop-1', name: 'Corte Clássico', location: 'Centro, SP', owner: 'João da Silva', todayAppointments: 5, totalClients: 124, status: 'Ativo', plan: 'Pro', totalRevenue: 5250.00 },
  { id: 'shop-2', name: 'Barbearia Moderna', location: 'Zona Sul, RJ', owner: 'Maria Oliveira', todayAppointments: 8, totalClients: 250, status: 'Ativo', plan: 'Premium', totalRevenue: 8900.50 },
  { id: 'shop-3', name: 'Escolha do Cavalheiro', location: 'Belo Horizonte, MG', owner: 'Carlos Pereira', todayAppointments: 12, totalClients: 480, status: 'Ativo', plan: 'Premium', totalRevenue: 12300.00 },
  { id: 'shop-4', name: 'O Ponto do Barbeiro', location: 'Curitiba, PR', owner: 'Ana Souza', todayAppointments: 3, totalClients: 89, status: 'Inativo', plan: 'Básico', totalRevenue: 2100.75 },
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

const staticDate = new Date(2024, 6, 20, 12, 0, 0); // Use a fixed date

export const appointments: Appointment[] = [
  { id: 'apt-1', clientName: 'Miguel Silva', service: 'Corte + Barba', barber: 'Carlos Alberto', dateTime: subHours(staticDate, 2), status: 'Concluído' },
  { id: 'apt-2', clientName: 'Arthur Costa', service: 'Degradê', barber: 'Roberto Almeida', dateTime: subHours(staticDate, 1), status: 'Concluído' },
  { id: 'apt-3', clientName: 'Helena Santos', service: 'Corte', barber: 'Fernanda Lima', dateTime: staticDate, status: 'Confirmado' },
  { id: 'apt-4', clientName: 'Bernardo Lima', service: 'Corte Americano', barber: 'Carlos Alberto', dateTime: addDays(staticDate, 1), status: 'Confirmado' },
  { id: 'apt-5', clientName: 'Sophia Pereira', service: 'Penteado', barber: 'Fernanda Lima', dateTime: addDays(staticDate, 1), status: 'Confirmado' },
  { id: 'apt-6', clientName: 'Davi Ferreira', service: 'Corte + Barba', barber: 'Roberto Almeida', dateTime: addDays(staticDate, 2), status: 'Confirmado' },
];

export type Transaction = {
  id: string;
  date: string;
  description: string;
  type: 'Receita' | 'Despesa';
  amount: number;
};

export const transactions: Transaction[] = Array.from({ length: 30 }, (_, i) => {
    // Use a predictable pattern instead of Math.random()
    const isIncome = (i % 3) !== 0; 
    const type = isIncome ? 'Receita' : 'Despesa';
    const amount = isIncome
        ? Math.round(pseudoRandom(i + 1) * 100 + 20)
        : Math.round(pseudoRandom(i + 1) * 200 + 10);
    const description = isIncome
        ? `Serviço - Cliente ${Math.floor(pseudoRandom(i + 1) * 10) + 1}`
        : `Compra de Suprimentos ${i+1}`;

    return {
        id: `txn-${i + 1}`,
        date: format(subDays(new Date(2024, 6, 20), i), 'dd/MM/yyyy', { locale: ptBR }),
        description,
        type,
        amount,
    };
});


export const monthlyRevenue = [
  { month: "Jan", revenue: 4230 },
  { month: "Fev", revenue: 3890 },
  { month: "Mar", revenue: 4500 },
  { month: "Abr", revenue: 4880 },
  { month: "Mai", revenue: 5120 },
  { month: "Jun", revenue: 5500 },
];
