import React, { useEffect, useState, lazy, Suspense } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  useTheme, 
  Card, 
  CardContent,
  Skeleton,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip as ChartTooltip, Legend, ArcElement } from 'chart.js';
import { getTransactions } from '../../services/firebase';
import { Transaction } from '../../types/Transaction';
import { motion } from 'framer-motion';
import { RefreshOutlined, AccountBalanceWallet, TrendingUp, TrendingDown } from '@mui/icons-material';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend, ArcElement);

// Lazy loading komponentów wykresów dla zwiększenia wydajności
const LazyBarChart = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Bar })));
const LazyDoughnutChart = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Doughnut })));

const DashboardPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  const isDark = theme.palette.mode === 'dark';
  const chartTextColor = isDark ? '#fff' : '#333';
  const cardBackground = isDark 
    ? '#1e1e1e' // Pełny kolor dla trybu ciemnego
    : '#ffffff'; // Pełny kolor dla trybu jasnego

  useEffect(() => {
    // Pokaż najpierw interfejs (skelton loading)
    setTimeout(() => {
      fetchTransactions();
    }, 200); // dodaj małe opóźnienie aby zainicjować UI
  }, []);

  const fetchTransactions = async () => {
    try {
      setRefreshing(true);
      const fetchedTransactions = await getTransactions();
      setTransactions(fetchedTransactions);
      // Ustawiamy loading na false nawet jeśli transakcje są puste
      setLoading(false);
    } catch (error) {
      console.error('Błąd podczas pobierania transakcji:', error);
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    // Nie ustawiamy tu loading=true, aby interfejs był widoczny podczas odświeżania
    // Tylko zmieniamy stan refreshing
    fetchTransactions();
  };

  // Oblicz saldo, przychody i wydatki
  const totalIncome = transactions
    .filter(transaction => transaction.type === 'income')
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const totalExpense = transactions
    .filter(transaction => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const balance = totalIncome - totalExpense;

  // Grupowanie transakcji według kategorii
  const expenseByCategory = transactions
    .filter(transaction => transaction.type === 'expense')
    .reduce((acc, transaction) => {
      const categoryName = transaction.category?.name || 'Inne';
      if (!acc[categoryName]) {
        acc[categoryName] = 0;
      }
      acc[categoryName] += Number(transaction.amount);
      return acc;
    }, {} as Record<string, number>);

  // Przygotowanie danych dla wykresu kołowego
  const doughnutData = {
    labels: Object.keys(expenseByCategory),
    datasets: [
      {
        data: Object.values(expenseByCategory),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
          '#8AC24A', '#E91E63', '#2196F3', '#FFC107', '#00BCD4', '#673AB7'
        ],
        borderWidth: 1,
      },
    ],
  };

  // Grupowanie transakcji według daty (ostatnie 7 dni)
  const last7Days = [...Array(7)].map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return format(date, 'dd.MM', { locale: pl });
  });

  const transactionsByDate: Record<string, { income: number; expense: number }> = {};
  
  last7Days.forEach(date => {
    transactionsByDate[date] = { income: 0, expense: 0 };
  });

  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const dateStr = format(date, 'dd.MM', { locale: pl });
    
    if (transactionsByDate[dateStr]) {
      if (transaction.type === 'income') {
        transactionsByDate[dateStr].income += Number(transaction.amount);
      } else {
        transactionsByDate[dateStr].expense += Number(transaction.amount);
      }
    }
  });

  // Przygotowanie danych dla wykresu słupkowego
  const barData = {
    labels: Object.keys(transactionsByDate),
    datasets: [
      {
        label: 'Przychody',
        data: Object.values(transactionsByDate).map(data => data.income),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderWidth: 1,
      },
      {
        label: 'Wydatki',
        data: Object.values(transactionsByDate).map(data => data.expense),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: chartTextColor,
        },
      },
      title: {
        display: true,
        text: 'Transakcje z ostatnich 7 dni',
        color: chartTextColor,
      },
    },
    scales: {
      x: {
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: chartTextColor,
        },
      },
      y: {
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: chartTextColor,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: chartTextColor,
        },
      },
      title: {
        display: true,
        text: 'Wydatki według kategorii',
        color: chartTextColor,
      },
    },
  };

  // Animacje
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2 
      } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { 
        type: 'spring', 
        stiffness: 100,
        damping: 10 
      }
    }
  };

  // Helper do formatowania kwot
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Wykres słupkowy
  const renderBarChart = () => {
    if (loading) {
      return (
        <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Skeleton variant="rectangular" width="100%" height="100%" />
        </Box>
      );
    }
    
    if (transactions.length === 0) {
      return (
        <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Brak danych do wyświetlenia
          </Typography>
        </Box>
      );
    }
    
    return (
      <Suspense fallback={<Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>}>
        <LazyBarChart options={barOptions} data={barData} />
      </Suspense>
    );
  };
  
  // Wykres kołowy
  const renderDoughnutChart = () => {
    if (loading) {
      return (
        <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Skeleton variant="circular" width={300} height={300} />
        </Box>
      );
    }
    
    if (Object.keys(expenseByCategory).length === 0) {
      return (
        <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Brak wydatków do wyświetlenia
          </Typography>
        </Box>
      );
    }
    
    return (
      <Suspense fallback={<Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>}>
        <LazyDoughnutChart options={doughnutOptions} data={doughnutData} />
      </Suspense>
    );
  };

  return (
    <Container>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        style={{
          position: 'relative',
          zIndex: 10
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          mt: 3
        }}>
          <motion.div variants={itemVariants}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Dashboard
            </Typography>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Tooltip title="Odśwież dane">
              <IconButton 
                onClick={handleRefresh} 
                disabled={refreshing}
                sx={{
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }}
              >
                <RefreshOutlined />
              </IconButton>
            </Tooltip>
          </motion.div>
        </Box>

        {/* Karty podsumowujące */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <motion.div variants={itemVariants}>
              <Card 
                elevation={5}
                sx={{ 
                  background: cardBackground,
                  borderRadius: 2,
                  position: 'relative',
                  zIndex: 10,
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 8px 16px rgba(0, 0, 0, 0.7)'
                    : '0 8px 16px rgba(0, 0, 0, 0.2)'
                }}
              >
                <CardContent sx={{ position: 'relative', overflow: 'hidden' }}>
                  <Box sx={{ position: 'absolute', right: 16, top: 16, opacity: 0.2 }}>
                    <AccountBalanceWallet sx={{ fontSize: 60 }} />
                  </Box>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Saldo
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold" color={balance >= 0 ? 'success.main' : 'error.main'}>
                    {loading ? <Skeleton width={120} /> : formatCurrency(balance)}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={4}>
            <motion.div variants={itemVariants}>
              <Card 
                elevation={5}
                sx={{ 
                  background: cardBackground,
                  borderRadius: 2,
                  position: 'relative',
                  zIndex: 10,
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 8px 16px rgba(0, 0, 0, 0.7)'
                    : '0 8px 16px rgba(0, 0, 0, 0.2)'
                }}
              >
                <CardContent sx={{ position: 'relative', overflow: 'hidden' }}>
                  <Box sx={{ position: 'absolute', right: 16, top: 16, opacity: 0.2 }}>
                    <TrendingUp sx={{ fontSize: 60 }} />
                  </Box>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Przychody
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold" color="success.main">
                    {loading ? <Skeleton width={120} /> : formatCurrency(totalIncome)}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={4}>
            <motion.div variants={itemVariants}>
              <Card 
                elevation={5}
                sx={{ 
                  background: cardBackground,
                  borderRadius: 2,
                  position: 'relative',
                  zIndex: 10,
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 8px 16px rgba(0, 0, 0, 0.7)'
                    : '0 8px 16px rgba(0, 0, 0, 0.2)'
                }}
              >
                <CardContent sx={{ position: 'relative', overflow: 'hidden' }}>
                  <Box sx={{ position: 'absolute', right: 16, top: 16, opacity: 0.2 }}>
                    <TrendingDown sx={{ fontSize: 60 }} />
                  </Box>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Wydatki
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold" color="error.main">
                    {loading ? <Skeleton width={120} /> : formatCurrency(totalExpense)}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Wykresy */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <motion.div variants={itemVariants}>
              <Paper
                elevation={5}
                sx={{
                  p: 3,
                  height: '100%',
                  background: cardBackground,
                  borderRadius: 2,
                  position: 'relative',
                  zIndex: 10,
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 8px 16px rgba(0, 0, 0, 0.7)'
                    : '0 8px 16px rgba(0, 0, 0, 0.2)'
                }}
              >
                {renderBarChart()}
              </Paper>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={4}>
            <motion.div variants={itemVariants}>
              <Paper
                elevation={5}
                sx={{
                  p: 3,
                  height: '100%',
                  background: cardBackground,
                  borderRadius: 2,
                  position: 'relative',
                  zIndex: 10,
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 8px 16px rgba(0, 0, 0, 0.7)'
                    : '0 8px 16px rgba(0, 0, 0, 0.2)'
                }}
              >
                {renderDoughnutChart()}
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default DashboardPage; 