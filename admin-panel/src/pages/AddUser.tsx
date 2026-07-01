import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { User } from '../context/AppContext';
import {
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  Alert,
  Snackbar,
  IconButton,
  InputAdornment,
  Divider,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  RotateLeft as ResetIcon,
  Save as SaveIcon,
  Key as KeyIcon,
  ContentCopy as CopyIcon,
  Help as ConfirmIcon,
} from '@mui/icons-material';

export const AddUser: React.FC = () => {
  const { addNewUser, users, roles } = useApp();

  // Use roles from backend; filter to show only Skilled and Trainee (case-insensitive)
  const roleOptions = useMemo(() => {
    return roles.filter(r => r.name.toLowerCase() === 'skilled' || r.name.toLowerCase() === 'trainee');
  }, [roles]);

  // Form Fields
  const [employeeName, setEmployeeName] = useState('');
  const [userId, setUserId] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [generatedPassword, setGeneratedPassword] = useState('');

  // Automatically initialize role select to the first available option
  React.useEffect(() => {
    if (roleOptions.length > 0) {
      if (!roleOptions.some(r => r.id === selectedRoleId)) {
        setSelectedRoleId(roleOptions[0].id);
      }
    }
  }, [roleOptions, selectedRoleId]);

  // Dialog and Alert States
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof User | 'password', string>>>({});
  const [alertState, setAlertState] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleCloseSnackbar = () => {
    setAlertState((prev) => ({ ...prev, open: false }));
  };

  // Password Generator based on Rule (EMP NAME START 3 LETTERS + LAST 3 DIG OF MOBILE)
  const handleGeneratePassword = () => {
    const firstName = employeeName.trim().split(' ')[0] || '';
    if (!firstName || mobile.length < 3) {
      setAlertState({
        open: true,
        message: 'Please fill out Employee Name and at least 3 digits of the Mobile Number first.',
        severity: 'error',
      });
      return;
    }
    const namePart = firstName.substring(0, 3).toUpperCase();
    const mobilePart = mobile.slice(-3);
    const pass = `${namePart}${mobilePart}`;
    setGeneratedPassword(pass);
    setErrors((prev) => ({ ...prev, password: undefined }));

    setAlertState({
      open: true,
      message: `Password generated successfully based on employee formula: ${pass}`,
      severity: 'success',
    });
  };

  const handleCopyPassword = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword);
    setAlertState({
      open: true,
      message: 'Password copied to clipboard!',
      severity: 'success',
    });
  };

  // Inline Validation Rules
  const validate = (): boolean => {
    const tempErrors: Partial<Record<keyof User | 'password', string>> = {};
    let isValid = true;

    // Employee Name
    if (!employeeName.trim()) {
      tempErrors.adminName = 'Employee Name is required';
      isValid = false;
    } else if (!/^[a-zA-Z\s]{3,30}$/.test(employeeName.trim())) {
      tempErrors.adminName = 'Name must be 3-30 letters with no special symbols';
      isValid = false;
    }

    // User ID
    if (!userId.trim()) {
      tempErrors.userId = 'User ID is required';
      isValid = false;
    } else if (!/^[a-zA-Z0-9]{3,10}$/.test(userId.trim())) {
      tempErrors.userId = 'ID must be 3-10 alphanumeric characters';
      isValid = false;
    } else if (users.some((u) => u.userId.toLowerCase() === userId.trim().toLowerCase())) {
      tempErrors.userId = 'This User ID is already registered';
      isValid = false;
    }

    // Mobile Number (10-digit number)
    if (!mobile.trim()) {
      tempErrors.mobile = 'Mobile Number is required';
      isValid = false;
    } else if (!/^\d{10}$/.test(mobile.trim())) {
      tempErrors.mobile = 'Must be exactly a 10-digit number';
      isValid = false;
    }

    // Email Address
    if (!email.trim()) {
      tempErrors.email = 'Email Address is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      tempErrors.email = 'Enter a valid email address';
      isValid = false;
    }

    // Password
    if (!generatedPassword) {
      tempErrors.password = 'You must generate a secure password first';
      isValid = false;
    }

    // Role
    if (!selectedRoleId || selectedRoleId === 'skilled' || selectedRoleId === 'trainee') {
      tempErrors.role = 'A valid system role must be loaded and selected';
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleReset = () => {
    setEmployeeName('');
    setUserId('');
    setMobile('');
    setEmail('');
    setSelectedRoleId('');
    setStatus('Active');
    setGeneratedPassword('');
    setErrors({});
    setAlertState({
      open: true,
      message: 'Registration form cleared.',
      severity: 'success',
    });
  };

  // Pre-save confirmation triggers
  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setConfirmOpen(true); // Open confirmation modal before saving
    } else {
      setAlertState({
        open: true,
        message: 'Please resolve form validation errors before saving.',
        severity: 'error',
      });
    }
  };

  // Final database execution
  const handleConfirmSave = async () => {
    setConfirmOpen(false);

    // Split name into firstName / lastName for backend
    const nameParts = employeeName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'N/A';

    // Find matched role object
    const matchedRole = roleOptions.find(r => r.id === selectedRoleId) || roleOptions[0];

    const newUser = {
      adminName: employeeName.trim(),
      userId: userId.trim().toUpperCase(),
      mobile: mobile.trim(),
      email: email.trim().toLowerCase(),
      role: matchedRole?.name || 'Worker',
      status: (status === 'Active' ? 'Working' : 'Away') as User['status'],
      // Extra fields for backend
      firstName,
      lastName,
      roleId: matchedRole?.id || '',
    };

    const result = await addNewUser(newUser);
    const success = typeof result === 'boolean' ? result : result?.success;

    if (success) {
      setAlertState({
        open: true,
        message: `Employee ${employeeName} registered successfully! Global states updated.`,
        severity: 'success',
      });

      // Clear fields
      setEmployeeName('');
      setUserId('');
      setMobile('');
      setEmail('');
      setGeneratedPassword('');
      setErrors({});
    } else {
      setAlertState({
        open: true,
        message: typeof result === 'object' && result?.error ? result.error : 'A user with that ID already exists.',
        severity: 'error',
      });
    }
  };

  return (
    <Box sx={{ maxWidth: 850, mx: 'auto', mt: { xs: 0, sm: 2 } }}>
      <Snackbar
        open={alertState.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={alertState.severity} sx={{ width: '100%', borderRadius: 3, fontWeight: 600 }}>
          {alertState.message}
        </Alert>
      </Snackbar>

      <Card sx={{ border: '1px solid', borderColor: 'divider', overflow: 'visible' }}>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <Avatar
              sx={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                boxShadow: '0 6px 16px rgba(139, 92, 246, 0.3)',
                width: 48,
                height: 48,
              }}
            >
              <PersonAddIcon sx={{ color: '#FFFFFF' }} />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                Create Workers & Technicians
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Onboard new operators, assign functional system roles, and generate platform credentials.
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ borderStyle: 'dashed', mb: 4 }} />

          {/* Form */}
          <Box component="form" onSubmit={handleSaveClick} noValidate>
            <Grid container spacing={3}>
              {/* Employee Name */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Employee Name"
                  placeholder="e.g. Liam Johnson"
                  value={employeeName}
                  onChange={(e) => {
                    setEmployeeName(e.target.value);
                    if (errors.adminName) setErrors((prev) => ({ ...prev, adminName: undefined }));
                  }}
                  error={Boolean(errors.adminName)}
                  helperText={errors.adminName}
                />
              </Grid>

              {/* User ID */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="User ID"
                  placeholder="e.g. EMP107"
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    if (errors.userId) setErrors((prev) => ({ ...prev, userId: undefined }));
                  }}
                  error={Boolean(errors.userId)}
                  helperText={errors.userId}
                  sx={{ '& input': { textTransform: 'uppercase' } }}
                />
              </Grid>

              {/* Mobile Number */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Mobile Number"
                  placeholder="e.g. 9876543210"
                  value={mobile}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ''); // Digits only
                    if (val.length <= 10) setMobile(val);
                    if (errors.mobile) setErrors((prev) => ({ ...prev, mobile: undefined }));
                  }}
                  error={Boolean(errors.mobile)}
                  helperText={errors.mobile}
                />
              </Grid>

              {/* Email Address */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Email Address"
                  placeholder="name@company.com"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                />
              </Grid>

              {/* Role Dropdown — populated from backend */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Role Options"
                  value={selectedRoleId || (roleOptions[0]?.id ?? '')}
                  onChange={(e) => {
                    setSelectedRoleId(e.target.value);
                    if (errors.role) setErrors((prev) => ({ ...prev, role: undefined }));
                  }}
                  error={Boolean(errors.role)}
                  helperText={errors.role || (roles.length === 0 ? 'Loading roles from server...' : '')}
                >
                  {roleOptions.map((r) => (
                    <MenuItem key={r.id} value={r.id} sx={{ fontWeight: 600 }}>
                      {r.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Status Dropdown */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Initial Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                >
                  {['Active', 'Inactive'].map((option) => (
                    <MenuItem key={option} value={option} sx={{ fontWeight: 600 }}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Password Generator Block */}
              <Grid size={{ xs: 12 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'),
                    border: '1px dashed',
                    borderColor: errors.password ? 'error.main' : 'divider',
                    borderRadius: 4,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: errors.password ? 'error.main' : 'text.primary' }}>
                    Access Security Settings
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
                    Please generate a secure strong password for platform credentials.
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                    <Button
                      type="button"
                      variant="outlined"
                      color="secondary"
                      onClick={handleGeneratePassword}
                      startIcon={<KeyIcon />}
                      sx={{ borderRadius: 3, py: 1 }}
                    >
                      Generate Password
                    </Button>

                    {generatedPassword && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, maxWidth: 350 }}>
                        <TextField
                          fullWidth
                          size="small"
                          value={generatedPassword}
                          slotProps={{
                            input: {
                              readOnly: true,
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton onClick={handleCopyPassword} edge="end" sx={{ color: 'primary.main' }}>
                                    <CopyIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </InputAdornment>
                              ),
                              sx: { fontFamily: 'ui-monospace, monospace', fontSize: '0.9rem', fontWeight: 'bold', bgcolor: 'background.paper', borderRadius: 3 },
                            },
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                  {errors.password && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1, fontWeight: 600 }}>
                      {errors.password}
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>

            {/* Buttons Row */}
            <Box sx={{ mt: 5, display: 'flex', justifyContent: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleReset}
                startIcon={<ResetIcon />}
                sx={{
                  py: 1.2,
                  px: 3.5,
                  borderRadius: 3.5,
                  fontWeight: 700,
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                Reset Form
              </Button>

              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                sx={{
                  py: 1.2,
                  px: 4,
                  borderRadius: 3.5,
                  fontWeight: 700,
                  boxShadow: (theme) =>
                    theme.palette.mode === 'dark'
                      ? '0 8px 24px rgba(139, 92, 246, 0.3)'
                      : '0 8px 24px rgba(99, 102, 241, 0.2)',
                }}
              >
                Save User
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Confirmation Dialog before Save */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        slotProps={{
          paper: {
            sx: { borderRadius: 4, px: 2, py: 1, maxWidth: 450 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ConfirmIcon sx={{ color: 'primary.main' }} />
          Confirm Registration
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontWeight: 500 }}>
            Please confirm the onboarding details before writing them to the system registry:
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, bgcolor: 'action.hover', p: 2.5, borderRadius: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Employee Name: <span style={{ fontWeight: 500, float: 'right' }}>{employeeName}</span>
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              User ID: <span style={{ fontWeight: 500, float: 'right', textTransform: 'uppercase' }}>{userId}</span>
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Mobile Number: <span style={{ fontWeight: 500, float: 'right' }}>+1 {mobile}</span>
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Email Address: <span style={{ fontWeight: 500, float: 'right' }}>{email}</span>
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              System Role: <span style={{ fontWeight: 800, color: '#8B5CF6', float: 'right' }}>
                {roleOptions.find(r => r.id === selectedRoleId)?.name || roleOptions[0]?.name || 'Worker'}
              </span>
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Initial Status: <span style={{ fontWeight: 800, color: '#10B981', float: 'right' }}>{status}</span>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ pb: 3, px: 3 }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSave}
            variant="contained"
            sx={{
              fontWeight: 700,
              boxShadow: 'none',
              borderRadius: 3,
            }}
          >
            Confirm & Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
