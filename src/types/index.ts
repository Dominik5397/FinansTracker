// Typy użytkownika
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

// Typy transakcji
export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  description: string;
  categoryId: string;
  type: 'income' | 'expense';
  date: Date | string | { toDate(): Date };  // Obsługuje string, Date oraz Firestore Timestamp
  createdAt: Date | string | { toDate(): Date } | any;
}

// Typy kategorii
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  createdAt?: Date | string | { toDate(): Date };
}

// Typy budżetu
export interface Budget {
  id: string;
  userId: string;
  amount: number;
  categoryId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date | string | { toDate(): Date };
  endDate: Date | string | { toDate(): Date };
  createdAt: Date | string | { toDate(): Date };
}

export enum NotificationType {
  BUDGET_ALERT = 'BUDGET_ALERT',
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',
  TIP = 'TIP',
  TREND = 'TREND',
  UPDATE = 'UPDATE'
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: Date | string | { toDate(): Date } | any;
  isRead: boolean;
  link?: string;
  data?: any;
} 