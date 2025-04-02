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
  useTheme
} from '@mui/material';
import { 
  LockOutlined, 
  Visibility, 
  VisibilityOff 
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { motion } from 'framer-motion';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Proszę wypełnić wszystkie pola');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Błąd logowania:', error);
      
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Nieprawidłowy adres email');
          break;
        case 'auth/user-disabled':
          setError('Konto zostało wyłączone');
          break;
        case 'auth/user-not-found':
          setError('Nie znaleziono użytkownika o podanym emailu');
          break;
        case 'auth/wrong-password':
          setError('Nieprawidłowe hasło');
          break;
        default:
          setError('Wystąpił błąd podczas logowania');
      }
    } finally {
      setIsLoading(false);
    }
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
    hidden: { scale: 0, rotate: -180 },
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
                bgcolor: 'primary.main',
                width: 56,
                height: 56
              }}
            >
              <LockOutlined />
            </Avatar>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
              FinansTracker
            </Typography>
          </motion.div>

          <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1, width: '100%' }}>
            <motion.div variants={itemVariants}>
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
            </motion.div>

            <motion.div variants={itemVariants}>
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Hasło"
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="current-password"
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

            <motion.div variants={itemVariants}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{ 
                  mt: 2, 
                  mb: 2,
                  py: 1.5,
                  borderRadius: 2,
                  position: 'relative',
                  overflow: 'hidden',
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
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Zaloguj się'}
              </Button>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Link component={RouterLink} to="/register" variant="body2">
                  {"Nie masz konta? Zarejestruj się"}
                </Link>
              </Box>
            </motion.div>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default LoginPage; 