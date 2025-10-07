
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
  customerId: string;
  barberId: string;
  startTime: string; // Stored as ISO string or Firestore Timestamp string
  endTime: string;   // Stored as ISO string or Firestore Timestamp string
  serviceIds: string[];
  notes?: string;
  createdAt: string; // Stored as ISO string or Firestore Timestamp string
  price?: number;
};

export type Customer = {
  id: string;
  barberShopId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: Date;
};

export type Barber = {
  id: string;
  barberShopId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  bio?: string;
  createdAt: Date;
};

export type Service = {
  id: string;
  barberShopId: string;
  name: string;
  description?: string;
  price: number;
  duration: number; // in minutes
  createdAt: Date;
};

export type FinancialRecord = {
  id: string;
  barberShopId: string;
  date: Date;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  createdAt: Date;
};

export type UserProfile = {
  id: string; // This is the Firebase UID
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
};
