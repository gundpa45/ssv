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

// ── Dark Mode Palette ────────────────────────────────────────────
const darkPalette = {
  colorScheme: 'dark' as const,
  primary: {
    main: '#3B82F6',
    light: '#60A5FA',
    dark: '#1D4ED8',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#06B6D4',
    light: '#22D3EE',
    dark: '#0891B2',
    contrastText: '#FFFFFF',
  },
  tertiary: {
    main: '#F59E0B',
    light: '#FBBF24',
    dark: '#D97706',
    contrastText: '#000000',
  },
  background: {
    default: '#0C1018',
    paper: '#141922',
  },
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
  },
  divider: 'rgba(255, 255, 255, 0.07)',
  action: {
    hover: 'rgba(255, 255, 255, 0.04)',
    selected: 'rgba(59, 130, 246, 0.08)',
    disabledBackground: 'rgba(255, 255, 255, 0.06)',
    disabled: 'rgba(255, 255, 255, 0.25)',
  },
};

// ── Light Mode Palette ────────────────────────────────────────────
const lightPalette = {
  colorScheme: 'light' as const,
  primary: {
    main: '#2563EB',
    light: '#3B82F6',
    dark: '#1D4ED8',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#0891B2',
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
    default: '#F8FAFC',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#0F172A',
    secondary: '#475569',
  },
  divider: 'rgba(0, 0, 0, 0.07)',
  action: {
    hover: 'rgba(0, 0, 0, 0.03)',
    selected: 'rgba(37, 99, 235, 0.06)',
    disabledBackground: 'rgba(0, 0, 0, 0.06)',
    disabled: 'rgba(0, 0, 0, 0.26)',
  },
};

// ── Shared Component Overrides ────────────────────────────────────
const getSharedComponents = (mode: 'light' | 'dark'): ThemeOptions['components'] => ({
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        scrollbarWidth: 'thin',
        scrollbarColor: mode === 'dark'
          ? 'rgba(59,130,246,0.25) transparent'
          : 'rgba(37,99,235,0.2) transparent',
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        textTransform: 'none',
        fontWeight: 700,
        fontSize: '0.85rem',
        padding: '7px 20px',
        boxShadow: 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: mode === 'dark'
            ? '0 4px 16px rgba(59,130,246,0.3)'
            : '0 4px 12px rgba(37,99,235,0.2)',
          transform: 'translateY(-1px)',
        },
        '&:active': {
          transform: 'translateY(0)',
        },
      },
      contained: {
        '&.MuiButton-containedPrimary': {
          background: mode === 'dark'
            ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'
            : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
        },
        '&.MuiButton-containedSecondary': {
          background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        backgroundImage: 'none',
        border: mode === 'dark'
          ? '1px solid rgba(255,255,255,0.06)'
          : '1px solid rgba(0,0,0,0.06)',
        boxShadow: 'none',
        // Don't add hover transforms on Card globally — some cards are tables
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        backgroundImage: 'none',
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
          transition: 'all 0.2s ease',
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
        borderRadius: 8,
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        fontWeight: 600,
        fontSize: '0.75rem',
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        transition: 'all 0.2s ease',
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderColor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      },
      head: {
        fontWeight: 700,
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.875rem',
        minHeight: 44,
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      root: {
        minHeight: 44,
      },
      indicator: {
        height: 3,
        borderRadius: 2,
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        borderRadius: 6,
        fontSize: '0.78rem',
        fontWeight: 600,
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        backgroundImage: 'none',
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        transition: 'all 0.15s ease',
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 16,
      },
    },
  },
});

// ── Theme Factory ─────────────────────────────────────────────────
export const createAppTheme = (mode: 'light' | 'dark') => {
  const palette = mode === 'dark' ? darkPalette : lightPalette;
  return createTheme({
    palette,
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 800, fontSize: '2rem',   letterSpacing: '-0.03em' },
      h2: { fontWeight: 800, fontSize: '1.7rem',  letterSpacing: '-0.025em' },
      h3: { fontWeight: 700, fontSize: '1.4rem',  letterSpacing: '-0.02em' },
      h4: { fontWeight: 700, fontSize: '1.15rem', letterSpacing: '-0.01em' },
      h5: { fontWeight: 700, fontSize: '1.0rem' },
      h6: { fontWeight: 700, fontSize: '0.9rem' },
      subtitle1: { fontWeight: 600, fontSize: '0.9rem' },
      subtitle2: { fontWeight: 600, fontSize: '0.825rem' },
      body1:  { fontSize: '0.9rem',   lineHeight: 1.6 },
      body2:  { fontSize: '0.825rem', lineHeight: 1.5 },
      caption:{ fontSize: '0.75rem',  lineHeight: 1.4, fontWeight: 500 },
      button: { fontWeight: 700, fontSize: '0.85rem', textTransform: 'none' },
    },
    components: getSharedComponents(mode),
  });
};
