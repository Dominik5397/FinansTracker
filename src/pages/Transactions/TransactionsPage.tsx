import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Button, 
  Card,
  CardContent,
  Skeleton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Add, 
  ArrowUpward, 
  ArrowDownward,
  Delete, 
  Edit,
  CalendarToday
} from '@mui/icons-material';
import { Transaction, Category } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import TransactionForm from '../../components/Transaction/TransactionForm';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface TransactionsPageProps {
  transactions: Transaction[];
  categories: Category[];
  isLoading: boolean;
  userId: string;
  fetchTransactions: () => void;
}

const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  categories,
  isLoading,
  userId,
  fetchTransactions
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Dodanie logowania dla debugowania
  console.log('TransactionsPage - otrzymane kategorie:', categories);
  console.log('TransactionsPage - czy kategorie to tablica?', Array.isArray(categories));
  console.log('TransactionsPage - liczba kategorii:', categories ? categories.length : 0);
  
  if (categories && categories.length > 0) {
    console.log('TransactionsPage - przykładowa kategoria:', categories[0]);
  }

  // Animacje dla kontenera i elementów
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    },
    exit: { opacity: 0 }
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

  // Formatowanie waluty
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  // Formatowanie daty (zastąpione bez date-fns)
  const formatDate = (date: Date | string | any) => {
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
  };

  // Filtrowanie transakcji na podstawie wybranej zakładki
  const filteredTransactions = transactions.filter(transaction => {
    if (tabValue === 0) return true; // Wszystkie
    if (tabValue === 1) return transaction.type === 'income'; // Przychody
    if (tabValue === 2) return transaction.type === 'expense'; // Wydatki
    return true;
  });

  // Mapowanie transakcji na dane z kategorią
  const processedTransactions = filteredTransactions.map(transaction => {
    const category = categories.find(cat => cat.id === transaction.categoryId);
    return {
      ...transaction,
      categoryName: category ? category.name : 'Inna',
      categoryColor: category ? category.color : '#757575'
    };
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddTransaction = () => {
    setSelectedTransaction(undefined);
    setFormOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setFormOpen(true);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'users', userId, 'transactions', transactionToDelete));
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
      fetchTransactions();
      showSnackbar('Transakcja została usunięta', 'success');
    } catch (error) {
      console.error('Błąd podczas usuwania transakcji:', error);
      showSnackbar('Nie udało się usunąć transakcji', 'error');
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedTransaction(undefined);
  };

  const handleFormSuccess = () => {
    fetchTransactions();
    showSnackbar(
      selectedTransaction ? 'Transakcja została zaktualizowana' : 'Transakcja została dodana', 
      'success'
    );
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <Box mb={4}>
        <motion.div variants={itemVariants}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Transakcje
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={handleAddTransaction}
              className="animated-button"
              disabled={categories.length === 0}
            >
              Dodaj transakcję
            </Button>
          </Box>
          <Typography variant="body1" color="textSecondary">
            Zarządzaj swoimi transakcjami
          </Typography>
        </motion.div>
      </Box>

      {categories.length === 0 ? (
        <Card className="hover-card">
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="error" gutterBottom>
              Brak kategorii
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              Nie można dodać transakcji, ponieważ nie znaleziono kategorii w bazie danych.
              Kliknij przycisk DevTools (fioletowy w prawym dolnym rogu) i użyj opcji "Dodaj domyślne kategorie".
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => window.location.reload()}
              sx={{ mt: 2 }}
            >
              Odśwież stronę
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="hover-card">
          <CardContent>
            <motion.div variants={itemVariants}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange} 
                  aria-label="transaction tabs"
                  centered
                >
                  <Tab label="Wszystkie" />
                  <Tab label="Przychody" />
                  <Tab label="Wydatki" />
                </Tabs>
              </Box>
            </motion.div>

            {isLoading ? (
              <Box>
                {Array(5).fill(0).map((_, index) => (
                  <Box sx={{ mb: 2 }} key={index}>
                    <Skeleton variant="rectangular" height={70} />
                  </Box>
                ))}
              </Box>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={tabValue}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {processedTransactions.length > 0 ? (
                    <List>
                      {processedTransactions.map((transaction, index) => (
                        <motion.div
                          key={transaction.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="list-item-appear"
                        >
                          <ListItem
                            divider={index < processedTransactions.length - 1}
                            secondaryAction={
                              <Box>
                                <IconButton 
                                  edge="end" 
                                  aria-label="edit"
                                  onClick={() => handleEditTransaction(transaction)}
                                  className="rotate-icon"
                                >
                                  <Edit />
                                </IconButton>
                                <IconButton 
                                  edge="end" 
                                  aria-label="delete"
                                  onClick={() => handleDeleteTransaction(transaction.id)}
                                  className="rotate-icon"
                                  sx={{ ml: 1 }}
                                >
                                  <Delete />
                                </IconButton>
                              </Box>
                            }
                          >
                            <ListItemIcon>
                              <Avatar 
                                sx={{ 
                                  bgcolor: transaction.type === 'income' ? 'success.main' : 'error.main',
                                  width: 40,
                                  height: 40
                                }}
                              >
                                {transaction.type === 'income' ? 
                                  <ArrowUpward fontSize="small" /> : 
                                  <ArrowDownward fontSize="small" />
                                }
                              </Avatar>
                            </ListItemIcon>
                            <ListItemText 
                              primary={transaction.description}
                              secondary={
                                <React.Fragment>
                                  <Typography component="span" variant="body2" color="textSecondary">
                                    {transaction.categoryName}
                                  </Typography>
                                  {" • "}
                                  <Typography component="span" variant="body2" color="textSecondary">
                                    <CalendarToday sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
                                    {formatDate(transaction.date)}
                                  </Typography>
                                </React.Fragment>
                              }
                            />
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: transaction.type === 'income' ? 'success.main' : 'error.main',
                                mr: 2
                              }}
                            >
                              {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                            </Typography>
                          </ListItem>
                        </motion.div>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="body1" color="textSecondary" gutterBottom>
                        Brak transakcji do wyświetlenia
                      </Typography>
                      <Button 
                        variant="contained" 
                        startIcon={<Add />} 
                        sx={{ mt: 2 }}
                        onClick={handleAddTransaction}
                        className="animated-button"
                      >
                        Dodaj pierwszą transakcję
                      </Button>
                    </Box>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </CardContent>
        </Card>
      )}

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

      {/* Formularz transakcji */}
      <TransactionForm
        open={formOpen}
        onClose={handleFormClose}
        userId={userId}
        categories={categories}
        transaction={selectedTransaction}
        onSuccess={handleFormSuccess}
      />

      {/* Dialog potwierdzenia usunięcia */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Potwierdź usunięcie</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Czy na pewno chcesz usunąć tę transakcję? Tej operacji nie można cofnąć.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Anuluj
          </Button>
          <Button onClick={confirmDeleteTransaction} color="error" variant="contained">
            Usuń
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar z powiadomieniami */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </motion.div>
  );
};

export default TransactionsPage; 