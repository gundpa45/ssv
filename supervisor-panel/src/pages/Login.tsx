import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  IconButton,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Security as SecurityIcon,
  Factory as FactoryIcon,
} from '@mui/icons-material';

export const Login: React.FC = () => {
  const { login } = useApp();
  const navigate = useNavigate();

  const [supervisorId, setSupervisorId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supervisorId.trim()) {
      setError('Please enter your Supervisor ID.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const success = await login(supervisorId.trim(), password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid credentials. Use Supervisor ID (e.g. SUP-101) or type "supervisor".');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorative circles */}
      <Box
        sx={{
          position: 'absolute',
          top: -120,
          right: -80,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -100,
          left: -60,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ width: '100%', maxWidth: 440, position: 'relative' }}>
        {/* Logo / Brand above card */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              boxShadow: '0 8px 24px rgba(37,99,235,0.25)',
            }}
          >
            <FactoryIcon sx={{ fontSize: 28, color: '#fff' }} />
          </Box>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: '1.5rem',
              color: 'text.primary',
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
            }}
          >
            Workforce Management
          </Typography>
          <Typography
            sx={{
              fontSize: '0.875rem',
              color: 'text.secondary',
              fontWeight: 500,
              mt: 0.5,
            }}
          >
            Supervisor Verification Portal
          </Typography>
        </Box>

        {/* Login Card */}
        <Card
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 4,
            boxShadow: '0 16px 48px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}
        >
          {/* Top color bar */}
          <Box
            sx={{
              height: 4,
              background: 'linear-gradient(90deg, #2563EB 0%, #7C3AED 50%, #F59E0B 100%)',
            }}
          />

          <CardContent sx={{ p: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: 'text.primary', mb: 0.5 }}>
                Sign In to Dashboard
              </Typography>
              <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', fontWeight: 500 }}>
                Enter your supervisor credentials to continue
              </Typography>
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{ mb: 3, borderRadius: 2, fontSize: '0.82rem', fontWeight: 600 }}
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Supervisor ID or Email"
                variant="outlined"
                placeholder="e.g. SUP-101 or supervisor"
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
                sx={{ mb: 2.5 }}
                InputProps={{ sx: { borderRadius: 2.5, fontSize: '0.9rem' } }}
                slotProps={{ inputLabel: { sx: { fontSize: '0.875rem' } } }}
              />

              <TextField
                fullWidth
                label="Password"
                variant="outlined"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
                  sx: { borderRadius: 2.5, fontSize: '0.9rem' },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        sx={{ color: 'text.secondary' }}
                      >
                        {showPassword ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                InputLabelProps={{ sx: { fontSize: '0.875rem' } }}
              />

              {/* Sample Credentials Box */}
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(37, 99, 235, 0.05)',
                  border: '1px dashed rgba(37, 99, 235, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                }}
              >
                <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Demo Credentials
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                  Supervisor ID: <Box component="span" sx={{ fontFamily: 'monospace', bgcolor: 'rgba(0,0,0,0.05)', px: 0.8, py: 0.2, borderRadius: '4px', fontWeight: 800 }}>SUPER001</Box>
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                  Password: <Box component="span" sx={{ fontFamily: 'monospace', bgcolor: 'rgba(0,0,0,0.05)', px: 0.8, py: 0.2, borderRadius: '4px', fontWeight: 800 }}>VIK224</Box>
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                type="submit"
                disabled={loading}
                sx={{
                  py: 1.5,
                  borderRadius: 2.5,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  textTransform: 'none',
                  boxShadow: '0 4px 16px rgba(37,99,235,0.25)',
                  '&:hover': {
                    boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
                  },
                }}
              >
                {loading ? 'Signing In...' : 'Sign In Securely'}
              </Button>
            </form>

            <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <SecurityIcon sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 500, lineHeight: 1.4 }}>
                Secured access. Transformer manufacturing ERP. All sessions are logged and monitored.
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Typography sx={{ textAlign: 'center', mt: 3, fontSize: '0.72rem', color: 'text.disabled', fontWeight: 500 }}>
          © 2026 WMS Supervisor Panel — Workforce Management System
        </Typography>
      </Box>
    </Box>
  );
};

export default Login;
