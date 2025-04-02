import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  Dialog,
  DialogTitle,
  DialogContent, 
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  LinearProgress,
  Avatar,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Divider,
  CircularProgress
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  BarChart as BarChartIcon 
} from '@mui/icons-material';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Transaction, Budget, Category } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface BudgetPageProps {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  isLoading: boolean;
  userId: string;
  fetchTransactions: () => void;
}

const BudgetPage: React.FC<BudgetPageProps> = ({
  transactions,
  categories,
  budgets,
  isLoading,
  userId,
  fetchTransactions
}) => {
  // Stan lokalny
  const [formOpen, setFormOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    period: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
  });
  const [formErrors, setFormErrors] = useState({
    categoryId: false,
    amount: false,
    startDate: false,
    endDate: false
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Animacje
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 10 }
    }
  };

  // Helpers
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  const calculateUsage = (budget: Budget) => {
    // Filtrowanie transakcji z podanej kategorii w okresie budżetu
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

    const totalSpent = budgetTransactions.reduce((sum, t) => sum + t.amount, 0);
    const percentage = Math.min(100, (totalSpent / budget.amount) * 100);

    return {
      spent: totalSpent,
      percentage: percentage,
      status: percentage < 70 ? 'good' : percentage < 90 ? 'warning' : 'danger'
    };
  };

  const getCategoryById = (categoryId: string) => {
    return categories.find(c => c.id === categoryId) || null;
  };

  // Obsługa formularza
  const handleOpenForm = (budget?: Budget) => {
    if (budget) {
      setSelectedBudget(budget);
      setFormData({
        categoryId: budget.categoryId,
        amount: budget.amount.toString(),
        period: budget.period,
        startDate: new Date(budget.startDate as string).toISOString().split('T')[0],
        endDate: new Date(budget.endDate as string).toISOString().split('T')[0]
      });
    } else {
      setSelectedBudget(null);
      setFormData({
        categoryId: '',
        amount: '',
        period: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
      });
    }
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedBudget(null);
    setFormErrors({
      categoryId: false,
      amount: false,
      startDate: false,
      endDate: false
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name as string]: value });
  };

  const validateForm = () => {
    const errors = {
      categoryId: formData.categoryId === '',
      amount: formData.amount === '' || parseFloat(formData.amount) <= 0,
      startDate: formData.startDate === '',
      endDate: formData.endDate === ''
    };
    
    setFormErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const handleSaveBudget = async () => {
    if (!validateForm()) return;

    try {
      const budgetData = {
        userId,
        categoryId: formData.categoryId,
        amount: parseFloat(formData.amount),
        period: formData.period,
        startDate: formData.startDate,
        endDate: formData.endDate,
        createdAt: serverTimestamp()
      };

      if (selectedBudget) {
        // Aktualizacja istniejącego budżetu
        await updateDoc(doc(db, 'users', userId, 'budgets', selectedBudget.id), budgetData);
        showSnackbar('Budżet został zaktualizowany', 'success');
      } else {
        // Dodanie nowego budżetu
        await addDoc(collection(db, 'users', userId, 'budgets'), budgetData);
        showSnackbar('Budżet został dodany', 'success');
      }

      fetchTransactions(); // Odświeżenie danych
      handleCloseForm();
    } catch (error) {
      console.error('Błąd podczas zapisywania budżetu:', error);
      showSnackbar('Wystąpił błąd podczas zapisywania budżetu', 'error');
    }
  };

  // Obsługa usuwania
  const handleOpenDeleteDialog = (budgetId: string) => {
    setBudgetToDelete(budgetId);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setBudgetToDelete(null);
  };

  const handleDeleteBudget = async () => {
    if (!budgetToDelete) return;

    try {
      await deleteDoc(doc(db, 'users', userId, 'budgets', budgetToDelete));
      showSnackbar('Budżet został usunięty', 'success');
      fetchTransactions(); // Odświeżenie danych
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Błąd podczas usuwania budżetu:', error);
      showSnackbar('Wystąpił błąd podczas usuwania budżetu', 'error');
    }
  };

  // Snackbar
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Filtrowanie tylko kategorii wydatków
  const expenseCategories = categories.filter(category => category.type === 'expense');

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Box mb={4}>
        <motion.div variants={itemVariants}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Budżety
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => handleOpenForm()}
              disabled={expenseCategories.length === 0}
              className="animated-button"
              sx={{ 
                px: 3,
                py: 1,
                fontWeight: 'bold',
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
              }}
            >
              Dodaj budżet
            </Button>
          </Box>
          <Typography variant="body1" color="textSecondary">
            Zarządzaj swoimi budżetami i kontroluj wydatki
          </Typography>
        </motion.div>
      </Box>

      {isLoading ? (
        <Box sx={{ width: '100%', textAlign: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : expenseCategories.length === 0 ? (
        <Card className="glass-card">
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="error" gutterBottom>
              Brak kategorii wydatków
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              Aby dodać budżet, najpierw dodaj kategorie wydatków.
              Użyj przycisku DevTools w prawym dolnym rogu i wybierz "Dodaj domyślne kategorie".
            </Typography>
          </CardContent>
        </Card>
      ) : budgets.length === 0 ? (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <motion.div variants={itemVariants}>
            <Card sx={{ maxWidth: 600, mx: 'auto', mb: 4, p: 4 }} className="glass-card card-hover-effect">
              <CardContent sx={{ textAlign: 'center' }}>
                <BarChartIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Nie masz jeszcze żadnych budżetów
                </Typography>
                <Typography variant="body1" color="textSecondary" paragraph>
                  Budżety pomogą Ci kontrolować wydatki i osiągać cele finansowe.
                  Zacznij od dodania swojego pierwszego budżetu.
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />} 
                  onClick={() => handleOpenForm()}
                  sx={{ mt: 2 }}
                  className="animated-button"
                >
                  Dodaj pierwszy budżet
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </Box>
      ) : (
        <Grid container spacing={3}>
          <AnimatePresence>
            {budgets.map((budget, index) => {
              const usage = calculateUsage(budget);
              const category = getCategoryById(budget.categoryId);
              
              return (
                <Grid item xs={12} md={6} key={budget.id}>
                  <motion.div 
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, y: 20 }}
                    layout
                  >
                    <Card className="glass-card card-hover-effect">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {category && (
                              <Avatar sx={{ 
                                bgcolor: category.color, 
                                mr: 2,
                                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                border: '2px solid rgba(255, 255, 255, 0.2)'
                              }}>
                                {category.icon && category.icon.charAt(0).toUpperCase()}
                              </Avatar>
                            )}
                            <Typography variant="h6" className="gradient-text">
                              {category ? category.name : 'Nieznana kategoria'}
                            </Typography>
                          </Box>
                          <Box>
                            <Tooltip title="Edytuj">
                              <IconButton 
                                onClick={() => handleOpenForm(budget)}
                                sx={{
                                  '&:hover': { bgcolor: 'rgba(63, 81, 181, 0.1)' }
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Usuń">
                              <IconButton 
                                onClick={() => handleOpenDeleteDialog(budget.id)}
                                sx={{
                                  '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.1)' }
                                }}
                              >
                                <DeleteIcon color="error" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                        
                        <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
                          {formatCurrency(budget.amount)}
                        </Typography>
                        
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                          Okres: {budget.period === 'monthly' ? 'Miesięcznie' : 
                                  budget.period === 'weekly' ? 'Tygodniowo' : 
                                  budget.period === 'yearly' ? 'Rocznie' : 'Dziennie'}
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">Wydano: {formatCurrency(usage.spent)}</Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: usage.status === 'danger' ? 'error.main' : 
                                      usage.status === 'warning' ? 'warning.main' : 'success.main'
                              }}
                            >
                              {usage.percentage.toFixed(0)}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={usage.percentage} 
                            color={
                              usage.status === 'danger' ? 'error' : 
                              usage.status === 'warning' ? 'warning' : 'success'
                            }
                            sx={{ 
                              height: 10, 
                              borderRadius: 5,
                              '.MuiLinearProgress-bar': {
                                borderRadius: 5
                              }
                            }}
                            className="progress-bar"
                          />
                        </Box>
                        
                        <Typography variant="body2" color="textSecondary">
                          Od {new Date(budget.startDate as string).toLocaleDateString('pl-PL')} 
                          do {new Date(budget.endDate as string).toLocaleDateString('pl-PL')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </AnimatePresence>
        </Grid>
      )}

      {/* Formularz dodawania/edycji budżetu */}
      <Dialog 
        open={formOpen} 
        onClose={handleCloseForm} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          className: 'glass-card',
          sx: {
            borderRadius: '20px',
            backdropFilter: 'blur(10px)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 3, px: 3 }}>
          <Typography variant="h5" component="div" fontWeight="bold" className="gradient-text">
            {selectedBudget ? 'Edytuj budżet' : 'Dodaj nowy budżet'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth error={formErrors.categoryId} sx={{ mb: 3 }}>
              <InputLabel>Kategoria</InputLabel>
              <Select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                label="Kategoria"
                className="custom-input"
              >
                {expenseCategories.map(category => (
                  <MenuItem key={category.id} value={category.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: category.color, 
                          width: 24, 
                          height: 24, 
                          mr: 1.5,
                          fontSize: '0.8rem'
                        }}
                      >
                        {category.icon && category.icon.charAt(0).toUpperCase()}
                      </Avatar>
                      {category.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {formErrors.categoryId && <FormHelperText>Wybierz kategorię</FormHelperText>}
            </FormControl>

            <TextField
              name="amount"
              label="Kwota budżetu"
              type="number"
              value={formData.amount}
              onChange={handleInputChange}
              fullWidth
              error={formErrors.amount}
              helperText={formErrors.amount ? 'Wprowadź poprawną kwotę' : ''}
              sx={{ mb: 3 }}
              className="custom-input"
              InputProps={{
                startAdornment: (
                  <Box component="span" sx={{ mr: 1, color: 'text.secondary' }}>
                    PLN
                  </Box>
                ),
              }}
            />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Okres</InputLabel>
              <Select
                name="period"
                value={formData.period}
                onChange={handleInputChange}
                label="Okres"
                className="custom-input"
              >
                <MenuItem value="daily">Dzienny</MenuItem>
                <MenuItem value="weekly">Tygodniowy</MenuItem>
                <MenuItem value="monthly">Miesięczny</MenuItem>
                <MenuItem value="yearly">Roczny</MenuItem>
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  name="startDate"
                  label="Data początkowa"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  fullWidth
                  error={formErrors.startDate}
                  helperText={formErrors.startDate ? 'Wybierz datę' : ''}
                  InputLabelProps={{ shrink: true }}
                  className="custom-input"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="endDate"
                  label="Data końcowa"
                  type="date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  fullWidth
                  error={formErrors.endDate}
                  helperText={formErrors.endDate ? 'Wybierz datę' : ''}
                  InputLabelProps={{ shrink: true }}
                  className="custom-input"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseForm}
            sx={{ 
              px: 3,
              borderRadius: '10px'
            }}
          >
            Anuluj
          </Button>
          <Button 
            onClick={handleSaveBudget} 
            variant="contained"
            className="animated-button"
            sx={{ 
              px: 3,
              borderRadius: '10px',
              fontWeight: 'bold'
            }}
          >
            Zapisz
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog potwierdzenia usunięcia */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={handleCloseDeleteDialog}
        PaperProps={{
          className: 'glass-card',
          sx: {
            borderRadius: '20px',
            backdropFilter: 'blur(10px)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 3 }}>
          <Typography variant="h5" component="div" fontWeight="bold" color="error">
            Potwierdź usunięcie
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pt: 1 }}>
          <Typography>Czy na pewno chcesz usunąć ten budżet? Tej operacji nie można cofnąć.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseDeleteDialog}
            sx={{ 
              px: 3,
              borderRadius: '10px'
            }}
          >
            Anuluj
          </Button>
          <Button 
            onClick={handleDeleteBudget} 
            color="error" 
            variant="contained"
            sx={{ 
              px: 3,
              borderRadius: '10px',
              fontWeight: 'bold'
            }}
          >
            Usuń
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar do powiadomień */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={motion.div}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity} 
          sx={{ 
            width: '100%',
            borderRadius: '12px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
            fontSize: '1rem',
            alignItems: 'center',
            backdropFilter: 'blur(10px)',
            backgroundColor: snackbarSeverity === 'success' 
              ? 'rgba(76, 175, 80, 0.9)' 
              : 'rgba(244, 67, 54, 0.9)',
            color: '#fff',
            fontWeight: 'bold'
          }}
          elevation={6}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </motion.div>
  );
};

export default BudgetPage; 