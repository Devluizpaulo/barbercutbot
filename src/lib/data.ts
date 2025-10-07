import { addDays, format, subDays, subHours, subMinutes } from "date-fns";

export type Shop = {
  id: string;
  name: string;
  location: string;
  owner: string;
  todayAppointments: number;
  totalClients: number;
};

export const shops: Shop[] = [
  { id: 'shop-1', name: 'The Classic Cut', location: 'Downtown, CA', owner: 'John Doe', todayAppointments: 5, totalClients: 124 },
  { id: 'shop-2', name: 'Modern Edge Barbers', location: 'Uptown, NY', owner: 'Jane Smith', todayAppointments: 8, totalClients: 250 },
  { id: 'shop-3', name: 'Gentleman\'s Choice', location: 'Beverly Hills, CA', owner: 'Mike Ross', todayAppointments: 12, totalClients: 480 },
  { id: 'shop-4', name: 'The Dapper Den', location: 'Austin, TX', owner: 'Sarah Connor', todayAppointments: 3, totalClients: 89 },
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
  name: `Client ${i + 1}`,
  email: `client${i + 1}@example.com`,
  phone: `(555) 555-55${String(i).padStart(2, '0')}`,
  lastVisit: format(subDays(new Date(), Math.random() * 100), 'yyyy-MM-dd'),
  totalSpent: Math.round(Math.random() * 2000 + 50),
}));

export type Appointment = {
  id: string;
  clientName: string;
  service: string;
  barber: string;
  dateTime: Date;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
};

const now = new Date();
export const appointments: Appointment[] = [
  { id: 'apt-1', clientName: 'Michael Scott', service: 'Haircut + Beard Trim', barber: 'Dwight Schrute', dateTime: subHours(now, 2), status: 'Completed' },
  { id: 'apt-2', clientName: 'Jim Halpert', service: 'Fade', barber: 'Andy Bernard', dateTime: subHours(now, 1), status: 'Completed' },
  { id: 'apt-3', clientName: 'Pam Beesly', service: 'Haircut', barber: 'Phyllis Vance', dateTime: addDays(now, 0), status: 'Confirmed' },
  { id: 'apt-4', clientName: 'Kevin Malone', service: 'Buzz Cut', barber: 'Dwight Schrute', dateTime: addDays(now, 1), status: 'Confirmed' },
  { id: 'apt-5', clientName: 'Angela Martin', service: 'Hair Styling', barber: 'Phyllis Vance', dateTime: addDays(now, 1), status: 'Confirmed' },
  { id: 'apt-6', clientName: 'Oscar Martinez', service: 'Haircut + Beard Trim', barber: 'Andy Bernard', dateTime: addDays(now, 2), status: 'Confirmed' },
];

export type Transaction = {
  id: string;
  date: string;
  description: string;
  type: 'Income' | 'Expense';
  amount: number;
};

export const transactions: Transaction[] = Array.from({ length: 30 }, (_, i) => {
    const type = Math.random() > 0.3 ? 'Income' : 'Expense';
    return {
        id: `txn-${i + 1}`,
        date: format(subDays(new Date(), i), 'yyyy-MM-dd'),
        description: type === 'Income' ? `Service - Client ${Math.floor(Math.random() * 10) + 1}` : `Supply Purchase ${i+1}`,
        type: type,
        amount: type === 'Income' ? Math.round(Math.random() * 100 + 20) : Math.round(Math.random() * 200 + 10),
    }
});

export const monthlyRevenue = [
  { month: "Jan", revenue: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Feb", revenue: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Mar", revenue: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Apr", revenue: Math.floor(Math.random() * 5000) + 1000 },
  { month: "May", revenue: Math.floor(Math.random() * 5000) + 1000 },
  { month: "Jun", revenue: Math.floor(Math.random() * 5000) + 1000 },
];
