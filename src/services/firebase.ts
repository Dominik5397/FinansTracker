import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  deleteDoc, 
  serverTimestamp,
  limit, 
  where,
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence,
  getDocFromCache,
  getDocsFromCache,
  QuerySnapshot
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Konfiguracja Firebase ze zmiennych środowiskowych
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Inicjalizacja Firebase przed eksportem
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Włączenie cachowania Firestore dla lepszej wydajności offline i szybszego ładowania
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Wiele kart otwartych, użyj multi-tab persistence
      console.warn('Persistence nie może być włączone z powodu wielu otwartych kart. Przełączam na multi-tab persistence.');
      enableMultiTabIndexedDbPersistence(db).catch(error => {
        console.error('Błąd podczas włączania multi-tab persistence:', error);
      });
    } else if (err.code === 'unimplemented') {
      console.warn('Persistence nie jest wspierane przez przeglądarkę.');
    }
  });
} catch (error) {
  console.error('Błąd podczas inicjalizacji persistence:', error);
}

// Funkcja pomocnicza do opóźnionego pobierania danych
const withDelay = <T>(promise: Promise<T>, delay = 300): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      promise.then(resolve);
    }, delay);
  });
};

// Cache dla kategorii
let categoriesCache: Category[] | null = null;
let categoriesCacheTimestamp: number = 0;
const CACHE_EXPIRY_TIME = 30 * 60 * 1000; // 30 minut w milisekundach - dłuższy czas cachowania
const EMPTY_STATE_TIMEOUT = 1000; // 1 sekunda

// Definicje typów
export interface CategoryData {
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

export interface Category extends CategoryData {
  id: string;
  createdAt?: Date;
}

export interface TransactionData {
  date: string;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  categoryId?: string;
  createdAt?: Date;
}

export interface Transaction extends TransactionData {
  id: string;
  category?: Category;
}

export const addCategory = async (categoryData: CategoryData) => {
  try {
    const user = auth?.currentUser;
    
    if (!user) {
      throw new Error('Użytkownik nie jest zalogowany');
    }
    
    const categoryRef = collection(db, 'users', user.uid, 'categories');
    const newCategory = {
      ...categoryData,
      createdAt: serverTimestamp()
    };
    
    console.log('Dodawanie kategorii:', newCategory);
    const docRef = await addDoc(categoryRef, newCategory);
    return { id: docRef.id, ...newCategory };
  } catch (error) {
    console.error('Błąd podczas dodawania kategorii:', error);
    throw error;
  }
};

export const getCategories = async (): Promise<Category[]> => {
  try {
    const user = auth?.currentUser;
    
    if (!user) {
      console.error('Użytkownik nie jest zalogowany');
      return Promise.resolve([]);
    }
    
    console.log('Pobieranie kategorii dla użytkownika:', user.uid);
    
    // Sprawdź, czy możemy użyć zapamiętanych danych - ale z krótszym czasem cachowania
    const currentTime = Date.now();
    if (categoriesCache && (currentTime - categoriesCacheTimestamp < 60000)) { // 1 minuta cachowania
      console.log('Używam zapamiętanych kategorii z cache');
      return Promise.resolve(categoriesCache);
    }
    
    // Pobierz bezpośrednio z serwera, bez limitu czasowego
    const categoriesRef = collection(db, 'users', user.uid, 'categories');
    console.log('Pobieranie z kolekcji:', `users/${user.uid}/categories`);
    
    // Dodajemy logi
    try {
      const categoriesSnapshot = await getDocs(categoriesRef);
      console.log(`Otrzymano odpowiedź z Firebase: ${categoriesSnapshot.size} dokumentów`);
      
      const categories: Category[] = [];
      
      categoriesSnapshot.forEach((doc) => {
        const data = doc.data();
        const category = {
          id: doc.id,
          name: data.name || '',
          icon: data.icon || 'more_horiz',
          color: data.color || '#000000',
          type: data.type || 'expense',
          createdAt: data.createdAt ? new Date(data.createdAt.toDate()) : new Date()
        };
        console.log(`Pobrano kategorię: ${category.name} (${category.type}) - ID: ${doc.id}`);
        categories.push(category);
      });
      
      console.log(`Pobrano ${categories.length} kategorii z bazy danych`);
      
      // Zapisz w cache tylko jeśli znaleziono przynajmniej jedną kategorię
      if (categories.length > 0) {
        categoriesCache = categories;
        categoriesCacheTimestamp = currentTime;
        console.log('Zapisano kategorie w cache');
      } else {
        console.warn('Nie znaleziono żadnych kategorii w bazie');
      }
      
      return categories;
    } catch (error) {
      console.error('Błąd podczas pobierania kategorii z Firebase:', error);
      throw error;
    }
  } catch (error) {
    console.error('Główny błąd podczas pobierania kategorii:', error);
    
    // Jeśli wystąpił błąd, a mamy dane w cache, zwróć je jako fallback
    if (categoriesCache) {
      console.log('Używam zapamiętanych kategorii z cache jako fallback po błędzie');
      return categoriesCache;
    }
    
    return [];
  }
};

// Cache dla transakcji
let transactionsCache: Transaction[] | null = null;
let transactionsCacheTimestamp: number = 0;

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const user = auth?.currentUser;
    
    if (!user) {
      console.error('Użytkownik nie jest zalogowany');
      return Promise.resolve([]);
    }
    
    // Sprawdź, czy możemy użyć zapamiętanych danych
    const currentTime = Date.now();
    if (transactionsCache && (currentTime - transactionsCacheTimestamp < CACHE_EXPIRY_TIME)) {
      console.log('Używam zapamiętanych transakcji z cache');
      return Promise.resolve(transactionsCache);
    }
    
    // Utwórz promise z timeoutem, który zwróci puste dane jeśli pobieranie trwa zbyt długo
    const timeoutPromise = new Promise<Transaction[]>(resolve => {
      setTimeout(() => {
        console.log('Timeout pobierania transakcji - zwracam puste dane');
        resolve([]);
      }, EMPTY_STATE_TIMEOUT);
    });
    
    // Pobierz wszystkie transakcje z limitem
    const transactionsRef = collection(db, 'users', user.uid, 'transactions');
    const q = query(transactionsRef, orderBy('date', 'desc'), limit(10));
    
    const queryPromise = new Promise<Transaction[]>(async (resolve) => {
      let querySnapshot: QuerySnapshot;
      
      try {
        // Najpierw spróbuj z cache
        querySnapshot = await getDocsFromCache(q);
        console.log('Pobrano transakcje z cache IndexedDB');
      } catch (cacheError) {
        try {
          // Jeśli cache zawiedzie, spróbuj z serwera
          console.log('Nie udało się pobrać z cache, pobieram z serwera...');
          querySnapshot = await getDocs(q);
        } catch (serverError) {
          console.error('Błąd pobierania z serwera:', serverError);
          resolve([]);
          return;
        }
      }
      
      // Pobierz kategorie asynchronicznie, ale nie czekaj na nie
      const categoriesPromise = getCategories().catch(() => []);
      
      const transactions: Transaction[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const transaction: Transaction = {
          id: doc.id,
          date: data.date || '',
          amount: Number(data.amount) || 0,
          description: data.description || '',
          type: data.type || 'expense',
          categoryId: data.categoryId,
          createdAt: data.createdAt ? new Date(data.createdAt.toDate()) : new Date()
        };
        
        transactions.push(transaction);
      });
      
      console.log(`Pobrano ${transactions.length} transakcji z bazy danych`);
      
      // Zapisz w cache
      transactionsCache = transactions;
      transactionsCacheTimestamp = currentTime;
      
      // Uzupełnij informacje o kategoriach w tle, ale zwróć dane transakcji natychmiast
      categoriesPromise.then(categories => {
        if (categories.length > 0) {
          const categoriesMap = new Map<string, Category>();
          categories.forEach(category => categoriesMap.set(category.id, category));
          
          // Aktualizuj transakcje o dane kategorii
          transactions.forEach(transaction => {
            if (transaction.categoryId && categoriesMap.has(transaction.categoryId)) {
              transaction.category = categoriesMap.get(transaction.categoryId);
            }
          });
          
          // Zaktualizuj cache
          transactionsCache = [...transactions];
        }
      });
      
      resolve(transactions);
    });
    
    // Zwróć co szybsze - dane z Firebase lub timeout
    return Promise.race([queryPromise, timeoutPromise]);
    
  } catch (error) {
    console.error('Błąd podczas pobierania transakcji:', error);
    
    // Jeśli wystąpił błąd, a mamy dane w cache, zwróć je jako fallback
    if (transactionsCache) {
      console.log('Używam zapamiętanych transakcji z cache jako fallback po błędzie');
      return transactionsCache;
    }
    
    return [];
  }
};

export const cleanupDuplicateCategories = async (): Promise<Category[]> => {
  try {
    const user = auth?.currentUser;
    
    if (!user) {
      console.error('Użytkownik nie jest zalogowany');
      return [];
    }
    
    // Pobierz wszystkie kategorie
    const categoriesRef = collection(db, 'users', user.uid, 'categories');
    const querySnapshot = await getDocs(categoriesRef);
    
    const categoriesMap = new Map<string, Category[]>();
    
    // Grupuj kategorie według nazwy
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const category: Category = {
        id: doc.id,
        name: data.name || '',
        icon: data.icon || 'more_horiz',
        color: data.color || '#000000',
        type: data.type || 'expense',
        createdAt: data.createdAt ? new Date(data.createdAt.toDate()) : new Date()
      };
      
      // Użyj nazwy i typu jako klucza, aby zgrupować kategorie
      const key = `${category.name}-${category.type}`;
      if (!categoriesMap.has(key)) {
        categoriesMap.set(key, []);
      }
      categoriesMap.get(key)?.push(category);
    });
    
    console.log(`Znaleziono ${querySnapshot.size} kategorii, ${categoriesMap.size} unikalnych grup`);
    
    const uniqueCategories: Category[] = [];
    const categoriesToDelete: string[] = [];
    
    // Dla każdej grupy duplikatów, wybierz "najlepszą" kategorię
    const entries = Array.from(categoriesMap.entries());
    for (const [key, categories] of entries) {
      if (categories.length > 1) {
        console.log(`Znaleziono ${categories.length} duplikatów dla "${key}"`);
        
        // Sortowanie - zachowaj kategorie z ikoną i kolorem, preferuj najnowsze
        categories.sort((a: Category, b: Category) => {
          if (a.icon !== 'more_horiz' && b.icon === 'more_horiz') return -1;
          if (a.icon === 'more_horiz' && b.icon !== 'more_horiz') return 1;
          if (a.color !== '#000000' && b.color === '#000000') return -1;
          if (a.color === '#000000' && b.color !== '#000000') return 1;
          
          // Jeśli oba mają ikonę i kolor, wybierz najnowszy
          return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
        });
        
        // Zachowaj pierwszy (najlepszy) element
        uniqueCategories.push(categories[0]);
        
        // Dodaj resztę do usunięcia
        for (let i = 1; i < categories.length; i++) {
          categoriesToDelete.push(categories[i].id);
        }
      } else {
        // Jeśli nie ma duplikatów, po prostu dodaj kategorię
        uniqueCategories.push(categories[0]);
      }
    }
    
    console.log(`Do usunięcia: ${categoriesToDelete.length} duplikatów`);
    
    // Usuń duplikaty
    for (const categoryId of categoriesToDelete) {
      const docRef = doc(db, 'users', user.uid, 'categories', categoryId);
      await deleteDoc(docRef);
      console.log(`Usunięto duplikat kategorii o ID: ${categoryId}`);
    }
    
    console.log(`Czyszczenie zakończone. Pozostało ${uniqueCategories.length} unikalnych kategorii`);
    return uniqueCategories;
  } catch (error) {
    console.error('Błąd podczas czyszczenia duplikatów kategorii:', error);
    throw error;
  }
};

// Eksport usług Firebase
export { db, auth, storage };
export default app; 