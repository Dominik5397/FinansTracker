// Deklaracje modułów dla Material UI
declare module '@mui/material';
declare module '@mui/material/*';
declare module '@mui/icons-material';
declare module '@mui/icons-material/*';
declare module '@mui/x-date-pickers';
declare module '@mui/x-date-pickers/*';
declare module '@mui/styles';

// Deklaracje dla bibliotek animacji
declare module 'framer-motion';
declare module 'react-spring';
declare module 'aos';
declare module 'animate.css';

// Inne biblioteki
declare module 'uuid';
declare module 'recharts';

// Deklaracja dla plików CSS
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Deklaracja dla plików obrazów
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.gif'; 