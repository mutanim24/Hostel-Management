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
  cost: number;
}
