import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert,
  Avatar,
  Fade,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  LockOutlined as LockOutlinedIcon,
} from '@mui/icons-material';

export const Login: React.FC = () => {
  const { login } = useApp();

  // Form Fields
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  // UI Control States
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Validation Error States
  const [userIdError, setUserIdError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Toggle Visibility
  const handleClickShowPassword = () => setShowPassword(!showPassword);

  // Client-side validations
  const validateForm = (): boolean => {
    let isValid = true;

    if (!userId.trim()) {
      setUserIdError('Admin ID is required');
      isValid = false;
    } else if (userId.length < 3) {
      setUserIdError('Admin ID must be at least 3 characters');
      isValid = false;
    } else {
      setUserIdError(null);
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 4) {
      setPasswordError('Password must be at least 4 characters');
      isValid = false;
    } else {
      setPasswordError(null);
    }

    return isValid;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      const success = await login(userId, password);
      if (!success) {
        setLoginError('Invalid credentials. Please verify your Admin ID or Password.');
      }
    } catch {
      setLoginError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Color Palette Constants: Blue, Black, White, and Golden in Light Mode
  const colors = {
    blue: '#1E3A8A',       // Royal Blue
    lightBlue: '#3B82F6',  // Active/Hover Accent Blue
    gold: '#D4AF37',       // Elegant Gold
    darkGold: '#B45309',   // Dark Gold for text on light backgrounds
    lightGold: '#F59E0B',  // Vibrant Gold for hover
    bgLight: '#F3F4F6',    // Light gray background fallback
    textDark: '#0F172A',   // Slate Black/Dark Text
    textMuted: '#475569',  // Gray muted text
    white: '#FFFFFF',
    cardBg: 'rgba(255, 255, 255, 0.88)', // Light glassmorphic card bg
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1200,
        boxSizing: 'border-box',
        overflow: 'hidden',
        background: colors.bgLight,
        fontFamily: '"Outfit", sans-serif',
      }}
    >
      {/* Background image container: visibly clear (only slightly blurred) */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(/images/factory-banner.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(2px) brightness(0.85) contrast(0.95)', // Less blur, fully visible
          transform: 'scale(1.03)', // prevents blurred border bleeding
          zIndex: 0,
        }}
      />

      {/* Light vignette overlay to prevent overpowering the card */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at center, rgba(255, 255, 255, 0.15) 0%, rgba(240, 244, 248, 0.55) 100%)`,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* Subtle light ambient glow */}
      <Box
        sx={{
          position: 'absolute',
          width: { xs: 300, md: 500 },
          height: { xs: 300, md: 500 },
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, rgba(212, 175, 55, 0.05) 70%)`,
          top: '10%',
          left: '15%',
          filter: 'blur(60px)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      <Fade in timeout={1000}>
        <Card
          sx={{
            width: '92%',
            maxWidth: 450,
            borderRadius: '24px',
            backdropFilter: 'blur(20px)',
            background: colors.cardBg,
            border: `1px solid rgba(212, 175, 55, 0.35)`, // More visible gold border for light mode
            boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25), 0 0 40px rgba(212, 175, 55, 0.08)',
            zIndex: 2,
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${colors.blue} 0%, ${colors.gold} 50%, ${colors.blue} 100%)`,
            }
          }}
        >
          <CardContent sx={{ p: { xs: 4, sm: 5 } }}>
            {/* Header section */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
              <Avatar
                sx={{
                  background: `linear-gradient(135deg, ${colors.blue} 0%, ${colors.gold} 100%)`,
                  width: 58,
                  height: 58,
                  mb: 2,
                  boxShadow: `0 8px 20px rgba(30, 58, 138, 0.2)`,
                }}
              >
                <LockOutlinedIcon sx={{ fontSize: 26, color: '#FFFFFF' }} />
              </Avatar>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  fontFamily: '"Outfit", sans-serif',
                  letterSpacing: '-0.02em',
                  mb: 0.5,
                  textAlign: 'center',
                  color: colors.blue, // Deep royal blue company name
                }}
              >
                Workforce Management System
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: colors.darkGold, // Visible gold subtitle
                  fontWeight: 800, 
                  textAlign: 'center', 
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}
              >
                Manage Workforce, Productivity and Operations Efficiently
              </Typography>
            </Box>

            {loginError && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  borderRadius: '12px', 
                  fontWeight: 500, 
                  bgcolor: 'rgba(239, 68, 68, 0.08)', 
                  border: '1px solid rgba(239, 68, 68, 0.2)', 
                  color: '#DC2626' 
                }}
              >
                {loginError}
              </Alert>
            )}

            {/* Input Form */}
            <Box component="form" onSubmit={handleLoginSubmit} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                id="userId"
                label="Admin ID"
                name="userId"
                autoComplete="username"
                autoFocus={false}
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  if (userIdError) setUserIdError(null);
                }}
                error={Boolean(userIdError)}
                helperText={userIdError}
                slotProps={{
                  input: {
                    sx: {
                      height: 56,
                      color: colors.textDark,
                      bgcolor: 'rgba(255, 255, 255, 0.65)',
                      border: '1px solid rgba(15, 23, 42, 0.15)',
                      borderRadius: '12px',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        border: `1.5px solid ${colors.blue}`,
                      },
                      '&.Mui-focused': {
                        border: `2px solid ${colors.blue}`,
                        boxShadow: `0 0 10px rgba(30, 58, 138, 0.15)`,
                        bgcolor: '#FFFFFF',
                      }
                    },
                  },
                }}
                sx={{
                  mb: 2.5,
                  '& .MuiInputLabel-root': { color: colors.textMuted, fontWeight: 600 },
                  '& .MuiInputLabel-root.Mui-focused': { color: colors.blue },
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  '& .MuiFormHelperText-root': { mx: 1.5 },
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                error={Boolean(passwordError)}
                helperText={passwordError}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          edge="end"
                          sx={{ color: colors.textMuted }}
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: {
                      height: 56,
                      color: colors.textDark,
                      bgcolor: 'rgba(255, 255, 255, 0.65)',
                      border: '1px solid rgba(15, 23, 42, 0.15)',
                      borderRadius: '12px',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        border: `1.5px solid ${colors.blue}`,
                      },
                      '&.Mui-focused': {
                        border: `2px solid ${colors.blue}`,
                        boxShadow: `0 0 10px rgba(30, 58, 138, 0.15)`,
                        bgcolor: '#FFFFFF',
                      }
                    },
                  },
                }}
                sx={{
                  mb: 4, // Spacing before button when Forgot Password is removed
                  '& .MuiInputLabel-root': { color: colors.textMuted, fontWeight: 600 },
                  '& .MuiInputLabel-root.Mui-focused': { color: colors.blue },
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  '& .MuiFormHelperText-root': { mx: 1.5 },
                }}
              />

              {/* Login Submit Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.7,
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'none',
                  color: '#FFFFFF',
                  background: `linear-gradient(135deg, ${colors.blue} 0%, ${colors.gold} 100%)`,
                  boxShadow: `0 8px 20px rgba(30, 58, 138, 0.25)`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${colors.lightBlue} 0%, ${colors.lightGold} 100%)`,
                    boxShadow: `0 12px 25px rgba(212, 175, 55, 0.3)`,
                    transform: 'translateY(-1px)',
                  }
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: '#FFFFFF' }} />
                ) : (
                  'Sign In'
                )}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
};
