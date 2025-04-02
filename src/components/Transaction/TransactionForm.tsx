import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select,
  MenuItem, 
  FormHelperText,
  Grid,
  Typography,
  IconButton,
  Slide,
  Box
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon } from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Category, Transaction } from '../../types';

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  categories: Category[];
  transaction?: Transaction | any;
  onSuccess: () => void;
}

// Animacja dla dialogu
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const TransactionForm: React.FC<TransactionFormProps> = ({
  open,
  onClose,
  userId,
  categories,
  transaction,
  onSuccess
}) => {
  // Stany formularza
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  
  // Stany błędów
  const [errors, setErrors] = useState({
    description: false,
    amount: false,
    categoryId: false,
    date: false
  });

  // Animacja dla elementów formularza
  const formItemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20 
    },
    visible: (i: number) => ({ 
      opacity: 1, 
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
        ease: 'easeOut'
      }
    })
  };

  // Sprawdzanie, czy to edycja istniejącej transakcji
  const isEditMode = !!transaction;

  // Ustawienie danych z istniejącej transakcji (jeśli dostępna)
  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAmount(transaction.amount.toString());
      setCategoryId(transaction.categoryId);
      
      // Formatowanie daty
      let transactionDate;
      try {
        if (typeof transaction.date === 'string') {
          transactionDate = new Date(transaction.date).toISOString().split('T')[0];
        } else if (transaction.date instanceof Date) {
          transactionDate = transaction.date.toISOString().split('T')[0];
        } else if (transaction.date && typeof transaction.date === 'object' && 'toDate' in transaction.date) {
          transactionDate = transaction.date.toDate().toISOString().split('T')[0];
        } else {
          transactionDate = new Date().toISOString().split('T')[0];
        }
      } catch (error) {
        console.error('Błąd podczas formatowania daty transakcji:', error);
        transactionDate = new Date().toISOString().split('T')[0];
      }
      
      setDate(transactionDate);
      setType(transaction.type);
    }
  }, [transaction]);

  // Walidacja formularza
  const validateForm = () => {
    const newErrors = {
      description: description.trim() === '',
      amount: amount.trim() === '' || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0,
      categoryId: categoryId === '',
      date: date === ''
    };
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  // Obsługa zapisywania transakcji
  const handleSave = async () => {
    if (!validateForm()) return;

    const transactionData = {
      userId,
      description,
      amount: parseFloat(amount),
      categoryId,
      type,
      date: new Date(date),
      createdAt: serverTimestamp()
    };

    try {
      if (isEditMode && transaction) {
        // Aktualizacja istniejącej transakcji
        await updateDoc(doc(db, 'users', userId, 'transactions', transaction.id), transactionData);
      } else {
        // Dodanie nowej transakcji
        await addDoc(collection(db, 'users', userId, 'transactions'), transactionData);
      }
      
      // Resetowanie formularza i zamknięcie
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Błąd podczas zapisywania transakcji:', error);
    }
  };

  // Resetowanie formularza
  const resetForm = () => {
    setDescription('');
    setAmount('');
    setCategoryId('');
    setDate(new Date().toISOString().split('T')[0]);
    setType('expense');
    setErrors({
      description: false,
      amount: false,
      categoryId: false,
      date: false
    });
  };

  // Filtrowanie kategorii według typu (przychód/wydatek)
  const filteredCategories = categories.filter(category => 
    category.type === type
  );

  // Diagnostyka - sprawdzenie czy kategorie są poprawnie filtrowane
  console.log('TransactionForm - wszystkie kategorie:', categories);
  console.log('TransactionForm - typ transakcji:', type);
  console.log('TransactionForm - przefiltrowane kategorie:', filteredCategories);

  // Sprawdzenie struktury kategorii
  if (categories.length > 0) {
    console.log('TransactionForm - przykładowa kategoria:', categories[0]);
    console.log('TransactionForm - czy kategoria ma pole type:', 'type' in categories[0]);
    console.log('TransactionForm - wartość pola type:', categories[0].type);
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      TransitionComponent={Transition}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1, 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          {isEditMode ? 'Edytuj transakcję' : 'Dodaj nową transakcję'}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: 'grey.500',
          }}
          component={motion.button}
          whileHover={{ 
            rotate: 90,
            scale: 1.1
          }}
          whileTap={{ scale: 0.9 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <AnimatePresence>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: { staggerChildren: 0.1 }
              }
            }}
          >
            {/* Typ transakcji */}
            <motion.div variants={formItemVariants} custom={0}>
              <Box sx={{ mb: 2, pt: 1 }}>
                <FormControl fullWidth>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant={type === 'expense' ? 'contained' : 'outlined'}
                        color="error"
                        onClick={() => setType('expense')}
                        sx={{ 
                          py: 1,
                          borderRadius: 2,
                          boxShadow: type === 'expense' ? 2 : 0
                        }}
                      >
                        Wydatek
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant={type === 'income' ? 'contained' : 'outlined'}
                        color="success"
                        onClick={() => setType('income')}
                        sx={{ 
                          py: 1, 
                          borderRadius: 2,
                          boxShadow: type === 'income' ? 2 : 0
                        }}
                      >
                        Przychód
                      </Button>
                    </Grid>
                  </Grid>
                </FormControl>
              </Box>
            </motion.div>

            {/* Opis transakcji */}
            <motion.div variants={formItemVariants} custom={1}>
              <TextField
                margin="dense"
                label="Opis transakcji"
                type="text"
                fullWidth
                required
                value={description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                error={errors.description}
                helperText={errors.description ? 'Opis jest wymagany' : ''}
                sx={{ mb: 2 }}
              />
            </motion.div>

            {/* Kwota */}
            <motion.div variants={formItemVariants} custom={2}>
              <TextField
                margin="dense"
                label="Kwota (PLN)"
                type="number"
                fullWidth
                required
                value={amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                error={errors.amount}
                helperText={errors.amount ? 'Podaj prawidłową kwotę' : ''}
                InputProps={{ 
                  inputProps: { min: 0, step: 0.01 },
                  sx: { 
                    '& input': { 
                      color: type === 'expense' ? 'error.main' : 'success.main',
                      fontWeight: 'bold' 
                    } 
                  }
                }}
                sx={{ mb: 2 }}
              />
            </motion.div>

            {/* Kategoria */}
            <motion.div variants={formItemVariants} custom={3}>
              <FormControl fullWidth required error={errors.categoryId} sx={{ mb: 2 }}>
                <InputLabel id="category-label">Kategoria</InputLabel>
                <Select<string>
                  labelId="category-label"
                  id="category"
                  value={categoryId}
                  label="Kategoria"
                  // @ts-ignore - ignorujemy błąd typowania dla zdarzenia onChange
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {filteredCategories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%', 
                            bgcolor: category.color, 
                            mr: 1 
                          }} 
                        />
                        {category.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.categoryId && <FormHelperText>Wybierz kategorię</FormHelperText>}
              </FormControl>
            </motion.div>

            {/* Data */}
            <motion.div variants={formItemVariants} custom={4}>
              <TextField
                margin="dense"
                label="Data"
                type="date"
                fullWidth
                required
                value={date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
                error={errors.date}
                helperText={errors.date ? 'Data jest wymagana' : ''}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 1 }}
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={onClose}
          color="inherit"
          sx={{ borderRadius: 2 }}
        >
          Anuluj
        </Button>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            onClick={handleSave}
            variant="contained"
            color={type === 'expense' ? 'error' : 'success'}
            startIcon={<AddIcon />}
            sx={{ 
              px: 3, 
              borderRadius: 2,
              boxShadow: 3,
              fontWeight: 'bold'
            }}
          >
            {isEditMode ? 'Zapisz zmiany' : 'Dodaj transakcję'}
          </Button>
        </motion.div>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionForm; 