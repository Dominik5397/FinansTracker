import React from 'react';
import { Box, Typography, Link, Container, Divider, useTheme } from '@mui/material';

const Footer: React.FC = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: theme.palette.mode === 'dark' 
          ? 'rgba(17, 25, 40, 0.8)' 
          : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Container maxWidth="lg">
        <Divider sx={{ mb: 3 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            © {currentYear} FinansTracker. Wszystkie prawa zastrzeżone.
          </Typography>
          <Box>
            <Link href="#" color="inherit" sx={{ mr: 2 }}>
              Polityka prywatności
            </Link>
            <Link href="#" color="inherit">
              Warunki użytkowania
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 