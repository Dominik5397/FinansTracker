import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, CssBaseline, useTheme, Popover } from '@mui/material';
import { motion } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';

import Navbar from './Navbar';
import Footer from './Footer';
import NotificationsList from '../Notifications/NotificationsList';
import { Notification } from '../../types';

interface LayoutProps {
  user: any;
  darkMode: boolean;
  toggleDarkMode: () => void;
  notifications: Notification[];
  refreshNotifications: () => void;
  unreadNotificationsCount: number;
}

const Layout: React.FC<LayoutProps> = ({ 
  user, 
  darkMode, 
  toggleDarkMode, 
  notifications, 
  refreshNotifications,
  unreadNotificationsCount
}) => {
  const theme = useTheme();
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<HTMLElement | null>(null);

  // Obsługa otwierania/zamykania menu powiadomień
  const handleOpenNotifications = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleCloseNotifications = () => {
    setNotificationsAnchorEl(null);
  };

  const notificationsOpen = Boolean(notificationsAnchorEl);

  React.useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-out',
      once: true,
    });
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      
      <Navbar 
        user={user} 
        darkMode={darkMode} 
        toggleDarkMode={toggleDarkMode} 
        onOpenNotifications={handleOpenNotifications}
        unreadNotificationsCount={unreadNotificationsCount}
      />
      
      <Box component="main" sx={{ flexGrow: 1, py: 8 }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </Container>
      </Box>
      
      <Footer />

      {/* Menu powiadomień */}
      <Popover
        open={notificationsOpen}
        anchorEl={notificationsAnchorEl}
        onClose={handleCloseNotifications}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { mt: 1, ml: 0 }
        }}
      >
        {user && (
          <NotificationsList 
            notifications={notifications} 
            userId={user.uid} 
            onClose={handleCloseNotifications}
            refreshNotifications={refreshNotifications}
          />
        )}
      </Popover>
    </Box>
  );
};

export default Layout; 