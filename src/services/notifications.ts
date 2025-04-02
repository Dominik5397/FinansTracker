import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  addDoc, 
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Notification, NotificationType, Transaction, Budget, Category } from '../types';

// Pobieranie powiadomień dla użytkownika
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(
      notificationsRef,
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const querySnapshot = await getDocs(q);
    const notifications: Notification[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        ...data,
      } as Notification);
    });
    
    return notifications;
  } catch (error) {
    console.error('Błąd podczas pobierania powiadomień:', error);
    return [];
  }
};

// Oznaczanie powiadomienia jako przeczytane
export const markNotificationAsRead = async (userId: string, notificationId: string): Promise<boolean> => {
  try {
    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      isRead: true
    });
    return true;
  } catch (error) {
    console.error('Błąd podczas oznaczania powiadomienia jako przeczytane:', error);
    return false;
  }
};

// Oznaczanie wszystkich powiadomień jako przeczytane
export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(
      notificationsRef,
      where('isRead', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    
    const promises = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, { isRead: true })
    );
    
    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error('Błąd podczas oznaczania wszystkich powiadomień jako przeczytane:', error);
    return false;
  }
};

// Usuwanie powiadomienia
export const deleteNotification = async (userId: string, notificationId: string): Promise<boolean> => {
  try {
    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
    await deleteDoc(notificationRef);
    return true;
  } catch (error) {
    console.error('Błąd podczas usuwania powiadomienia:', error);
    return false;
  }
};

// Dodawanie nowego powiadomienia
export const addNotification = async (
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  link?: string,
  data?: any
): Promise<string | null> => {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const notificationData = {
      userId,
      title,
      message,
      type,
      createdAt: serverTimestamp(),
      isRead: false,
      ...(link && { link }),
      ...(data && { data })
    };
    
    const docRef = await addDoc(notificationsRef, notificationData);
    return docRef.id;
  } catch (error) {
    console.error('Błąd podczas dodawania powiadomienia:', error);
    return null;
  }
};

// Generowanie powiadomień na podstawie budżetów
export const generateBudgetAlerts = async (
  userId: string,
  transactions: Transaction[],
  budgets: Budget[],
  categories: Category[]
): Promise<void> => {
  try {
    // Dla każdego budżetu sprawdzamy, czy został przekroczony lub jest bliski przekroczenia
    budgets.forEach(budget => {
      // Filtrujemy transakcje dla danego budżetu
      const budgetTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date as string);
        const budgetStart = new Date(budget.startDate as string);
        const budgetEnd = new Date(budget.endDate as string);

        return (
          t.type === 'expense' && 
          t.categoryId === budget.categoryId &&
          transactionDate >= budgetStart && 
          transactionDate <= budgetEnd
        );
      });

      // Obliczamy sumę wydatków
      const totalSpent = budgetTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      // Obliczamy procent wykorzystania budżetu
      const percentage = (totalSpent / budget.amount) * 100;
      
      // Znajdujemy kategorię
      const category = categories.find(c => c.id === budget.categoryId);
      
      if (!category) return;
      
      // Określamy typ alertu na podstawie procentu wykorzystania
      if (percentage >= 100) {
        // Budżet przekroczony
        addNotification(
          userId,
          'Przekroczony budżet',
          `Przekroczyłeś budżet dla kategorii "${category.name}" o ${(totalSpent - budget.amount).toFixed(2)} PLN.`,
          NotificationType.BUDGET_ALERT,
          '/budget',
          { budgetId: budget.id, percentage }
        );
      } else if (percentage >= 90) {
        // Budżet prawie wyczerpany
        addNotification(
          userId,
          'Budżet prawie wyczerpany',
          `Wykorzystałeś już ${percentage.toFixed(0)}% budżetu dla kategorii "${category.name}".`,
          NotificationType.BUDGET_ALERT,
          '/budget',
          { budgetId: budget.id, percentage }
        );
      } else if (percentage >= 75) {
        // Zbliżasz się do limitu
        addNotification(
          userId,
          'Zbliżasz się do limitu budżetu',
          `Wykorzystałeś już ${percentage.toFixed(0)}% budżetu dla kategorii "${category.name}".`,
          NotificationType.BUDGET_ALERT,
          '/budget',
          { budgetId: budget.id, percentage }
        );
      }
    });
  } catch (error) {
    console.error('Błąd podczas generowania alertów budżetowych:', error);
  }
};

// Generowanie porad oszczędnościowych
export const generateSavingsTips = async (
  userId: string,
  transactions: Transaction[],
  categories: Category[]
): Promise<void> => {
  try {
    // Pobieramy transakcje z ostatnich 30 dni
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date as string);
      return transactionDate >= thirtyDaysAgo && t.type === 'expense';
    });
    
    // Grupujemy wydatki według kategorii
    const expensesByCategory: Record<string, number> = {};
    
    recentTransactions.forEach(transaction => {
      if (!expensesByCategory[transaction.categoryId]) {
        expensesByCategory[transaction.categoryId] = 0;
      }
      expensesByCategory[transaction.categoryId] += transaction.amount;
    });
    
    // Znajdujemy kategorię z największymi wydatkami
    let maxExpenseCategory = '';
    let maxExpenseAmount = 0;
    
    Object.entries(expensesByCategory).forEach(([categoryId, amount]) => {
      if (amount > maxExpenseAmount) {
        maxExpenseCategory = categoryId;
        maxExpenseAmount = amount;
      }
    });
    
    if (maxExpenseCategory) {
      const category = categories.find(c => c.id === maxExpenseCategory);
      
      if (category) {
        // Generujemy poradę na podstawie kategorii z największymi wydatkami
        let tipMessage = '';
        
        switch(category.name.toLowerCase()) {
          case 'jedzenie':
          case 'żywność':
            tipMessage = 'Planuj posiłki z wyprzedzeniem i rób zakupy z listą, aby zmniejszyć wydatki na jedzenie.';
            break;
          case 'rozrywka':
            tipMessage = 'Poszukaj darmowych lub tańszych alternatyw dla rozrywki, jak bezpłatne wydarzenia czy promocje.';
            break;
          case 'transport':
            tipMessage = 'Rozważ korzystanie z transportu publicznego lub dzielenie się przejazdami, aby zaoszczędzić na transporcie.';
            break;
          default:
            tipMessage = `Zwróć uwagę na wydatki w kategorii "${category.name}" - to Twoja największa kategoria wydatków w ostatnim miesiącu.`;
        }
        
        addNotification(
          userId,
          'Porada oszczędnościowa',
          tipMessage,
          NotificationType.TIP,
          '/transactions',
          { categoryId: category.id }
        );
      }
    }
  } catch (error) {
    console.error('Błąd podczas generowania porad oszczędnościowych:', error);
  }
};

// Funkcja do generowania wszystkich typów powiadomień
export const generateAllNotifications = async (
  userId: string,
  transactions: Transaction[],
  budgets: Budget[],
  categories: Category[]
): Promise<void> => {
  await generateBudgetAlerts(userId, transactions, budgets, categories);
  await generateSavingsTips(userId, transactions, categories);
  
  // Dodaj przykładowe powiadomienie o aktualizacji
  await addNotification(
    userId,
    'Nowa funkcja: Powiadomienia',
    'Dodaliśmy system powiadomień, który będzie informować Cię o ważnych wydarzeniach i pomagać lepiej zarządzać finansami.',
    NotificationType.UPDATE,
    '/'
  );
}; 