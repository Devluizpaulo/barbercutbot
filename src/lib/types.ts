
import { Timestamp } from 'firebase/firestore';

export type BarberShop = {
  id: string;
  name: string;
  ownerId: string;
  address?: string;
  phone?: string;
  email?: string;
};

export type Appointment = {
  id: string;
  barberShopId: string;
  customerId: string; // Should reference a document in the Customers collection
  barberId: string; // Should reference a document in the Barbers collection
  serviceIds: string[]; // Should reference documents in the Services collection
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
  duration: number; // in minutes
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
