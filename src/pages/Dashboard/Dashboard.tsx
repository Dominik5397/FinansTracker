import React, { useMemo, useCallback } from 'react';
import { 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Box,
  Skeleton,
  CircularProgress
} from '@mui/material';
import { 
  ArrowUpward, 
  ArrowDownward, 
  CalendarToday, 
  Add 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Transaction, Budget, Category } from '../../types';
import { motion } from 'framer-motion';

interface DashboardProps {
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  isLoading: boolean;
  userId: string;
}

const Dashboard: React.FC<DashboardProps> = React.memo(({ 
  transactions, 
  budgets, 
  categories, 
  isLoading,
  userId 
}) => {
  const navigate = useNavigate();

  // Animacje dla kontenera i elementów
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: 'spring',
        stiffness: 100,
        damping: 12
      }
    }
  };

  // Pulse animation
  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: 'loop' as const,
      }
    }
  };

  // Memoizacja obliczeń dla poprawy wydajności
  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    if (isLoading || transactions.length === 0) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0
      };
    }

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses
    };
  }, [transactions, isLoading]);

  // Memoizacja ostatnich transakcji
  const recentTransactions = useMemo(() => {
    if (isLoading || transactions.length === 0) {
      return [];
    }
    
    return transactions
      .slice(0, 5)
      .map(transaction => {
        const category = categories.find(cat => cat.id === transaction.categoryId);
        return {
          ...transaction,
          categoryName: category ? category.name : 'Inna',
          categoryColor: category ? category.color : '#757575'
        };
      });
  }, [transactions, categories, isLoading]);

  // Formatowanie waluty
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  }, []);

  // Formatowanie daty (zastąpione bez date-fns)
  const formatDate = useCallback((date: Date | string | { toDate(): Date } | any) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    };
    
    try {
      if (typeof date === 'string') {
        // Jeśli to string, próbujemy utworzyć obiekt Date
        return new Date(date).toLocaleDateString('pl-PL', options);
      } else if (date instanceof Date) {
        // Jeśli to już obiekt Date
        return date.toLocaleDateString('pl-PL', options);
      } else if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
        // Jeśli to obiekt Firestore Timestamp
        return date.toDate().toLocaleDateString('pl-PL', options);
      } else {
        // Fallback
        return 'Nieznana data';
      }
    } catch (error) {
      console.error('Błąd formatowania daty:', error, date);
      return 'Nieznana data';
    }
  }, []);

  // Callback dla akcji nawigacji
  const handleNavigateToTransactions = useCallback(() => {
    navigate('/transactions');
  }, [navigate]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Box mb={4}>
        <motion.div variants={itemVariants}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Witaj w FinansTracker
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            Twoje osobiste narzędzie do zarządzania finansami
          </Typography>
        </motion.div>
      </Box>

      <Grid container spacing={3}>
        {/* Saldo */}
        <Grid item xs={12} md={4}>
          <motion.div variants={itemVariants}>
            <Card className="hover-card">
              <CardContent>
                <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                  Bieżące saldo
                </Typography>
                {isLoading ? (
                  <Skeleton variant="text" width="80%" height={60} />
                ) : (
                  <Typography 
                    variant="h4" 
                    component="div" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: balance >= 0 ? 'success.main' : 'error.main'
                    }}
                  >
                    {formatCurrency(balance)}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Przychody */}
        <Grid item xs={12} md={4}>
          <motion.div variants={itemVariants}>
            <Card className="hover-card">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                    Przychody
                  </Typography>
                  <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                    <ArrowUpward sx={{ fontSize: 16 }} />
                  </Avatar>
                </Box>
                {isLoading ? (
                  <Skeleton variant="text" width="80%" height={60} />
                ) : (
                  <Typography 
                    variant="h4" 
                    component="div" 
                    sx={{ fontWeight: 'bold', color: 'success.main' }}
                  >
                    {formatCurrency(totalIncome)}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Wydatki */}
        <Grid item xs={12} md={4}>
          <motion.div variants={itemVariants}>
            <Card className="hover-card">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                    Wydatki
                  </Typography>
                  <Avatar sx={{ bgcolor: 'error.main', width: 32, height: 32 }}>
                    <ArrowDownward sx={{ fontSize: 16 }} />
                  </Avatar>
                </Box>
                {isLoading ? (
                  <Skeleton variant="text" width="80%" height={60} />
                ) : (
                  <Typography 
                    variant="h4" 
                    component="div" 
                    sx={{ fontWeight: 'bold', color: 'error.main' }}
                  >
                    {formatCurrency(totalExpenses)}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Ostatnie transakcje */}
        <Grid item xs={12} md={8}>
          <motion.div variants={itemVariants}>
            <Card className="hover-card">
              <CardHeader 
                title="Ostatnie transakcje" 
                action={
                  <Button 
                    startIcon={<Add />} 
                    color="primary" 
                    onClick={handleNavigateToTransactions}
                    className="animated-button"
                  >
                    Dodaj
                  </Button>
                }
              />
              <Divider />
              <CardContent sx={{ p: 0 }}>
                {isLoading ? (
                  Array(5).fill(0).map((_, index) => (
                    <Box key={index} sx={{ p: 2 }}>
                      <Skeleton variant="rectangular" height={40} />
                    </Box>
                  ))
                ) : recentTransactions.length > 0 ? (
                  <List sx={{ p: 0 }}>
                    {recentTransactions.map((transaction) => (
                      <ListItem key={transaction.id} divider>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: transaction.categoryColor }}>
                            {transaction.type === 'income' ? <ArrowUpward /> : <ArrowDownward />}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText 
                          primary={transaction.description} 
                          secondary={
                            <React.Fragment>
                              <CalendarToday fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: '0.8rem' }} />
                              {formatDate(transaction.date)}
                              <Typography 
                                component="span" 
                                variant="body2" 
                                sx={{ ml: 1, color: 'text.secondary' }}
                              >
                                {transaction.categoryName}
                              </Typography>
                            </React.Fragment>
                          } 
                        />
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 'medium',
                            color: transaction.type === 'income' ? 'success.main' : 'error.main' 
                          }}
                        >
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="textSecondary">
                      Brak transakcji
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Add />}
                      onClick={handleNavigateToTransactions}
                      sx={{ mt: 2 }}
                    >
                      Dodaj pierwszą transakcję
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Budżety */}
        <Grid item xs={12} md={4}>
          <motion.div variants={itemVariants}>
            <Card 
              className="hover-card"
              sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <CardHeader title="Moje budżety" />
              <Divider />
              <CardContent sx={{ 
                p: 0, 
                flex: '1 1 auto',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: budgets.length === 0 && !isLoading ? 'center' : 'flex-start'
              }}>
                {isLoading ? (
                  Array(3).fill(0).map((_, index) => (
                    <Box key={index} sx={{ p: 2 }}>
                      <Skeleton variant="rectangular" height={30} />
                      <Skeleton variant="rectangular" height={6} sx={{ mt: 1 }} />
                    </Box>
                  ))
                ) : budgets.length > 0 ? (
                  <List sx={{ p: 0 }}>
                    {budgets.map(budget => {
                      const categoryExpenses = transactions
                        .filter(t => t.type === 'expense' && t.categoryId === budget.categoryId)
                        .reduce((sum, t) => sum + t.amount, 0);
                      
                      const percentage = Math.min(100, (categoryExpenses / budget.amount) * 100);
                      const category = categories.find(c => c.id === budget.categoryId);
                      
                      return (
                        <ListItem key={budget.id} divider>
                          <ListItemIcon>
                            <Avatar sx={{ bgcolor: category?.color || '#757575' }}>
                              {category?.icon || '?'}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText 
                            primary={category?.name || 'Budżet'} 
                            secondary={
                              <React.Fragment>
                                <Box sx={{ mt: 1, width: '100%', bgcolor: 'background.paper', borderRadius: 1, overflow: 'hidden' }}>
                                  <Box 
                                    sx={{ 
                                      height: 8, 
                                      width: `${percentage}%`, 
                                      bgcolor: percentage > 80 ? 'error.main' : percentage > 60 ? 'warning.main' : 'success.main',
                                      transition: 'width 0.5s ease-in-out'
                                    }} 
                                  />
                                </Box>
                                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                  {formatCurrency(categoryExpenses)} z {formatCurrency(budget.amount)} ({percentage.toFixed(0)}%)
                                </Typography>
                              </React.Fragment>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="textSecondary">
                      Brak budżetów
                    </Typography>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<Add />}
                      sx={{ mt: 2 }}
                    >
                      Dodaj budżet
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {isLoading && (
        <Box sx={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'rgba(255,255,255,0.7)',
          zIndex: 9999
        }}>
          <CircularProgress />
        </Box>
      )}
    </motion.div>
  );
});

export default Dashboard; 