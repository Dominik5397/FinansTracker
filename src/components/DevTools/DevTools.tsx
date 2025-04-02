import React, { useState } from 'react';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Box, 
  Typography, 
  IconButton,
  Fab,
  Snackbar,
  Alert,
  Grid,
  Divider
} from '@mui/material';
import { BugReport, Add, Search, CleaningServices, Refresh } from '@mui/icons-material';
import { addCategory, getCategories, cleanupDuplicateCategories } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../services/firebase';

// Lista ikon Material-UI do wyboru
const availableIcons = [
  'restaurant', 'directions_car', 'receipt', 'shopping_cart', 'movie', 
  'local_hospital', 'school', 'more_horiz', 'work', 'laptop', 
  'trending_up', 'replay', 'card_giftcard', 'home', 'attach_money',
  'book', 'flight', 'hotel', 'sports_basketball', 'fitness_center',
  'pets', 'child_care', 'cake', 'local_cafe', 'local_bar', 'spa',
  'beach_access', 'ac_unit', 'build', 'camera', 'computer', 'phone_android'
];

// Lista kolorów do wyboru
const availableColors = [
  '#FF5722', '#2196F3', '#F44336', '#9C27B0', '#FF9800', '#4CAF50', 
  '#607D8B', '#795548', '#00BCD4', '#3F51B5', '#8BC34A', '#E91E63', 
  '#009688', '#673AB7', '#FFEB3B', '#FFC107', '#03A9F4', '#5D4037'
];

// Dynamiczne renderowanie ikon Material-UI
const DynamicIcon = ({ iconName }: { iconName: string }) => {
  // @ts-ignore - ignorujemy błąd typowania dla dynamicznych ikon
  const Icon = (props: any) => {
    const MaterialIcon = require('@mui/icons-material')[iconName.charAt(0).toUpperCase() + iconName.slice(1)];
    return MaterialIcon ? <MaterialIcon {...props} /> : null;
  };
  
  return <Icon />;
};

// Lista ikon Material-UI do wyboru
const iconOptions = [
  'more_horiz', 'home', 'work', 'shopping_cart', 'restaurant', 'local_cafe',
  'directions_car', 'train', 'flight', 'local_gas_station', 'local_hospital', 
  'school', 'book', 'movie', 'sports', 'fitness_center', 'beach_access',
  'receipt', 'card_giftcard', 'laptop', 'trending_up', 'replay', 'account_balance'
];

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

const DevTools: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  
  const [categoryData, setCategoryData] = useState({
    name: '',
    icon: 'more_horiz',
    color: '#4CAF50',
    type: 'expense'
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setCategoryData({
      ...categoryData,
      [name as string]: value
    });
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleAddCategory = async () => {
    try {
      await addCategory({
        name: categoryData.name,
        icon: categoryData.icon,
        color: categoryData.color,
        type: categoryData.type as 'income' | 'expense'
      });
      showSnackbar(`Kategoria "${categoryData.name}" została dodana pomyślnie!`, 'success');
      setCategoryData({
        name: '',
        icon: 'more_horiz',
        color: '#4CAF50',
        type: 'expense'
      });
    } catch (error) {
      console.error('Błąd podczas dodawania kategorii:', error);
      showSnackbar('Wystąpił błąd podczas dodawania kategorii.', 'error');
    }
  };

  const handleGetCategories = async () => {
    try {
      const categories = await getCategories();
      if (categories.length > 0) {
        showSnackbar(`Znaleziono ${categories.length} kategorii. Szczegóły w konsoli.`, 'success');
      } else {
        showSnackbar('Nie znaleziono żadnych kategorii w bazie danych.', 'error');
      }
    } catch (error) {
      console.error('Błąd podczas pobierania kategorii:', error);
      showSnackbar('Wystąpił błąd podczas pobierania kategorii.', 'error');
    }
  };

  const handleCleanupCategories = async () => {
    try {
      showSnackbar('Rozpoczynam czyszczenie duplikatów kategorii...', 'success');
      const uniqueCategories = await cleanupDuplicateCategories();
      if (uniqueCategories.length > 0) {
        showSnackbar(`Czyszczenie zakończone. Zachowano ${uniqueCategories.length} unikalnych kategorii.`, 'success');
        // Odśwież stronę po migracji
        setTimeout(() => window.location.reload(), 3000);
      } else {
        showSnackbar('Nie znaleziono kategorii do czyszczenia.', 'error');
      }
    } catch (error) {
      console.error('Błąd podczas czyszczenia duplikatów kategorii:', error);
      showSnackbar('Wystąpił błąd podczas czyszczenia kategorii.', 'error');
    }
  };

  // Funkcja do dodawania domyślnych kategorii
  const handleAddDefaultCategories = async () => {
    try {
      showSnackbar('Rozpoczynam dodawanie domyślnych kategorii...', 'success');
      
      const auth = getAuth();
      const user = auth?.currentUser;
      
      if (!user) {
        showSnackbar('Użytkownik nie jest zalogowany!', 'error');
        return;
      }
      
      // Sprawdź, czy użytkownik ma już jakieś kategorie
      const categories = await getCategories();
      if (categories.length > 0) {
        showSnackbar(`Użytkownik ma już ${categories.length} kategorii. Dodaję tylko brakujące...`, 'success');
      }
      
      // Przygotuj mapę istniejących kategorii do sprawdzenia, których brakuje
      const existingCategoryMap = new Map();
      categories.forEach(cat => {
        existingCategoryMap.set(`${cat.name}-${cat.type}`, cat);
      });
      
      // Dodaj tylko te kategorie, których nie ma
      const categoriesRef = collection(db, 'users', user.uid, 'categories');
      let addedCount = 0;
      
      for (const category of defaultCategories) {
        const key = `${category.name}-${category.type}`;
        if (!existingCategoryMap.has(key)) {
          try {
            const newCategory = {
              ...category,
              createdAt: serverTimestamp()
            };
            
            await addDoc(categoriesRef, newCategory);
            addedCount++;
            console.log(`Dodano kategorię: ${category.name} (${category.type})`);
          } catch (error) {
            console.error(`Błąd podczas dodawania kategorii ${category.name}:`, error);
          }
        }
      }
      
      if (addedCount > 0) {
        showSnackbar(`Dodano ${addedCount} brakujących kategorii!`, 'success');
        // Odśwież stronę po dodaniu kategorii
        setTimeout(() => window.location.reload(), 3000);
      } else {
        showSnackbar('Wszystkie domyślne kategorie już istnieją.', 'success');
      }
    } catch (error) {
      console.error('Błąd podczas dodawania domyślnych kategorii:', error);
      showSnackbar('Wystąpił błąd podczas dodawania domyślnych kategorii.', 'error');
    }
  };

  const isFormValid = () => {
    return categoryData.name.trim() !== '';
  };

  return (
    <>
      {process.env.NODE_ENV === 'development' && (
        <Fab
          color="secondary"
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000
          }}
          onClick={handleOpen}
        >
          <BugReport />
        </Fab>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Narzędzia deweloperskie
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box my={2}>
            <Typography variant="h6" gutterBottom>
              Dodaj nową kategorię do bazy danych
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nazwa kategorii"
                  name="name"
                  value={categoryData.name}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Typ</InputLabel>
                  <Select
                    name="type"
                    value={categoryData.type}
                    onChange={handleChange}
                    label="Typ"
                  >
                    <MenuItem value="expense">Wydatek</MenuItem>
                    <MenuItem value="income">Przychód</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box my={2}>
              <Typography variant="subtitle1" gutterBottom>
                Wybierz ikonę:
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  p: 1
                }}
              >
                {availableIcons.map((icon) => (
                  <IconButton
                    key={icon}
                    onClick={() => setCategoryData({ ...categoryData, icon })}
                    sx={{
                      border: categoryData.icon === icon ? `2px solid ${categoryData.color}` : 'none',
                      borderRadius: 1,
                      p: 1
                    }}
                  >
                    <DynamicIcon iconName={icon} />
                  </IconButton>
                ))}
              </Box>
            </Box>

            <Box my={2}>
              <Typography variant="subtitle1" gutterBottom>
                Wybierz kolor:
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  maxHeight: '120px',
                  overflowY: 'auto',
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  p: 1
                }}
              >
                {availableColors.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setCategoryData({ ...categoryData, color })}
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: color,
                      borderRadius: 1,
                      cursor: 'pointer',
                      border: categoryData.color === color ? '3px solid black' : 'none',
                      '&:hover': {
                        opacity: 0.8
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Box mt={3} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="subtitle1">Podgląd:</Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: categoryData.color,
                  color: '#fff',
                  p: 1,
                  borderRadius: 1,
                  width: 'fit-content'
                }}
              >
                <DynamicIcon iconName={categoryData.icon} />
                <Typography>{categoryData.name || 'Nazwa kategorii'}</Typography>
              </Box>
              <Typography variant="body2" sx={{ ml: 2 }}>
                Typ: {categoryData.type === 'expense' ? 'Wydatek' : 'Przychód'}
              </Typography>
            </Box>
          </Box>

          <Box mt={4} mb={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={handleAddCategory}
              disabled={!isFormValid()}
              fullWidth
            >
              Dodaj kategorię do bazy danych
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />
          
          <Box mt={2} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              color="info"
              startIcon={<Search />}
              onClick={handleGetCategories}
            >
              Sprawdź kategorie w bazie
            </Button>
            
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<Refresh />}
              onClick={handleAddDefaultCategories}
            >
              Dodaj domyślne kategorie
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              startIcon={<CleaningServices />}
              onClick={handleCleanupCategories}
            >
              Wyczyść duplikaty
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Zamknij
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default DevTools; 