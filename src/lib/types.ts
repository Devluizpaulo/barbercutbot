

import { Timestamp } from 'firebase/firestore';

export type WorkingHour = {
  day: string;
  open: string;
  close: string;
  enabled: boolean;
};

export type Holiday = {
    date: Timestamp | Date | string;
    description: string;
    isClosed: boolean;
    openingTime?: string;
    closingTime?: string;
}

export type PaymentMethod = {
  method: 'money' | 'pix' | 'debit' | 'credit';
  enabled: boolean;
  rate?: number; // Taxa em porcentagem
};

export type BarberShop = {
  id: string;
  name: string;
  ownerId: string;
  logo?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  phone?: string;
  email?: string;
  document?: string;
  contactPerson?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  status?: 'active' | 'inactive';
  workingHours?: WorkingHour[];
  holidays?: Holiday[];
  createdAt?: Timestamp;
  subscription?: {
    plan: 'free' | 'pro';
    status: 'active' | 'trialing' | 'past_due' | 'canceled';
    mercadoPagoId?: string;
    currentPeriodEnd?: Timestamp;
  },
  paymentSettings?: PaymentMethod[];
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

export type BarberServiceCommission = {
    serviceId: string;
    commissionType?: 'fixed' | 'percentage';
    commissionValue?: number;
}

export type Barber = {
  id: string;
  barberShopId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  bio?: string;
  avatar?: string;
  services: BarberServiceCommission[];
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

    








