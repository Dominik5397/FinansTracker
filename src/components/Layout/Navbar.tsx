import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Menu, 
  MenuItem, 
  Avatar,
  Box, 
  useTheme,
  useMediaQuery,
  Badge,
  Tooltip,
  Divider
} from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu as MenuIcon, 
  Dashboard, 
  Receipt, 
  BarChart, 
  Settings, 
  Notifications,
  DarkMode,
  LightMode
} from '@mui/icons-material';
import { auth } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import { User } from '../../types';
import { motion } from 'framer-motion';

interface NavbarProps {
  user: User | null;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onOpenNotifications: (event: React.MouseEvent<HTMLElement>) => void;
  unreadNotificationsCount: number;
}

const Navbar: React.FC<NavbarProps> = ({ user, darkMode, toggleDarkMode, onOpenNotifications, unreadNotificationsCount }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      handleClose();
      navigate('/login');
    } catch (error) {
      console.error('Błąd podczas wylogowywania:', error);
    }
  };
  
  // Animacje dla menu
  const menuItemVariants = {
    hidden: { 
      opacity: 0,
      y: 20
    },
    visible: (i: number) => ({ 
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        type: 'spring',
        stiffness: 100
      }
    }),
    hover: { 
      scale: 1.05,
      color: theme.palette.primary.main,
      transition: { duration: 0.2 }
    },
    tap: { 
      scale: 0.95
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <AppBar position="sticky" sx={{ 
      zIndex: 100, 
      background: theme.palette.mode === 'dark' 
        ? 'linear-gradient(to right, #1a1a2e, #16213e)' 
        : 'linear-gradient(to right, #ffffff, #f8f9fa)',
      boxShadow: theme.palette.mode === 'dark'
        ? '0 4px 20px rgba(0, 0, 0, 0.8)'
        : '0 4px 20px rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(8px)',
      borderBottom: theme.palette.mode === 'dark'
        ? '1px solid rgba(255, 255, 255, 0.05)'
        : '1px solid rgba(0, 0, 0, 0.05)',
    }}>
      <Toolbar sx={{ py: 1 }}>
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMobileMenu}
            sx={{ 
              mr: 1,
              background: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.03)',
              borderRadius: '12px',
              '&:hover': {
                background: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)',
              }
            }}
            component={motion.button}
            whileHover={{ rotate: 180, transition: { duration: 0.3 } }}
            whileTap={{ scale: 0.9 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <Typography 
            variant="h6" 
            component={Link} 
            to="/" 
            sx={{ 
              flexGrow: 1, 
              textDecoration: 'none', 
              color: 'inherit',
              fontWeight: 'bold',
              mr: 4,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(to right, #7986cb, #64b5f6)'
                : 'linear-gradient(to right, #3f51b5, #2196f3)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textFillColor: 'transparent',
            }}
          >
            FinansTracker
          </Typography>
        </motion.div>

        {!isMobile && (
          <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              whileHover={{ y: -3 }}
              whileTap={{ y: 0 }}
            >
              <Button 
                color="inherit" 
                component={Link} 
                to="/"
                startIcon={<Dashboard />}
                sx={{ 
                  borderRadius: '12px',
                  bgcolor: isActive('/') 
                    ? theme.palette.mode === 'dark'
                      ? 'rgba(121, 134, 203, 0.2)'
                      : 'rgba(30, 64, 175, 0.15)'
                    : 'transparent',
                  px: 2,
                  py: 1,
                  color: theme.palette.mode === 'dark' 
                    ? '#ffffff' 
                    : isActive('/') ? '#1e40af' : '#475569',
                  fontWeight: isActive('/') ? 700 : 600,
                  boxShadow: isActive('/') && theme.palette.mode !== 'dark'
                    ? '0 2px 6px rgba(59, 130, 246, 0.3)'
                    : 'none',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark'
                      ? 'rgba(121, 134, 203, 0.15)'
                      : 'rgba(59, 130, 246, 0.12)',
                    color: theme.palette.mode === 'dark' ? '#ffffff' : '#1e40af',
                  }
                }}
                className="animated-button"
              >
                Pulpit
              </Button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              whileHover={{ y: -3 }}
              whileTap={{ y: 0 }}
            >
              <Button 
                color="inherit" 
                component={Link} 
                to="/transactions"
                startIcon={<Receipt />}
                sx={{ 
                  borderRadius: '12px',
                  bgcolor: isActive('/transactions') 
                    ? theme.palette.mode === 'dark'
                      ? 'rgba(121, 134, 203, 0.2)'
                      : 'rgba(30, 64, 175, 0.15)'
                    : 'transparent',
                  px: 2,
                  py: 1,
                  color: theme.palette.mode === 'dark' 
                    ? '#ffffff' 
                    : isActive('/transactions') ? '#1e40af' : '#475569',
                  fontWeight: isActive('/transactions') ? 700 : 600,
                  boxShadow: isActive('/transactions') && theme.palette.mode !== 'dark'
                    ? '0 2px 6px rgba(59, 130, 246, 0.3)'
                    : 'none',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark'
                      ? 'rgba(121, 134, 203, 0.15)'
                      : 'rgba(59, 130, 246, 0.12)',
                    color: theme.palette.mode === 'dark' ? '#ffffff' : '#1e40af',
                  }
                }}
                className="animated-button"
              >
                Transakcje
              </Button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              whileHover={{ y: -3 }}
              whileTap={{ y: 0 }}
            >
              <Button 
                color="inherit" 
                component={Link} 
                to="/budget"
                startIcon={<BarChart />}
                sx={{ 
                  borderRadius: '12px',
                  bgcolor: isActive('/budget') 
                    ? theme.palette.mode === 'dark'
                      ? 'rgba(121, 134, 203, 0.2)'
                      : 'rgba(30, 64, 175, 0.15)'
                    : 'transparent',
                  px: 2,
                  py: 1,
                  color: theme.palette.mode === 'dark' 
                    ? '#ffffff' 
                    : isActive('/budget') ? '#1e40af' : '#475569',
                  fontWeight: isActive('/budget') ? 700 : 600,
                  boxShadow: isActive('/budget') && theme.palette.mode !== 'dark'
                    ? '0 2px 6px rgba(59, 130, 246, 0.3)'
                    : 'none',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark'
                      ? 'rgba(121, 134, 203, 0.15)'
                      : 'rgba(59, 130, 246, 0.12)',
                    color: theme.palette.mode === 'dark' ? '#ffffff' : '#1e40af',
                  }
                }}
                className="animated-button"
              >
                Budżet
              </Button>
            </motion.div>
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Przycisk przełączania motywu (tryb ciemny/jasny) */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
          >
            <Tooltip title={darkMode ? "Tryb jasny" : "Tryb ciemny"}>
              <IconButton 
                color="inherit" 
                onClick={toggleDarkMode}
                sx={{ 
                  mr: 1,
                  transition: 'transform 0.5s',
                  transform: darkMode ? 'rotate(180deg)' : 'rotate(0deg)',
                  background: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '12px',
                  p: 1,
                  color: theme.palette.mode === 'dark'
                    ? '#ffffff'
                    : '#1e40af',
                  '&:hover': {
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(59, 130, 246, 0.2)',
                  }
                }}
              >
                {darkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Tooltip title="Powiadomienia">
              <IconButton 
                color="inherit"
                onClick={onOpenNotifications}
                sx={{ 
                  background: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '12px',
                  p: 1,
                  color: theme.palette.mode === 'dark'
                    ? '#ffffff'
                    : '#1e40af',
                  '&:hover': {
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(59, 130, 246, 0.2)',
                  }
                }}
              >
                <Badge 
                  badgeContent={unreadNotificationsCount} 
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.75rem',
                      height: '20px',
                      minWidth: '20px',
                      fontWeight: 'bold',
                    }
                  }}
                >
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>
          </motion.div>
          
          {user ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <IconButton
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
                sx={{ 
                  ml: 1,
                  border: theme.palette.mode === 'dark'
                    ? '2px solid rgba(255, 255, 255, 0.1)'
                    : '2px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '12px',
                  p: 0.5,
                  overflow: 'hidden',
                  '&:hover': {
                    border: theme.palette.mode === 'dark'
                      ? '2px solid rgba(255, 255, 255, 0.2)'
                      : '2px solid rgba(59, 130, 246, 0.5)',
                  }
                }}
              >
                {user.photoURL ? (
                  <Avatar 
                    src={user.photoURL} 
                    alt={user.displayName || user.email}
                    sx={{ width: 32, height: 32 }}
                  />
                ) : (
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: theme.palette.mode === 'dark'
                        ? theme.palette.secondary.main
                        : theme.palette.primary.main,
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      color: '#ffffff'
                    }}
                  >
                    {user.displayName ? user.displayName[0].toUpperCase() : user.email[0].toUpperCase()}
                  </Avatar>
                )}
              </IconButton>
            </motion.div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                color="primary" 
                component={Link} 
                to="/login"
                variant="contained"
                sx={{ 
                  borderRadius: '12px',
                  px: 3,
                  py: 0.8,
                  fontWeight: 'bold',
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(45deg, #5c6bc0 30%, #7986cb 90%)'
                    : 'linear-gradient(45deg, #1e40af 30%, #3b82f6 90%)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 3px 8px rgba(0, 0, 0, 0.5)'
                    : '0 3px 8px rgba(59, 130, 246, 0.3)',
                  '&:hover': {
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(45deg, #5c6bc0 10%, #7986cb 70%)'
                      : 'linear-gradient(45deg, #1e40af 10%, #3b82f6 70%)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 5px 12px rgba(0, 0, 0, 0.6)'
                      : '0 5px 12px rgba(59, 130, 246, 0.4)',
                  }
                }}
                className="animated-button"
              >
                Zaloguj
              </Button>
            </motion.div>
          )}
        </Box>

        {/* Menu mobilne */}
        <Menu
          anchorEl={mobileMenuAnchorEl}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          open={Boolean(mobileMenuAnchorEl)}
          onClose={handleClose}
          PaperProps={{
            elevation: 3,
            sx: {
              mt: 1.5,
              borderRadius: '16px',
              minWidth: '200px',
              overflow: 'visible',
              filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.15))',
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                left: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
        >
          <MenuItem 
            component={Link} 
            to="/" 
            onClick={handleClose}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              my: 0.5,
              mx: 1,
              px: 2,
              py: 1.5,
              borderRadius: '12px',
              bgcolor: isActive('/') 
                ? theme.palette.mode === 'dark'
                  ? 'rgba(121, 134, 203, 0.15)'
                  : 'rgba(30, 64, 175, 0.15)'
                : 'transparent',
              color: theme.palette.mode === 'dark' 
                ? '#ffffff' 
                : isActive('/') ? '#1e40af' : '#475569',
              fontWeight: isActive('/') ? 700 : 600,
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(59, 130, 246, 0.1)',
              }
            }}
          >
            <Dashboard color={isActive('/') ? "primary" : "inherit"} fontSize="small" /> Pulpit
          </MenuItem>
          <MenuItem 
            component={Link} 
            to="/transactions" 
            onClick={handleClose}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              my: 0.5,
              mx: 1,
              px: 2,
              py: 1.5,
              borderRadius: '12px',
              bgcolor: isActive('/transactions') 
                ? theme.palette.mode === 'dark'
                  ? 'rgba(121, 134, 203, 0.15)'
                  : 'rgba(30, 64, 175, 0.15)'
                : 'transparent',
              color: theme.palette.mode === 'dark' 
                ? '#ffffff' 
                : isActive('/transactions') ? '#1e40af' : '#475569',
              fontWeight: isActive('/transactions') ? 700 : 600,
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(59, 130, 246, 0.1)',
              }
            }}
          >
            <Receipt color={isActive('/transactions') ? "primary" : "inherit"} fontSize="small" /> Transakcje
          </MenuItem>
          <MenuItem 
            component={Link} 
            to="/budget" 
            onClick={handleClose}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              my: 0.5,
              mx: 1,
              px: 2,
              py: 1.5,
              borderRadius: '12px',
              bgcolor: isActive('/budget') 
                ? theme.palette.mode === 'dark'
                  ? 'rgba(121, 134, 203, 0.15)'
                  : 'rgba(30, 64, 175, 0.15)'
                : 'transparent',
              color: theme.palette.mode === 'dark' 
                ? '#ffffff' 
                : isActive('/budget') ? '#1e40af' : '#475569',
              fontWeight: isActive('/budget') ? 700 : 600,
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(59, 130, 246, 0.1)',
              }
            }}
          >
            <BarChart color={isActive('/budget') ? "primary" : "inherit"} fontSize="small" /> Budżet
          </MenuItem>
          <Divider sx={{ my: 1 }} />
          <MenuItem 
            component={Link} 
            to="/settings" 
            onClick={handleClose}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              my: 0.5,
              mx: 1,
              px: 2,
              py: 1.5,
              borderRadius: '12px',
              color: theme.palette.mode === 'dark' ? '#b0bec5' : '#64748b',
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(59, 130, 246, 0.1)',
                color: theme.palette.mode === 'dark' ? '#ffffff' : '#1e40af',
              }
            }}
          >
            <Settings fontSize="small" /> Ustawienia
          </MenuItem>
        </Menu>
      </Toolbar>

      {/* Menu użytkownika */}
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            borderRadius: '16px',
            minWidth: '180px',
            overflow: 'visible',
            filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.15))',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
            border: theme.palette.mode === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.08)'
              : '1px solid rgba(59, 130, 246, 0.2)',
          },
        }}
      >
        <motion.div
          custom={0}
          variants={menuItemVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          whileTap="tap"
        >
          <MenuItem 
            onClick={handleClose} 
            dense
            sx={{ 
              borderRadius: '12px',
              mx: 1,
              px: 2,
              py: 1.5,
              fontWeight: 600,
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(59, 130, 246, 0.1)',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 28, 
                  height: 28, 
                  mr: 1.5, 
                  bgcolor: user?.photoURL ? 'transparent' : theme.palette.primary.main,
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}
                src={user?.photoURL}
              >
                {user?.displayName 
                  ? user.displayName[0].toUpperCase() 
                  : user?.email[0].toUpperCase()}
              </Avatar>
              <Typography variant="body2" fontWeight="600" color={theme.palette.mode === 'dark' ? 'white' : '#1e293b'}>
                {user?.displayName || user?.email}
              </Typography>
            </Box>
          </MenuItem>
        </motion.div>

        <Divider sx={{ my: 1 }} />

        <motion.div
          custom={1}
          variants={menuItemVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          whileTap="tap"
        >
          <MenuItem 
            onClick={() => {
              handleClose();
              toggleDarkMode();
            }} 
            dense
            sx={{ 
              borderRadius: '12px',
              mx: 1,
              px: 2,
              py: 1.5,
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(59, 130, 246, 0.1)',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {darkMode 
                ? <LightMode fontSize="small" sx={{ mr: 1.5, color: theme.palette.mode === 'dark' ? '#fbbf24' : '#f59e0b' }} /> 
                : <DarkMode fontSize="small" sx={{ mr: 1.5, color: theme.palette.mode === 'dark' ? '#64b5f6' : '#3b82f6' }} />
              }
              <Typography variant="body2" fontWeight="600" color={theme.palette.mode === 'dark' ? 'white' : '#1e293b'}>
                {darkMode ? "Tryb jasny" : "Tryb ciemny"}
              </Typography>
            </Box>
          </MenuItem>
        </motion.div>

        <motion.div
          custom={2}
          variants={menuItemVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          whileTap="tap"
        >
          <MenuItem 
            onClick={handleLogout} 
            dense
            sx={{ 
              borderRadius: '12px',
              mx: 1,
              px: 2,
              py: 1.5,
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 0, 0, 0.1)'
                  : 'rgba(244, 67, 54, 0.1)',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Settings fontSize="small" sx={{ mr: 1.5, color: 'error.main' }} />
              <Typography variant="body2" fontWeight="600" color="error.main">
                Wyloguj
              </Typography>
            </Box>
          </MenuItem>
        </motion.div>
      </Menu>
    </AppBar>
  );
};

export default Navbar; 