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
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Login as LoginIcon,
  FlashOn as FlashIcon,
} from '@mui/icons-material';

export const Login: React.FC = () => {
  const { login } = useApp();

  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [idError, setIdError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleClickShowPassword = () => setShowPassword(!showPassword);

  const validateForm = (): boolean => {
    let isValid = true;

    if (!employeeId.trim()) {
      setIdError('Employee ID is required');
      isValid = false;
    } else {
      setIdError(null);
    }

    if (!password) {
      setPasswordError('Password is required');
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
      const success = await login(employeeId, password);
      if (!success) {
        setLoginError('Invalid credentials. Please verify your Employee ID or Password.');
      }
    } catch {
      setLoginError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1200,
        boxSizing: 'border-box',
        overflowY: 'auto',
        background: 'radial-gradient(circle at center, #10254C 0%, #060F21 100%)',
        fontFamily: '"Outfit", sans-serif',
        px: 2,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.03)',
          top: '-10%',
          right: '-10%',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.02)',
          bottom: '-20%',
          left: '-20%',
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ width: '100%', maxWidth: 450, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
        {/* Brand Header */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4, textAlign: 'center' }}>
          <Box
            sx={{
              background: '#F59E0B',
              borderRadius: '16px',
              width: 54,
              height: 54,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              boxShadow: '0 8px 20px rgba(245, 158, 11, 0.25)',
            }}
          >
            <FlashIcon sx={{ fontSize: 32, color: '#FFFFFF' }} />
          </Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              mb: 0.5,
              fontSize: { xs: '1.75rem', sm: '2rem' },
            }}
          >
            PowerGrid Employee Portal
          </Typography>
          <Typography
            variant="subtitle2"
            sx={{
              color: 'rgba(255, 255, 255, 0.55)',
              fontWeight: 500,
              letterSpacing: '0.02em',
            }}
          >
            Transformer Manufacturing Division
          </Typography>
        </Box>

        {/* Login Card */}
        <Card
          sx={{
            width: '100%',
            borderRadius: '24px',
            background: '#FFFFFF',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: '#0F172A',
                  letterSpacing: '-0.02em',
                  mb: 0.5,
                }}
              >
                Employee Sign In
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#64748B',
                  fontWeight: 500,
                }}
              >
                Enter your credentials to access the productivity portal
              </Typography>
            </Box>

            {loginError && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: '12px',
                  fontWeight: 600,
                }}
              >
                {loginError}
              </Alert>
            )}

            <Box component="form" onSubmit={handleLoginSubmit} noValidate>
              {/* Employee ID select */}
              <Box sx={{ mb: 2.5 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: '#1E293B',
                    mb: 1,
                  }}
                >
                  Employee ID
                </Typography>

                  <TextField
                    fullWidth
                    placeholder="Enter Employee ID (e.g. EMP-2001)"
                    value={employeeId}
                    onChange={(e) => {
                      setEmployeeId(e.target.value);
                      if (idError) setIdError(null);
                    }}
                    error={Boolean(idError)}
                    helperText={idError}
                    slotProps={{
                      input: {
                        sx: {
                          height: 56,
                          color: '#0F172A',
                          bgcolor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '12px',
                          fontWeight: 650,
                        },
                      },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    }}
                  />
              </Box>

              {/* Password */}
              <Box sx={{ mb: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: '#1E293B',
                    mb: 1,
                  }}
                >
                  Password
                </Typography>
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
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
                          <IconButton onClick={handleClickShowPassword} edge="end" sx={{ color: '#64748B' }}>
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: {
                        height: 56,
                        color: '#0F172A',
                        bgcolor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        fontWeight: 650,
                      },
                    },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  }}
                />
              </Box>

              <Typography
                variant="caption"
                sx={{
                  color: '#64748B',
                  fontWeight: 600,
                  display: 'block',
                  mb: 4,
                }}
              >
                Demo: database password is <span style={{ color: '#2563EB', fontWeight: 700 }}>Admin@123</span> (or <span style={{ color: '#2563EB', fontWeight: 700 }}>pass123</span> for showcase)
              </Typography>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                startIcon={!loading && <LoginIcon sx={{ transform: 'scaleX(-1)' }} />}
                sx={{
                  py: 1.8,
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 800,
                  textTransform: 'none',
                  color: '#FFFFFF',
                  background: '#1E3A8A',
                  boxShadow: '0 4px 12px rgba(30, 58, 138, 0.2)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: '#172554',
                    boxShadow: '0 6px 16px rgba(30, 58, 138, 0.3)',
                  },
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: '#FFFFFF' }} /> : 'Sign In'}
              </Button>
            </Box>

            <Typography
              variant="caption"
              sx={{
                display: 'block',
                textAlign: 'center',
                color: '#94A3B8',
                fontWeight: 600,
                mt: 4,
                borderTop: '1px solid #F1F5F9',
                pt: 2,
              }}
            >
              For access issues, contact your supervisor or IT helpdesk.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
