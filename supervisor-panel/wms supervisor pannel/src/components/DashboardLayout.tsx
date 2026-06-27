import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  CheckCircle as VerificationIcon,
  People as MonitoringIcon,
  Analytics as ReportsIcon,
  Notifications as NotificationsIcon,
  Person as ProfileIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Logout as LogoutIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 256;
const DRAWER_COLLAPSED = 72;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { themeMode, toggleTheme, logout, user, notifications } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const unreadNotifCount = notifications.filter(n => n.status === 'Unread').length;

  const menuItems = [
    { text: 'Dashboard',        icon: <DashboardIcon />,    path: '/dashboard' },
    { text: 'Work Verification',icon: <VerificationIcon />, path: '/verification' },
    { text: 'User Monitoring',  icon: <MonitoringIcon />,   path: '/monitoring' },
    { text: 'Reports',          icon: <ReportsIcon />,      path: '/reports' },
    {
      text: 'Notifications',
      icon: (
        <Badge badgeContent={unreadNotifCount} color="error" overlap="circular" sx={{ '& .MuiBadge-badge': { fontWeight: 700, fontSize: '0.65rem' } }}>
          <NotificationsIcon />
        </Badge>
      ),
      path: '/notifications',
    },
    { text: 'Profile',          icon: <ProfileIcon />,      path: '/profile' },
  ];

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard')       return 'Supervisor Dashboard';
    if (path === '/verification')    return 'Work Verification';
    if (path.startsWith('/review/')) return 'Review Activity';
    if (path === '/monitoring')      return 'User Monitoring';
    if (path.startsWith('/employee/')) return 'Employee Details';
    if (path === '/reports')         return 'Reports & Analytics';
    if (path === '/notifications')   return 'Notifications';
    if (path === '/profile')         return 'Profile Settings';
    return 'Workforce Management';
  };

  const isActive = (path: string) =>
    location.pathname === path ||
    (path === '/verification' && location.pathname.startsWith('/review/')) ||
    (path === '/monitoring' && location.pathname.startsWith('/employee/'));

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: themeMode === 'dark' ? '#0D1117' : '#F8FAFC',
        borderRight: '1px solid',
        borderColor: themeMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      }}
    >
      {/* Brand Header */}
      <Box
        sx={{
          px: drawerCollapsed && !isMobile ? 1.5 : 2.5,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          justifyContent: drawerCollapsed && !isMobile ? 'center' : 'flex-start',
          minHeight: 72,
        }}
      >
        <Avatar
          sx={{
            background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
            width: 36,
            height: 36,
            fontWeight: 800,
            fontSize: '1rem',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
          }}
        >
          W
        </Avatar>
        {(!drawerCollapsed || isMobile) && (
          <Box>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: '0.95rem',
                letterSpacing: '-0.02em',
                color: themeMode === 'dark' ? '#F1F5F9' : '#0F172A',
                lineHeight: 1.2,
              }}
            >
              WMS Supervisor
            </Typography>
            <Typography
              sx={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: themeMode === 'dark' ? '#475569' : '#94A3B8',
              }}
            >
              Verification Suite
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ borderColor: themeMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />

      {/* Navigation */}
      <List sx={{ px: 1.5, py: 2, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={drawerCollapsed && !isMobile ? item.text : ''} placement="right">
                <ListItemButton
                  onClick={() => { navigate(item.path); if (isMobile) setMobileOpen(false); }}
                  sx={{
                    borderRadius: 2.5,
                    py: 1.1,
                    px: drawerCollapsed && !isMobile ? 1.5 : 2,
                    justifyContent: drawerCollapsed && !isMobile ? 'center' : 'flex-start',
                    bgcolor: active
                      ? 'primary.main'
                      : 'transparent',
                    color: active
                      ? '#FFFFFF'
                      : themeMode === 'dark' ? '#94A3B8' : '#64748B',
                    background: active ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : 'transparent',
                    boxShadow: active ? '0 4px 16px rgba(37,99,235,0.3)' : 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: active ? 'primary.main' : themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(37,99,235,0.06)',
                      color: active ? '#FFFFFF' : 'primary.main',
                      background: active ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : undefined,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: drawerCollapsed && !isMobile ? 0 : 38,
                      mr: drawerCollapsed && !isMobile ? 0 : 0,
                      justifyContent: 'center',
                      color: 'inherit',
                      '& .MuiSvgIcon-root': { fontSize: 20 },
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {(!drawerCollapsed || isMobile) && (
                    <>
                      <ListItemText
                        primary={
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: active ? 700 : 600, lineHeight: 1 }}>
                            {item.text}
                          </Typography>
                        }
                      />
                      {!active && (
                        <ChevronRightIcon sx={{ fontSize: 14, opacity: 0.4, flexShrink: 0 }} />
                      )}
                    </>
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      {/* Footer Controls */}
      <Box
        sx={{
          p: 1.5,
          borderTop: '1px solid',
          borderColor: themeMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        }}
      >
        {/* Supervisor Card */}
        {(!drawerCollapsed || isMobile) && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              p: 1.5,
              borderRadius: 2.5,
              bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(37,99,235,0.04)',
              border: '1px solid',
              borderColor: themeMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(37,99,235,0.08)',
              mb: 1.5,
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'primary.main',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                fontWeight: 800,
                fontSize: '0.8rem',
                flexShrink: 0,
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </Avatar>
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: themeMode === 'dark' ? '#F1F5F9' : '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'Supervisor'}
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: themeMode === 'dark' ? '#475569' : '#94A3B8', fontWeight: 600 }}>
                {user?.supervisorId || 'SUP-101'}
              </Typography>
            </Box>
          </Box>
        )}

        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <ListItem disablePadding>
            <Tooltip title={drawerCollapsed && !isMobile ? (themeMode === 'dark' ? 'Light Mode' : 'Dark Mode') : ''} placement="right">
              <ListItemButton
                onClick={toggleTheme}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  justifyContent: drawerCollapsed && !isMobile ? 'center' : 'flex-start',
                  color: themeMode === 'dark' ? '#94A3B8' : '#64748B',
                  '&:hover': { color: 'primary.main', bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(37,99,235,0.05)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: drawerCollapsed && !isMobile ? 0 : 36, color: 'inherit', justifyContent: 'center' }}>
                  {themeMode === 'dark' ? <LightModeIcon sx={{ fontSize: 18 }} /> : <DarkModeIcon sx={{ fontSize: 18 }} />}
                </ListItemIcon>
                {(!drawerCollapsed || isMobile) && (
                  <ListItemText primary={<Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}</Typography>} />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>

          <ListItem disablePadding>
            <Tooltip title={drawerCollapsed && !isMobile ? 'Sign Out' : ''} placement="right">
              <ListItemButton
                onClick={logout}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  justifyContent: drawerCollapsed && !isMobile ? 'center' : 'flex-start',
                  color: '#DC2626',
                  '&:hover': { bgcolor: 'rgba(220,38,38,0.07)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: drawerCollapsed && !isMobile ? 0 : 36, color: 'inherit', justifyContent: 'center' }}>
                  <LogoutIcon sx={{ fontSize: 18 }} />
                </ListItemIcon>
                {(!drawerCollapsed || isMobile) && (
                  <ListItemText primary={<Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>Sign Out</Typography>} />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  const drawerWidth = drawerCollapsed ? DRAWER_COLLAPSED : DRAWER_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>

      {/* ─── Top App Bar ────────────────────────────────────────────── */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          boxShadow: 'none',
          borderBottom: '1px solid',
          borderColor: 'divider',
          zIndex: theme.zIndex.drawer - 1,
        }}
      >
        <Toolbar
          sx={{
            justifyContent: 'space-between',
            px: { xs: 2, md: 3 },
            minHeight: { xs: 60, md: 64 },
          }}
        >
          {/* Left: Hamburger + Page Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              onClick={isMobile ? () => setMobileOpen(!mobileOpen) : () => setDrawerCollapsed(!drawerCollapsed)}
              sx={{
                color: 'text.secondary',
                width: 36,
                height: 36,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': { color: 'primary.main', borderColor: 'primary.main' },
              }}
            >
              <MenuIcon sx={{ fontSize: 18 }} />
            </IconButton>

            <Box>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: '1rem',
                  color: 'text.primary',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  display: { xs: 'none', md: 'block' },
                }}
              >
                {getPageTitle()}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.68rem',
                  color: 'text.disabled',
                  fontWeight: 500,
                  display: { xs: 'none', md: 'block' },
                }}
              >
                Workforce Management System
              </Typography>
            </Box>
          </Box>

          {/* Right: DateTime + Notifications + Profile */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>

            {/* DateTime Widget */}
            <Box
              sx={{
                display: { xs: 'none', lg: 'flex' },
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'action.hover',
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.primary', lineHeight: 1.2 }}>
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600, fontFamily: 'monospace', lineHeight: 1.2 }}>
                  {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </Typography>
              </Box>
              <CalendarIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
            </Box>

            {/* Notifications Bell */}
            <Tooltip title="Notifications">
              <IconButton
                onClick={() => navigate('/notifications')}
                sx={{
                  color: 'text.secondary',
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { color: 'primary.main', borderColor: 'primary.main' },
                }}
              >
                <Badge
                  badgeContent={unreadNotifCount}
                  color="error"
                  sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', fontWeight: 800, height: 16, minWidth: 16 } }}
                >
                  <NotificationsIcon sx={{ fontSize: 18 }} />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Profile Avatar */}
            <Tooltip title="My Profile">
              <IconButton
                onClick={(e) => setAnchorElUser(e.currentTarget)}
                sx={{ p: 0 }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: 'primary.main',
                    background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                    border: '2px solid',
                    borderColor: 'background.paper',
                  }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                </Avatar>
              </IconButton>
            </Tooltip>

            {/* User Menu Dropdown */}
            <Menu
              anchorEl={anchorElUser}
              open={Boolean(anchorElUser)}
              onClose={() => setAnchorElUser(null)}
              slotProps={{
                paper: {
                  sx: {
                    width: 220,
                    borderRadius: 3,
                    mt: 1,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    border: '1px solid',
                    borderColor: 'divider',
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2.5, py: 1.8, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' }}>
                  {user?.name || 'Supervisor'}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600 }}>
                  {user?.supervisorId || 'SUP-101'}
                </Typography>
              </Box>
              <MenuItem onClick={() => { setAnchorElUser(null); navigate('/profile'); }} sx={{ py: 1.2, px: 2.5, fontSize: '0.85rem', fontWeight: 600 }}>
                My Profile
              </MenuItem>
              <MenuItem onClick={() => { setAnchorElUser(null); navigate('/profile'); }} sx={{ py: 1.2, px: 2.5, fontSize: '0.85rem', fontWeight: 600 }}>
                Change Password
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={() => { setAnchorElUser(null); logout(); }}
                sx={{ py: 1.2, px: 2.5, color: 'error.main', fontWeight: 700, fontSize: '0.85rem' }}
              >
                Sign Out
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ─── Sidebar Mobile ──────────────────────────────────────────── */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            border: 'none',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* ─── Sidebar Desktop ─────────────────────────────────────────── */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            border: 'none',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      {/* ─── Page Content ────────────────────────────────────────────── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: { xs: 2, md: 2.5 },
          py: { xs: 1.5, md: 2 },
          pt: { xs: '76px', md: '80px' },
          minHeight: '100vh',
          boxSizing: 'border-box',
          width: { md: `calc(100% - ${drawerWidth}px)` },
          overflow: 'hidden',
          transition: theme.transitions.create(['width', 'padding'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Box sx={{ width: '100%' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
