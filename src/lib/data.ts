
import { addDays, format, subDays, subHours, subMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";

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

export const clients: Client[] = Array.from({ length: 25 }, (_, i) => ({
  id: `client-${i + 1}`,
  name: `Cliente ${i + 1}`,
  email: `cliente${i + 1}@example.com`,
  phone: `(11) 98765-43${String(i).padStart(2, '0')}`,
  lastVisit: format(subDays(new Date(), Math.random() * 100), 'dd/MM/yyyy', { locale: ptBR }),
  totalSpent: Math.round(Math.random() * 2000 + 50),
}));

export type Appointment = {
  id: string;
  clientName: string;
  service: string;
  barber: string;
  dateTime: Date;
  status: 'Confirmado' | 'Concluído' | 'Cancelado';
};

const now = new Date();
export const appointments: Appointment[] = [
  { id: 'apt-1', clientName: 'Miguel Silva', service: 'Corte + Barba', barber: 'Carlos Alberto', dateTime: subHours(now, 2), status: 'Concluído' },
  { id: 'apt-2', clientName: 'Arthur Costa', service: 'Degradê', barber: 'Roberto Almeida', dateTime: subHours(now, 1), status: 'Concluído' },
  { id: 'apt-3', clientName: 'Helena Santos', service: 'Corte', barber: 'Fernanda Lima', dateTime: addDays(now, 0), status: 'Confirmado' },
  { id: 'apt-4', clientName: 'Bernardo Lima', service: 'Corte Americano', barber: 'Carlos Alberto', dateTime: addDays(now, 1), status: 'Confirmado' },
  { id: 'apt-5', clientName: 'Sophia Pereira', service: 'Penteado', barber: 'Fernanda Lima', dateTime: addDays(now, 1), status: 'Confirmado' },
  { id: 'apt-6', clientName: 'Davi Ferreira', service: 'Corte + Barba', barber: 'Roberto Almeida', dateTime: addDays(now, 2), status: 'Confirmado' },
];

export type Transaction = {
  id: string;
  date: string;
  description: string;
  type: 'Receita' | 'Despesa';
  amount: number;
};

export const transactions: Transaction[] = Array.from({ length: 30 }, (_, i) => {
    const type = Math.random() > 0.3 ? 'Receita' : 'Despesa';
    return {
        id: `txn-${i + 1}`,
        date: format(subDays(new Date(), i), 'dd/MM/yyyy', { locale: ptBR }),
        description: type === 'Receita' ? `Serviço - Cliente ${Math.floor(Math.random() * 10) + 1}` : `Compra de Suprimentos ${i+1}`,
        type: type,
        amount: type === 'Receita' ? Math.round(Math.random() * 100 + 20) : Math.round(Math.random() * 200 + 10),
    }
});

export const monthlyRevenue = [
  { month: "Jan", revenue: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Fev", revenue: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Mar", revenue: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Abr", revenue: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Mai", revenue: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Jun", revenue: Math.floor(Math.random() * 5000) + 1000 },
];
