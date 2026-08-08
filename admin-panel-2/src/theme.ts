import { createTheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    tertiary?: Palette['primary'];
  }
  interface PaletteOptions {
    tertiary?: PaletteOptions['primary'];
  }
}

// Professional Slate/Navy dark mode colors
const darkPalette = {
  colorScheme: 'dark' as const,
  primary: {
    main: '#3B82F6', // Corporate blue
    light: '#60A5FA',
    dark: '#1D4ED8',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#06B6D4', // Corporate Teal/Cyan
    light: '#22D3EE',
    dark: '#0891B2',
    contrastText: '#FFFFFF',
  },
  tertiary: {
    main: '#F59E0B', // Amber
    light: '#FBBF24',
    dark: '#D97706',
    contrastText: '#000000',
  },
  background: {
    default: '#0B0F19', // Deep dark slate
    paper: '#111827', // Rich dark gray card
  },
  text: {
    primary: '#F3F4F6', // High-contrast off-white
    secondary: '#9CA3AF', // Dim gray
  },
  divider: 'rgba(255, 255, 255, 0.08)',
};

// Premium clean light mode colors
const lightPalette = {
  colorScheme: 'light' as const,
  primary: {
    main: '#2563EB', // Royal Azure
    light: '#3B82F6',
    dark: '#1D4ED8',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#0891B2', // Deep Teal
    light: '#06B6D4',
    dark: '#0E7490',
    contrastText: '#FFFFFF',
  },
  tertiary: {
    main: '#F59E0B',
    light: '#FBBF24',
    dark: '#D97706',
    contrastText: '#000000',
  },
  background: {
    default: '#F9FAFB', // Cool gray background
    paper: '#FFFFFF', // Clean white card
  },
  text: {
    primary: '#111827', // Crisp dark gray
    secondary: '#4B5563', // Charcoal
  },
  divider: 'rgba(0, 0, 0, 0.06)',
};

const getSharedComponents = (mode: 'light' | 'dark'): ThemeOptions['components'] => ({
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 24, // MD3 fully rounded buttons
        textTransform: 'none',
        fontWeight: 600,
        padding: '8px 24px',
        boxShadow: 'none',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: mode === 'dark' 
            ? '0 0 14px rgba(59, 130, 246, 0.4)' 
            : '0 4px 12px rgba(37, 99, 235, 0.2)',
          transform: 'translateY(-1px)',
        },
      },
    },
    variants: [
      {
        props: { variant: 'contained', color: 'primary' },
        style: {
          background: mode === 'dark'
            ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'
            : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
        },
      },
      {
        props: { variant: 'contained', color: 'secondary' },
        style: {
          background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
        },
      },
    ],
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16, // MD3 Rounded cards
        backgroundImage: 'none',
        border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.04)',
        boxShadow: mode === 'dark'
          ? '0 10px 30px -10px rgba(0, 0, 0, 0.7)'
          : '0 10px 30px -10px rgba(37, 99, 235, 0.05)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: mode === 'dark'
            ? '0 20px 40px -15px rgba(59, 130, 246, 0.15)'
            : '0 20px 40px -15px rgba(37, 99, 235, 0.1)',
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        backgroundImage: 'none',
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 12, // MD3 Rounded inputs
          transition: 'all 0.2s ease-in-out',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === 'dark' ? '#60A5FA' : '#3B82F6',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
            borderColor: mode === 'dark' ? '#3B82F6' : '#2563EB',
          },
        },
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 12,
      },
    },
  },
});

export const createAppTheme = (mode: 'light' | 'dark') => {
  const palette = mode === 'dark' ? darkPalette : lightPalette;
  return createTheme({
    palette,
    typography: {
      fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 800, letterSpacing: '-0.02em' },
      h2: { fontWeight: 700, letterSpacing: '-0.015em' },
      h3: { fontWeight: 700, letterSpacing: '-0.01em' },
      h4: { fontWeight: 600, letterSpacing: '-0.005em' },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 600, fontSize: '1rem' },
      subtitle2: { fontWeight: 600, fontSize: '0.925rem' },
      body1: { fontSize: '1rem', lineHeight: 1.6 },
      body2: { fontSize: '0.9rem', lineHeight: 1.6 },
      caption: { fontSize: '0.78rem', lineHeight: 1.5, fontWeight: 500 },
      button: { fontWeight: 600, fontSize: '0.9rem' },
    },
    components: getSharedComponents(mode),
  });
};
