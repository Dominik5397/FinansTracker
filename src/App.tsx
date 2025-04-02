import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { 
  collection, 
  query, 
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  limit,
  getDocs
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, getCategories } from './services/firebase';
import { getUserNotifications, generateAllNotifications } from './services/notifications';
import { AnimatePresence } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Components
import Layout from './components/Layout/Layout';
import DevTools from './components/DevTools/DevTools';

// Pages
import Dashboard from './pages/Dashboard/Dashboard';
import TransactionsPage from './pages/Transactions/TransactionsPage';
import BudgetPage from './pages/Budget/BudgetPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';

// Types
import { User, Transaction, Budget, Category, Notification } from './types';

// Domyślne kategorie
const defaultCategories = [
  // Kategorie wydatków
  { name: 'Jedzenie', icon: 'restaurant', color: '#FF5722', type: 'expense' as 'expense' },
  { name: 'Transport', icon: 'directions_car', color: '#2196F3', type: 'expense' as 'expense' },
  { name: 'Rachunki', icon: 'receipt', color: '#F44336', type: 'expense' as 'expense' },
  { name: 'Zakupy', icon: 'shopping_cart', color: '#9C27B0', type: 'expense' as 'expense' },
  { name: 'Rozrywka', icon: 'movie', color: '#FF9800', type: 'expense' as 'expense' },
  { name: 'Zdrowie', icon: 'local_hospital', color: '#4CAF50', type: 'expense' as 'expense' },
  { name: 'Edukacja', icon: 'school', color: '#607D8B', type: 'expense' as 'expense' },
  { name: 'Inne wydatki', icon: 'more_horiz', color: '#795548', type: 'expense' as 'expense' },
  
  // Kategorie przychodów
  { name: 'Wynagrodzenie', icon: 'work', color: '#4CAF50', type: 'income' as 'income' },
  { name: 'Freelancing', icon: 'laptop', color: '#00BCD4', type: 'income' as 'income' },
  { name: 'Inwestycje', icon: 'trending_up', color: '#3F51B5', type: 'income' as 'income' },
  { name: 'Zwroty', icon: 'replay', color: '#8BC34A', type: 'income' as 'income' },
  { name: 'Prezenty', icon: 'card_giftcard', color: '#E91E63', type: 'income' as 'income' },
  { name: 'Inne przychody', icon: 'more_horiz', color: '#009688', type: 'income' as 'income' }
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  // Wczytywanie preferencji z localStorage przy starcie aplikacji
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  // Funkcja przełączająca motyw
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    // Zapisywanie preferencji w localStorage
    localStorage.setItem('darkMode', JSON.stringify(newMode));
  };

  // Inicjalizacja AOS (Animate On Scroll)
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: false,
      mirror: true,
      offset: 100,
    });
  }, []);

  // Modyfikuję useEffect do pobierania kategorii, aby tylko pobierał kategorie z bazy bez dodawania domyślnych
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Próba pobrania kategorii z bazy danych...');
        
        const categories = await getCategories();
        if (categories && categories.length > 0) {
          console.log(`Pobrano ${categories.length} kategorii z bazy danych`);
          setCategories(categories as Category[]);
        } else {
          console.log('Nie znaleziono kategorii w bazie danych.');
          setCategories([]);
        }
      } catch (error) {
        console.error('Błąd podczas pobierania kategorii:', error);
        setCategories([]);
      }
    };
    
    // Sprawdzamy, czy użytkownik jest zalogowany przed próbą pobrania kategorii
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchCategories();
      } else {
        setCategories([]);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Nasłuchiwanie zmian statusu autoryzacji
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || undefined,
          photoURL: currentUser.photoURL || undefined,
        });
        fetchUserData(currentUser.uid);
      } else {
        setUser(null);
        setTransactions([]);
        setBudgets([]);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // fetchUserData używa stanów komponentu, więc nie powinno być w zależnościach

  // Funkcja do dodawania domyślnych kategorii
  const addDefaultCategories = async (userId: string) => {
    try {
      console.log('Rozpoczynam dodawanie domyślnych kategorii dla użytkownika:', userId);
      const categoriesRef = collection(db, 'users', userId, 'categories');
      const addedCategories: Category[] = [];
      
      for (const category of defaultCategories) {
        try {
          const newCategory = {
            ...category,
            createdAt: serverTimestamp()
          };
          
          const docRef = await addDoc(categoriesRef, newCategory);
          addedCategories.push({ 
            id: docRef.id, 
            ...category,
            createdAt: new Date()
          });
          console.log(`Dodano kategorię: ${category.name} (${docRef.id})`);
        } catch (error) {
          console.error(`Błąd podczas dodawania kategorii ${category.name}:`, error);
        }
      }
      
      console.log(`Zakończono dodawanie kategorii. Dodano ${addedCategories.length} z ${defaultCategories.length} kategorii.`);
      return addedCategories;
    } catch (error) {
      console.error('Błąd podczas dodawania domyślnych kategorii:', error);
      return [];
    }
  };

  // Modyfikuję fetchUserData, aby korzystało z funkcji getCategories
  const fetchUserData = async (userId: string) => {
    setIsLoading(true);
    
    try {
      console.log('Rozpoczynam pobieranie danych użytkownika', userId);
      
      // Najpierw pobierz kategorie - ten krok jest ważny
      console.log('Pobieranie kategorii przed transakcjami...');
      const userCategories = await getCategories();
      console.log('Pobrane kategorie:', userCategories.length);
      
      // Jeśli brak kategorii, dodaj domyślne
      if (!userCategories || userCategories.length === 0) {
        console.log('Brak kategorii - dodaję domyślne...');
        const newCategories = await addDefaultCategories(userId);
        console.log('Dodano domyślne kategorie:', newCategories.length);
        setCategories(newCategories);
      } else {
        console.log('Ustawiam kategorie:', userCategories.length);
        setCategories(userCategories);
      }
      
      // Ustaw dane na podstawie obecnych zapytań - pokaż UI
      // Poprawiamy ścieżki kolekcji dla transakcji i budżetów
      const transactionsRef = collection(db, 'users', userId, 'transactions');
      const transactionsQuery = query(
        transactionsRef,
        orderBy('date', 'desc'),
        limit(20) // Zwiększam limit do 20 transakcji
      );
      
      const budgetsRef = collection(db, 'users', userId, 'budgets');
      const budgetsQuery = query(
        budgetsRef,
        orderBy('createdAt', 'desc')
      );
      
      // Nasłuchiwanie dla transakcji i budżetów
      const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
        const transactionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaction[];
        
        console.log(`Pobrano ${transactionsData.length} transakcji`);
        setTransactions(transactionsData);
        setIsLoading(false);
      }, (error) => {
        console.error('Błąd podczas nasłuchiwania transakcji:', error);
        setIsLoading(false);
      });
      
      const unsubscribeBudgets = onSnapshot(budgetsQuery, (snapshot) => {
        const budgetsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Budget[];
        
        console.log(`Pobrano ${budgetsData.length} budżetów`);
        setBudgets(budgetsData);
      }, (error) => {
        console.error('Błąd podczas nasłuchiwania budżetów:', error);
      });
      
      // Zwracamy funkcję czyszczącą nasłuchiwanie
      return () => {
        unsubscribeTransactions();
        unsubscribeBudgets();
      };
    } catch (error) {
      console.error("Błąd podczas pobierania danych:", error);
      setIsLoading(false);
      // W przypadku błędu, nadal próbujemy ustawić puste dane
      setCategories([]);
      setTransactions([]);
      setBudgets([]);
      return () => {};
    }
  };

  // Funkcja do ponownego pobierania transakcji
  const fetchTransactions = () => {
    if (user) {
      fetchUserData(user.uid);
    }
  };

  // Fetch notifications
  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        const userNotifications = await getUserNotifications(user.uid);
        setNotifications(userNotifications);
        
        // Count unread notifications
        const unreadCount = userNotifications.filter(n => !n.isRead).length;
        setUnreadNotificationsCount(unreadCount);
      };
      
      fetchNotifications();
      
      // Generate sample notifications if there are none
      if (notifications.length === 0 && transactions.length > 0 && categories.length > 0) {
        generateAllNotifications(user.uid, transactions, budgets, categories);
      }
    }
  }, [user, transactions.length, budgets.length, categories.length]);

  // Function to refresh notifications
  const refreshNotifications = async () => {
    if (user) {
      const userNotifications = await getUserNotifications(user.uid);
      setNotifications(userNotifications);
      
      // Count unread notifications
      const unreadCount = userNotifications.filter(n => !n.isRead).length;
      setUnreadNotificationsCount(unreadCount);
    }
  };

  // Tworzymy motyw z uwzględnieniem trybu ciemnego/jasnego
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: darkMode ? '#7986cb' : '#1e40af',
        light: darkMode ? '#9fa8da' : '#3b82f6',
        dark: darkMode ? '#5c6bc0' : '#1e3a8a',
        contrastText: '#ffffff',
      },
      secondary: {
        main: darkMode ? '#ff80ab' : '#e11d48',
        light: darkMode ? '#ff9db4' : '#fb7185',
        dark: darkMode ? '#c51162' : '#be123c',
        contrastText: '#ffffff',
      },
      error: {
        main: darkMode ? '#ff8a80' : '#ef4444',
        light: darkMode ? '#ffbcaf' : '#f87171',
        dark: darkMode ? '#c85a54' : '#b91c1c',
      },
      warning: {
        main: darkMode ? '#ffb74d' : '#f59e0b',
        light: darkMode ? '#ffcc80' : '#fbbf24',
        dark: darkMode ? '#c88719' : '#b45309',
      },
      info: {
        main: darkMode ? '#81d4fa' : '#0ea5e9',
        light: darkMode ? '#b3e5fc' : '#38bdf8',
        dark: darkMode ? '#4ba3c7' : '#0369a1',
      },
      success: {
        main: darkMode ? '#a5d6a7' : '#10b981',
        light: darkMode ? '#c8e6c9' : '#34d399',
        dark: darkMode ? '#75a478' : '#047857',
      },
      background: {
        default: darkMode ? '#121212' : '#f8fafc',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#ffffff' : '#1e293b',
        secondary: darkMode ? '#b0bec5' : '#64748b',
      },
      divider: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
    },
    typography: {
      fontFamily: [
        'Roboto',
        'Segoe UI',
        'Helvetica Neue',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontWeight: 700,
        color: darkMode ? '#ffffff' : '#0f172a',
        letterSpacing: '-0.01em',
      },
      h2: {
        fontWeight: 700,
        color: darkMode ? '#ffffff' : '#0f172a',
        letterSpacing: '-0.01em',
      },
      h3: {
        fontWeight: 600,
        color: darkMode ? '#ffffff' : '#0f172a',
      },
      h4: {
        fontWeight: 600,
        color: darkMode ? '#ffffff' : '#0f172a',
      },
      h5: {
        fontWeight: 600,
        color: darkMode ? '#ffffff' : '#0f172a',
      },
      h6: {
        fontWeight: 600,
        color: darkMode ? '#ffffff' : '#0f172a',
      },
      subtitle1: {
        color: darkMode ? '#b0bec5' : '#475569',
      },
      subtitle2: {
        color: darkMode ? '#b0bec5' : '#475569',
        fontWeight: 500,
      },
      body1: {
        color: darkMode ? '#ffffff' : '#334155',
      },
      body2: {
        color: darkMode ? '#b0bec5' : '#475569',
      },
      button: {
        fontWeight: 600,
        letterSpacing: '0.02em',
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            transition: 'all 0.3s ease',
            fontWeight: 600,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: darkMode 
                ? '0 6px 12px rgba(0, 0, 0, 0.5)'
                : '0 6px 12px rgba(59, 130, 246, 0.3)',
            },
          },
          contained: {
            boxShadow: darkMode 
              ? '0 2px 8px rgba(0, 0, 0, 0.5)'
              : '0 2px 8px rgba(59, 130, 246, 0.2)',
          },
          outlined: {
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
            },
          },
          containedPrimary: {
            background: darkMode
              ? 'linear-gradient(45deg, #5c6bc0 30%, #7986cb 90%)'
              : 'linear-gradient(45deg, #1e40af 30%, #3b82f6 90%)',
            '&:hover': {
              background: darkMode
                ? 'linear-gradient(45deg, #5c6bc0 10%, #7986cb 70%)'
                : 'linear-gradient(45deg, #1e40af 10%, #3b82f6 70%)',
            }
          },
          containedSecondary: {
            background: darkMode
              ? 'linear-gradient(45deg, #c51162 30%, #ff80ab 90%)'
              : 'linear-gradient(45deg, #be123c 30%, #fb7185 90%)',
            '&:hover': {
              background: darkMode
                ? 'linear-gradient(45deg, #c51162 10%, #ff80ab 70%)'
                : 'linear-gradient(45deg, #be123c 10%, #fb7185 70%)',
            }
          }
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            transition: 'all 0.3s ease',
            boxShadow: darkMode 
              ? '0 8px 16px rgba(0, 0, 0, 0.5)'
              : '0 8px 16px rgba(148, 163, 184, 0.12)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: darkMode 
                ? '0 12px 24px rgba(0, 0, 0, 0.6)'
                : '0 12px 24px rgba(148, 163, 184, 0.25)',
            },
            border: darkMode 
              ? 'none' 
              : '1px solid rgba(226, 232, 240, 0.8)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundImage: 'none',
          },
          elevation1: {
            boxShadow: darkMode 
              ? '0 2px 8px rgba(0, 0, 0, 0.5)'
              : '0 2px 8px rgba(148, 163, 184, 0.1)',
          },
          elevation4: {
            boxShadow: darkMode 
              ? '0 8px 16px rgba(0, 0, 0, 0.5)'
              : '0 8px 16px rgba(148, 163, 184, 0.15)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              '&.Mui-focused': {
                boxShadow: darkMode 
                  ? '0 0 0 2px rgba(121, 134, 203, 0.3)' 
                  : '0 0 0 2px rgba(59, 130, 246, 0.2)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: darkMode ? '#9fa8da' : '#3b82f6',
              },
            },
            '& .MuiInputLabel-root': {
              color: darkMode ? '#b0bec5' : '#64748b',
              '&.Mui-focused': {
                color: darkMode ? '#7986cb' : '#3b82f6',
              }
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: darkMode 
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(203, 213, 225, 0.8)',
            }
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: darkMode 
              ? '0 4px 20px rgba(0, 0, 0, 0.5)'
              : '0 4px 20px rgba(59, 130, 246, 0.15)',
            backgroundImage: darkMode 
              ? 'linear-gradient(to right, #1a1a2e, #16213e)'
              : 'linear-gradient(to right, #ffffff, #eef2ff)',
            borderBottom: darkMode
              ? '1px solid rgba(255, 255, 255, 0.05)'
              : '1px solid rgba(59, 130, 246, 0.2)',
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '&:hover': {
              backgroundColor: darkMode 
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(241, 245, 249, 0.8)',
            },
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            width: 42,
            height: 26,
            padding: 0,
            margin: 8,
          },
          switchBase: {
            padding: 1,
            '&.Mui-checked': {
              transform: 'translateX(16px)',
              color: '#fff',
              '& + .MuiSwitch-track': {
                opacity: 1,
                backgroundColor: darkMode ? '#7986cb' : '#3b82f6',
              },
            },
          },
          thumb: {
            width: 24,
            height: 24,
          },
          track: {
            borderRadius: 13,
            border: 'none',
            backgroundColor: darkMode ? '#37474f' : '#cbd5e1',
            opacity: 1,
            transition: 'background-color 500ms',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            marginRight: 16,
            minWidth: 0,
            '&.Mui-selected': {
              color: darkMode ? '#7986cb' : '#3b82f6',
            },
          },
        },
      },
      MuiCircularProgress: {
        styleOverrides: {
          circle: {
            strokeLinecap: 'round',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            fontWeight: 500,
            '&.MuiChip-colorPrimary': {
              background: darkMode 
                ? 'linear-gradient(45deg, #5c6bc0 30%, #7986cb 90%)'
                : 'linear-gradient(45deg, #1e40af 30%, #3b82f6 90%)',
              color: '#ffffff',
            },
            '&.MuiChip-colorSecondary': {
              background: darkMode 
                ? 'linear-gradient(45deg, #c51162 30%, #ff80ab 90%)'
                : 'linear-gradient(45deg, #be123c 30%, #fb7185 90%)',
              color: '#ffffff',
            },
            '&.MuiChip-outlined': {
              borderWidth: 2,
            }
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            height: 8,
            backgroundColor: darkMode 
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(226, 232, 240, 0.6)',
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: darkMode 
              ? 'rgba(255, 255, 255, 0.12)'
              : 'rgba(226, 232, 240, 0.8)',
          }
        }
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            border: darkMode 
              ? '2px solid rgba(255, 255, 255, 0.2)'
              : '2px solid rgba(226, 232, 240, 0.8)',
          }
        }
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: darkMode 
              ? 'rgba(30, 41, 59, 0.9)'
              : 'rgba(15, 23, 42, 0.9)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: '0.8rem',
            boxShadow: darkMode 
              ? '0 4px 8px rgba(0, 0, 0, 0.5)'
              : '0 4px 8px rgba(0, 0, 0, 0.15)',
          }
        }
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div 
        style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}
        className={darkMode ? 'dark-mode gradient-bg-dark' : 'gradient-bg-light'}
      >
        <Router>
          <AnimatePresence mode="wait">
            <Routes>
              <Route 
                path="/login" 
                element={user ? <Navigate to="/dashboard" /> : <LoginPage />} 
              />
              <Route 
                path="/register" 
                element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} 
              />
              <Route 
                path="/" 
                element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
              />
              <Route element={<Layout 
                user={user} 
                darkMode={darkMode} 
                toggleDarkMode={toggleDarkMode} 
                notifications={notifications}
                refreshNotifications={refreshNotifications}
                unreadNotificationsCount={unreadNotificationsCount}
              />}>
                <Route 
                  path="/dashboard" 
                  element={
                    user ? 
                    <Dashboard 
                      transactions={transactions} 
                      categories={categories} 
                      budgets={budgets} 
                      isLoading={isLoading} 
                      userId={user?.uid || ''}
                    /> : 
                    <Navigate to="/login" />
                  } 
                />
                <Route 
                  path="/transactions" 
                  element={
                    user ? 
                    <TransactionsPage 
                      transactions={transactions} 
                      categories={categories} 
                      fetchTransactions={fetchTransactions}
                      isLoading={isLoading}
                      userId={user?.uid || ''}
                    /> : 
                    <Navigate to="/login" />
                  } 
                />
                <Route 
                  path="/budget" 
                  element={
                    user ? 
                    <BudgetPage 
                      transactions={transactions} 
                      categories={categories} 
                      budgets={budgets}
                      fetchTransactions={fetchTransactions}
                      isLoading={isLoading}
                      userId={user?.uid || ''}
                    /> : 
                    <Navigate to="/login" />
                  } 
                />
              </Route>
            </Routes>
          </AnimatePresence>
          {user && <DevTools />}
        </Router>
      </div>
    </ThemeProvider>
  );
};

export default App;


