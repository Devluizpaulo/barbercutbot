
import { faker } from '@faker-js/faker/locale/pt_BR';

export type Shop = {
  id: string;
  name: string;
  address: string;
  ownerId: string;
  status: 'active' | 'inactive';
};

export type User = {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'owner';
    shopId?: string;
};

export type Ticket = {
    id: string;
    shopId: string;
    subject: string;
    status: 'Aberto' | 'Em Andamento' | 'Fechado';
    lastUpdate: Date;
}

// Mocked Users
export const users: User[] = [
  { id: 'user-1', name: 'Admin', email: 'admin@bbr.com', role: 'admin' },
  { id: 'user-2', name: 'João Silva', email: 'joao@bbr.com', role: 'owner', shopId: 'shop-1' },
  { id: 'user-3', name: 'Maria Souza', email: 'maria@bbr.com', role: 'owner', shopId: 'shop-2' },
];

// Mocked Shops
export const shops: Shop[] = [
  {
    id: 'shop-1',
    name: 'Barbearia Clássica',
    address: 'Rua das Flores, 123',
    ownerId: 'user-2',
    status: 'active',
  },
  {
    id: 'shop-2',
    name: 'Navalha de Ouro',
    address: 'Avenida Principal, 456',
    ownerId: 'user-3',
    status: 'active',
  },
   {
    id: 'shop-3',
    name: 'The Gentlemen\'s Cut',
    address: 'Praça Central, 789',
    ownerId: 'user-4',
    status: 'inactive',
  },
];

// Mocked Tickets
export const tickets: Ticket[] = [
    { id: 'ticket-1', shopId: 'shop-1', subject: 'Problema com fatura de Maio', status: 'Aberto', lastUpdate: faker.date.recent({ days: 1 }) },
    { id: 'ticket-2', shopId: 'shop-2', subject: 'Dúvida sobre integração com Google Agenda', status: 'Em Andamento', lastUpdate: faker.date.recent({ days: 2}) },
    { id: 'ticket-3', shopId: 'shop-1', subject: 'Erro ao adicionar novo cliente', status: 'Fechado', lastUpdate: faker.date.recent({ days: 10}) },
]
