

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

export type CashierOperator = {
  id: string;
  name: string;
  role: 'caixa' | 'gerente';
  pin?: string; // 4-digit PIN stored securely
};

export type ChecklistItem = {
    id: string;
    label: string;
    required: boolean;
};

export type CashierSettings = {
  requirePassword: boolean;
  openingChecklist: ChecklistItem[];
  closingChecklist: ChecklistItem[];
  operators?: CashierOperator[];
};

export type RolePermissions = {
    viewDashboard: boolean;
    manageAppointments: boolean;
    manageClients: boolean;
    manageTeam: boolean;
    manageServices: boolean;
    viewFinancial: boolean;
    manageSettings: boolean;
}

export type Role = {
  id: string;
  name: string;
  isBuiltIn: boolean;
  permissions: RolePermissions;
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
  paymentSettings?: PaymentMethod[];
  cashierSettings?: CashierSettings;
  roles?: Role[];
  createdAt?: Timestamp;
  subscription?: {
    plan: 'free' | 'pro';
    status: 'active' | 'trialing' | 'past_due' | 'canceled';
    mercadoPagoId?: string;
    currentPeriodEnd?: Timestamp;
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

export type AppointmentItem = {
    serviceId: string;
    barberId: string;
    price: number;
    duration: number;
};

export type Appointment = {
  id: string;
  barberShopId: string;
  customerId: string;
  items: AppointmentItem[];
  startTime: Timestamp | Date | string;
  endTime: Timestamp | Date | string;
  totalPrice?: number;
  totalDuration?: number;
  notes?: string;
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
  email?: string;
  phone?: string;
  whatsapp?: string;
  bio?: string;
  avatar?: string;
  color?: string;
  services: BarberServiceCommission[];
  // Address fields
  cep?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  createdAt: Timestamp;
};

export type TeamMember = {
  id: string;
  barberShopId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: string; // This will be the ID of a role in BarberShop.roles
  userId?: string; // Link to the main User document if they have a login
  createdAt: Timestamp;
};

export type SaleItem = {
    id: string;
    name: string;
    price: number;
    quantity: number;
    type: 'service' | 'product';
    barberId?: string; // Optional, for service commissions
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

export type Product = {
  id: string;
  barberShopId: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  stockQuantity: number;
  sku?: string;
  imageUrl?: string;
  ativo?: boolean;
  createdAt: Timestamp;
}

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
  appointmentId?: string;
  operatorId?: string; // ID of the CashierOperator
  items?: SaleItem[];
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
  role: 'owner' | 'admin';
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

    
