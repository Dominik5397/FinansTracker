import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  Container, 
  Typography, 
  Box, 
  Link, 
  Paper, 
  Avatar, 
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  useTheme
} from '@mui/material';
import { 
  PersonAdd, 
  Visibility, 
  VisibilityOff,
  ArrowForward,
  ArrowBack 
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { motion } from 'framer-motion';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const theme = useTheme();
  const navigate = useNavigate();

  const steps = ['Dane podstawowe', 'Bezpieczeństwo'];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Walidacja
    if (!email || !password || !confirmPassword || !displayName) {
      setError('Proszę wypełnić wszystkie pola');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Hasła nie są identyczne');
      return;
    }
    
    if (password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Tworzymy użytkownika
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Ustawiamy nazwę użytkownika
      await updateProfile(user, {
        displayName: displayName
      });
      
      // Przekierowujemy na stronę logowania
      navigate('/login');
    } catch (error: any) {
      console.error('Błąd rejestracji:', error);
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('Ten adres email jest już używany');
          break;
        case 'auth/invalid-email':
          setError('Nieprawidłowy adres email');
          break;
        case 'auth/weak-password':
          setError('Hasło jest zbyt słabe');
          break;
        default:
          setError('Wystąpił błąd podczas rejestracji');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    // Walidacja pierwszego kroku
    if (activeStep === 0 && (!email || !displayName)) {
      setError('Proszę wypełnić wszystkie pola');
      return;
    }
    
    setActiveStep((prevStep) => prevStep + 1);
    setError('');
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError('');
  };

  // Animacja dla elementów formularza
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1, 
        delayChildren: 0.2,
        duration: 0.5
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

  const logoVariants = {
    hidden: { scale: 0, rotate: 180 },
    visible: { 
      scale: 1, 
      rotate: 0,
      transition: { 
        type: 'spring', 
        stiffness: 200, 
        delay: 0.1, 
        duration: 0.8 
      }
    }
  };

  const stepVariants = {
    initial: { 
      x: activeStep === steps.length - 1 ? -100 : 100, 
      opacity: 0 
    },
    animate: { 
      x: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100, damping: 12 }
    },
    exit: { 
      x: activeStep === steps.length - 1 ? 100 : -100, 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        style={{ 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          position: 'relative', 
          zIndex: 10 
        }}
      >
        <Paper 
          elevation={6} 
          sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            background: theme.palette.mode === 'dark' 
              ? 'rgba(20, 20, 20, 0.98)' 
              : 'rgba(255, 255, 255, 0.98)',
            borderRadius: 3,
            width: '100%',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.8)'
              : '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
        >
          <motion.div variants={logoVariants}>
            <Avatar 
              sx={{ 
                m: 1, 
                bgcolor: 'secondary.main',
                width: 56,
                height: 56
              }}
            >
              <PersonAdd />
            </Avatar>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
              Rejestracja
            </Typography>
          </motion.div>

          <motion.div variants={itemVariants} style={{ width: '100%', mb: 3 }}>
            <Stepper activeStep={activeStep}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </motion.div>

          <Box component="form" onSubmit={handleRegister} noValidate sx={{ mt: 1, width: '100%' }}>
            <motion.div 
              initial="initial"
              animate="animate"
              exit="exit"
              variants={stepVariants}
              key={activeStep}
              style={{ width: '100%' }}
            >
              {activeStep === 0 ? (
                // Pierwszy krok - email i nazwa użytkownika
                <>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Adres email"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    error={!!error && error.includes('email')}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="displayName"
                    label="Nazwa użytkownika"
                    id="displayName"
                    value={displayName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                </>
              ) : (
                // Drugi krok - hasło i potwierdzenie
                <>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Hasło"
                    type={showPassword ? "text" : "password"}
                    id="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    error={!!error && error.includes('hasło')}
                    InputProps={{
                      endAdornment: (
                        <Button
                          onClick={() => setShowPassword(!showPassword)}
                          sx={{ minWidth: 'auto', p: 0 }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </Button>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="confirmPassword"
                    label="Potwierdź hasło"
                    type={showPassword ? "text" : "password"}
                    id="confirmPassword"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                    error={!!error && error.includes('hasło')}
                    sx={{ mb: 2 }}
                  />
                </>
              )}
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Typography color="error" variant="body2" sx={{ mt: 1, mb: 2 }}>
                  {error}
                </Typography>
              </motion.div>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<ArrowBack />}
                sx={{ visibility: activeStep === 0 ? 'hidden' : 'visible' }}
              >
                Wstecz
              </Button>
              {activeStep === steps.length - 1 ? (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    type="submit"
                    variant="contained"
                    color="secondary"
                    disabled={isLoading}
                    sx={{ 
                      py: 1.5,
                      px: 3,
                      borderRadius: 2,
                      position: 'relative',
                      overflow: 'hidden',
                      fontWeight: 'bold',
                      '&:after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(120deg, transparent, rgba(255,255,255,0.2), transparent)',
                        transform: 'translateX(-100%)',
                      },
                      '&:hover:after': {
                        transform: 'translateX(100%)',
                        transition: 'transform 0.6s ease-in-out',
                      }
                    }}
                  >
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Zarejestruj się'}
                  </Button>
                </motion.div>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                >
                  Dalej
                </Button>
              )}
            </Box>

            <motion.div variants={itemVariants}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Link component={RouterLink} to="/login" variant="body2">
                  {"Masz już konto? Zaloguj się"}
                </Link>
              </Box>
            </motion.div>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default RegisterPage; 