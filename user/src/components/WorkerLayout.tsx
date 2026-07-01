import React, { useState } from 'react';
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
  Badge,
  Menu,
  MenuItem,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assignment as SubmitIcon,
  History as HistoryIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  FlashOn as FlashIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 260;

interface WorkerLayoutProps {
  children: React.ReactNode;
}

export const WorkerLayout: React.FC<WorkerLayoutProps> = ({ children }) => {
  const { logout, user, notifications } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Submit Work', icon: <SubmitIcon />, path: '/submit-work' },
    { text: 'History', icon: <HistoryIcon />, path: '/history' },
    { 
      text: 'Notifications', 
      icon: (
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      ), 
      path: '/notifications' 
    },
  ];

  const getPageTitle = () => {
    if (location.pathname === '/dashboard') return 'Worker Portal Dashboard';
    if (location.pathname === '/submit-work') return 'Submit Daily Work Report';
    if (location.pathname === '/history') return 'Submission History';
    if (location.pathname === '/notifications') return 'Notifications & Rework';
    return 'Worker Portal';
  };

  const getCurrentDateString = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    return new Date().toLocaleDateString('en-GB', options);
  };

  const workerName = user?.name || 'Worker Employee';
  const employeeId = user?.userId || 'EMP-UNKNOWN';
  const workerRole = user?.role || 'Operator';

  const getDepartment = () => {
    if (employeeId.toLowerCase() === 'emp008') return 'Dispatch';
    if (employeeId.toLowerCase() === 'emp003') return 'Dispatch';
    if (employeeId.toLowerCase() === 'emp-2001') return 'Dispatch';
    if (employeeId.toLowerCase() === 'emp-1990') return 'CA Assembly';
    return 'Production';
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0B1E3F', color: '#FFFFFF' }}>
      {/* Brand Header */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            background: '#F59E0B',
            borderRadius: '8px',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)',
          }}
        >
          <FlashIcon sx={{ fontSize: 20, color: '#FFFFFF' }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            PowerGrid
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.45)', fontWeight: 600, fontSize: '0.75rem' }}>
            Solutions Pvt. Ltd.
          </Typography>
        </Box>
      </Box>

      {/* User Info Card in Sidebar */}
      <Box sx={{ mx: 2, mb: 3, p: 2, borderRadius: '16px', bgcolor: 'rgba(255, 255, 255, 0.05)', display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <Avatar
          sx={{
            bgcolor: '#F59E0B',
            width: 44,
            height: 44,
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)',
          }}
        >
          <PersonIcon sx={{ color: '#FFFFFF' }} />
        </Avatar>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {workerName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', fontWeight: 600, fontSize: '0.72rem' }}>
            {employeeId} · {workerRole}
          </Typography>
          <Typography variant="caption" sx={{ color: '#F59E0B', display: 'block', fontWeight: 700, fontSize: '0.72rem', mt: 0.2 }}>
            {getDepartment()}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

      {/* Navigation List */}
      <List sx={{ px: 1.5, py: 2, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.75 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: '12px',
                  py: 1.2,
                  px: 2,
                  bgcolor: isActive ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                  color: isActive ? '#F59E0B' : 'rgba(255, 255, 255, 0.65)',
                  borderLeft: isActive ? '3px solid #F59E0B' : '3px solid transparent',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    color: '#FFFFFF',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: isActive ? '#F59E0B' : 'rgba(255, 255, 255, 0.45)',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: isActive ? 800 : 600 }}>
                      {item.text}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Sign Out Button in Sidebar */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <ListItemButton
          onClick={logout}
          sx={{
            borderRadius: '12px',
            py: 1.2,
            color: '#EF4444',
            '&:hover': {
              bgcolor: 'rgba(239, 68, 68, 0.08)',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 700 }}>
                Sign Out
              </Typography>
            }
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F3F4F6' }}>
      {/* Top Navbar Header */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: '#FFFFFF',
          color: '#1E293B',
          boxShadow: 'none',
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0B1E3F', letterSpacing: '-0.01em', fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>
                {getPageTitle()}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: { xs: 'none', sm: 'block' }, fontWeight: 650, mt: 0.2 }}>
                {getCurrentDateString()}
              </Typography>
            </Box>
          </Box>

          {/* Header Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="View Notifications">
              <IconButton onClick={() => navigate('/notifications')} sx={{ bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', p: 1 }}>
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon sx={{ fontSize: 20, color: '#64748B' }} />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Worker Profile">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar
                  sx={{
                    bgcolor: '#0B1E3F',
                    width: 38,
                    height: 38,
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(11, 30, 63, 0.15)',
                  }}
                >
                  {workerName[0]}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorElUser}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
              slotProps={{
                paper: {
                  sx: {
                    width: 220,
                    borderRadius: '16px',
                    mt: 1.5,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    border: '1px solid #E2E8F0',
                  }
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>{workerName}</Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>{employeeId}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/notifications'); }} sx={{ py: 1, px: 2, fontWeight: 600 }}>Rework & Alerts</MenuItem>
              <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/history'); }} sx={{ py: 1, px: 2, fontWeight: 600 }}>Submission History</MenuItem>
              <Divider />
              <MenuItem onClick={() => { handleCloseUserMenu(); logout(); }} sx={{ py: 1, px: 2, color: 'error.main', fontWeight: 700 }}>Sign Out</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer Mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, border: 'none' },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Drawer Desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            border: 'none',
            boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      {/* Main Container */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          pt: { xs: 10, md: 11 },
          minHeight: '100vh',
          boxSizing: 'border-box',
        }}
      >
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};
