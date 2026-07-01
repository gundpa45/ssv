import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Person as ProfileIcon,
  Save as SaveIcon,
  VpnKey as PasswordIcon,
} from '@mui/icons-material';

export const Profile: React.FC = () => {
  const { user, updateProfile, changePassword } = useApp();

  // --- Profile state fields ---
  const [name, setName] = useState(user?.name || 'Sam Supervisor');
  const [email, setEmail] = useState(user?.email || 'sam.sup@workforce-management.com');
  const [mobile, setMobile] = useState(user?.mobile || '9876543215');

  // --- Password form states ---
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarText, setSnackbarText] = useState('');

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileErr('Please fill in your name.');
      return;
    }
    setProfileErr('');
    updateProfile({ name, email, mobile });
    setProfileMsg('✅ Profile information updated successfully!');
    setTimeout(() => setProfileMsg(''), 4000);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassErr('');
    setPassMsg('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPassErr('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassErr('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPassErr('Password must be at least 6 characters long.');
      return;
    }

    const success = await changePassword(oldPassword, newPassword);
    if (success) {
      setPassMsg('✅ Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSnackbarText('Security updates saved!');
      setSnackbarOpen(true);
    } else {
      setPassErr('Invalid current security password.');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5 }}>
          My Profile & Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          Manage your personal details, supervisor email notifications, and change security credentials.
        </Typography>
      </Box>

      <Grid container spacing={3.5}>
        {/* Left Column: Personal details form */}
        <Grid item xs={12} md={6}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3.5 }}>
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    width: 50,
                    height: 50,
                  }}
                >
                  <ProfileIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Personal Specifications
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Official employee information database.
                  </Typography>
                </Box>
              </Box>

              {profileMsg && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2, fontWeight: 600 }}>
                  {profileMsg}
                </Alert>
              )}

              {profileErr && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontWeight: 600 }}>
                  {profileErr}
                </Alert>
              )}

              <form onSubmit={handleProfileSave}>
                <Grid container spacing={2.5}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Supervisor Name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      disabled
                      label="Supervisor ID"
                      value={user?.supervisorId || 'SUP-101'}
                      helperText="Official identifier (Cannot be edited)"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      disabled
                      label="Shift Role"
                      value="QC Supervisor"
                      helperText="System assigned permission role"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="email"
                      label="Contact Email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Mobile Number"
                      value={mobile}
                      onChange={e => setMobile(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      disabled
                      label="Last Portal Authentication Login"
                      value={user?.lastLogin || ''}
                    />
                  </Grid>

                  <Grid item xs={12} sx={{ mt: 1 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      type="submit"
                      startIcon={<SaveIcon />}
                      sx={{ borderRadius: 2.5, fontWeight: 700 }}
                    >
                      Save Profile
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Security/Password change */}
        <Grid item xs={12} md={6}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3.5 }}>
                <Avatar
                  sx={{
                    bgcolor: 'secondary.main',
                    background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)',
                    width: 50,
                    height: 50,
                  }}
                >
                  <PasswordIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Change Portal Password
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Update your authorization pass credentials.
                  </Typography>
                </Box>
              </Box>

              {passMsg && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2, fontWeight: 600 }}>
                  {passMsg}
                </Alert>
              )}

              {passErr && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontWeight: 600 }}>
                  {passErr}
                </Alert>
              )}

              <form onSubmit={handlePasswordSubmit}>
                <Grid container spacing={2.5}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Current Security Password"
                      placeholder="••••••••"
                      value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="password"
                      label="New Password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Confirm New Password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sx={{ mt: 1 }}>
                    <Button
                      variant="contained"
                      color="secondary"
                      type="submit"
                      startIcon={<PasswordIcon />}
                      sx={{ borderRadius: 2.5, fontWeight: 700 }}
                    >
                      Update Password
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar alerts */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" sx={{ borderRadius: 2, fontWeight: 700 }}>
          {snackbarText}
        </Alert>
      </Snackbar>
    </Box>
  );
};
export default Profile;
