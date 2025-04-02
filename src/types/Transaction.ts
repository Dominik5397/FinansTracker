import { Category } from '../services/firebase';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  category?: Category;
  createdAt?: Date;
} 