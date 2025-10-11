

import { Timestamp } from 'firebase/firestore';

export type WorkingHour = {
  day: string;
  open: string;
  close: string;
  enabled: boolean;
};

export type BarberShop = {
  id: string;
  name: string;
  ownerId: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  cep?: string;
  phone?: string;
  email?: string;
  document?: string;
  status?: 'active' | 'inactive';
  workingHours?: WorkingHour[];
  createdAt?: Timestamp;
  subscription?: {
    plan: 'free' | 'pro';
    status: 'active' | 'trialing' | 'past_due' | 'canceled';
    mercadoPagoId?: string;
    currentPeriodEnd?: Timestamp;
  },
  paymentGateways?: {
    mercadoPago?: {
      publicKey?: string;
      accessToken?: string;
    }
  },
  whatsapp?: {
    instanceId: string;
    status?: string;
    numeroConectado?: string;
  },
  bot?: {
    provider: string;
    modelo: string;
    temperatura: number;
    ativo: boolean;
    promptPersonalizado: string;
  }
};

export type Appointment = {
  id: string;
  barberShopId: string;
  customerId: string;
  barberId: string;
  serviceIds: string[];
  startTime: Timestamp | Date | string;
  endTime: Timestamp | Date | string;
  notes?: string;
  price?: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  createdAt: Timestamp;
};

export type Customer = {
  id: string;
  barberShopId: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  notes?: string;
  cep?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  createdAt: Timestamp;
};

export type Barber = {
  id: string;
  barberShopId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  bio?: string;
  avatar?: string;
  createdAt: Timestamp;
};

export type Service = {
  id: string;
  barberShopId: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  duration: number; // in minutes
  imageUrl?: string;
  ativo?: boolean;
  partnership?: {
    isCommissionEnabled?: boolean;
    commissionType?: 'fixed' | 'percentage';
    commissionValue?: number;
  };
  createdAt: Timestamp;
};

export type FinancialRecord = {
  id: string;
  barberShopId: string;
  date: Timestamp | Date | string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category: string;
  paymentMethod?: string;
  isRecurring?: boolean;
  createdAt: Timestamp;
};

export type Supplier = {
  id: string;
  barberShopId: string;
  name: string;
  contactPerson?: string;
  phone: string;
  category: string;
  notes?: string;
  createdAt: Timestamp;
};


export type UserProfile = {
  id: string; // This is the Firebase UID
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Timestamp;
};

export type Ticket = {
    id: string;
    shopId: string;
    userId: string;
    subject: string;
    description: string;
    status: 'Aberto' | 'Em Andamento' | 'Fechado';
    createdAt: Timestamp;
    lastUpdatedAt: Timestamp;
};

export type Document = {
  id: string;
  title: string;
  content: string;
  status: 'Rascunho' | 'Publicado';
  createdAt: Timestamp;
  lastUpdatedAt: Timestamp;
};

    

