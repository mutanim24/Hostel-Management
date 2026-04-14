export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  room?: string;
  rentPaid?: boolean;
  billPaid?: boolean;
  role: 'admin' | 'user';
}

export interface MealMenu {
  date: string; // YYYY-MM-DD
  breakfast?: string;
  lunch?: string;
  dinner?: string;
}

export interface MealRecord {
  id: string;
  userId: string;
  date: string;
  type: 'breakfast' | 'lunch' | 'dinner';
  status: 'ON' | 'OFF';
}

export interface Expense {
  id: string;
  date: string;
  title: string;
  amount: number;
}

export interface Payment {
  id: string;
  userId: string;
  type: 'rent' | 'meal' | 'wifi';
  amount: number;
  date: string;
}
