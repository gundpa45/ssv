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
  Menu,
  MenuItem,
  Tooltip,
  useTheme,
  useMediaQuery,
  Collapse,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Logout as LogoutIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  MonitorHeart as MonitorIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Assignment as SOIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';

const DRAWER_WIDTH = 260;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { themeMode, toggleTheme, logout, user } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  
  const isReportsPath = location.pathname.startsWith('/so-reports') ||
    location.pathname.startsWith('/so-dashboard') ||
    location.pathname === '/individual-employee-report';

  const isSoReportsPath = location.pathname.startsWith('/so-reports') || location.pathname.startsWith('/so-dashboard');

  const [reportsExpanded, setReportsExpanded] = useState(isReportsPath);
  const [soReportsExpanded, setSoReportsExpanded] = useState(isSoReportsPath);

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

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Users', icon: <PeopleIcon />, path: '/user-management' },
    { text: 'Departments', icon: <BusinessIcon />, path: '/department-management' },
    { text: 'SO Management', icon: <SOIcon />, path: '/so-management' },
    { text: 'Work Monitoring', icon: <MonitorIcon />, path: '/work-monitoring' },
    {
      text: 'Reports',
      icon: <AnalyticsIcon />,
      path: '/so-reports',
      children: [
        {
          text: 'SO Reports',
          path: '/so-reports',
          children: [
            { text: 'SO Summary Report', path: '/so-reports', tab: 0 },
            { text: 'Department-wise SO Report', path: '/so-reports', tab: 1 },
            { text: 'Employee-wise SO Report', path: '/so-reports', tab: 2 },
          ],
        },
        { text: 'Individual Employee Report', path: '/individual-employee-report' },
      ],
    },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const getPageTitle = () => {
    if (location.pathname === '/dashboard') return 'Activity Overview';
    if (location.pathname === '/user-management') return 'User Management';
    if (location.pathname === '/department-management') return 'Department Performance';
    if (location.pathname === '/so-management') return 'Sales Order Registry';
    if (location.pathname.startsWith('/so-dashboard') || location.pathname.startsWith('/so-reports')) return 'Sales Order Reports';
    if (location.pathname === '/work-monitoring') return 'Work Monitoring';
    if (location.pathname === '/reports-analytics') return 'Reports & Analytics';
    if (location.pathname === '/worker-productivity') return 'Worker Productivity Telemetry';
    if (location.pathname === '/individual-employee-report') return 'Individual Employee Report';
    if (location.pathname === '/settings') return 'System Settings';
    if (location.pathname.startsWith('/user-profile')) return 'Employee Profile';
    return 'Work Monitoring';
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      {/* Brand Header */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar
          sx={{
            bg: 'primary.main',
            background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
            width: 38,
            height: 38,
            fontWeight: 800,
            fontSize: '1.1rem',
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.4)',
          }}
        >
          W
        </Avatar>
        {(!drawerCollapsed || isMobile) && (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Workforce Management System
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Management Suite
            </Typography>
          </Box>
        )}
      </Box>
      <Divider sx={{ borderStyle: 'dashed' }} />

      {/* Navigation List */}
      <List sx={{ px: 1.5, py: 2, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const hasChildren = !!item.children;

          if (hasChildren) {
            const isChildActive = item.children?.some((child) => {
              if (child.children) {
                return child.children.some((sub) => {
                  const matchTab = new URLSearchParams(location.search).get('tab');
                  const activeTab = matchTab ? parseInt(matchTab, 10) : 0;
                  return (location.pathname.startsWith('/so-reports') || location.pathname.startsWith('/so-dashboard')) && activeTab === sub.tab;
                });
              }
              return location.pathname === child.path;
            });
            const isOpen = reportsExpanded;

            return (
              <React.Fragment key={item.text}>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => {
                      if (drawerCollapsed && !isMobile) {
                        setDrawerCollapsed(false);
                        setReportsExpanded(true);
                      } else {
                        setReportsExpanded(!reportsExpanded);
                      }
                    }}
                    sx={{
                      borderRadius: 3,
                      py: 1.2,
                      px: drawerCollapsed && !isMobile ? 1.5 : 2,
                      justifyContent: drawerCollapsed && !isMobile ? 'center' : 'initial',
                      bgcolor: isChildActive && !isOpen ? 'primary.main' : 'transparent',
                      color: isChildActive && !isOpen ? 'primary.contrastText' : 'text.secondary',
                      background: isChildActive && !isOpen ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : 'transparent',
                      boxShadow: isChildActive && !isOpen ? '0 8px 20px -6px rgba(37, 99, 235, 0.5)' : 'none',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: isChildActive && !isOpen ? 'primary.main' : 'action.hover',
                        color: isChildActive && !isOpen ? 'primary.contrastText' : 'primary.main',
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: drawerCollapsed && !isMobile ? 0 : 40,
                        mr: drawerCollapsed && !isMobile ? 0 : 'initial',
                        justifyContent: 'center',
                        color: isChildActive && !isOpen ? 'primary.contrastText' : 'inherit',
                        transition: 'color 0.3s',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {(!drawerCollapsed || isMobile) && (
                      <>
                        <ListItemText
                          primary={
                            <Typography sx={{ fontSize: '0.95rem', fontWeight: isChildActive ? 750 : 600 }}>
                              {item.text}
                            </Typography>
                          }
                        />
                        {isOpen ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
                      </>
                    )}
                  </ListItemButton>
                </ListItem>

                <Collapse in={isOpen && (!drawerCollapsed || isMobile)} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ pl: drawerCollapsed ? 0 : 3, mt: 0.5, mb: 1 }}>
                    {item.children?.map((child) => {
                      const hasSubChildren = !!child.children;

                      if (hasSubChildren) {
                        const isSubChildActive = child.children?.some((sub) => {
                          const matchTab = new URLSearchParams(location.search).get('tab');
                          const activeTab = matchTab ? parseInt(matchTab, 10) : 0;
                          return (location.pathname.startsWith('/so-reports') || location.pathname.startsWith('/so-dashboard')) && activeTab === sub.tab;
                        });
                        const isSubOpen = soReportsExpanded;

                        return (
                          <React.Fragment key={child.text}>
                            <ListItem disablePadding sx={{ mb: 0.5 }}>
                              <ListItemButton
                                onClick={() => {
                                  setSoReportsExpanded(!soReportsExpanded);
                                }}
                                sx={{
                                  borderRadius: 2.5,
                                  py: 0.8,
                                  px: 2,
                                  bgcolor: isSubChildActive && !isSubOpen ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                                  color: isSubChildActive ? 'primary.main' : 'text.secondary',
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    bgcolor: 'action.hover',
                                    color: 'primary.main',
                                    transform: 'translateX(4px)',
                                  },
                                }}
                              >
                                <ListItemText
                                  primary={
                                    <Typography sx={{ fontSize: '0.88rem', fontWeight: isSubChildActive ? 800 : 600 }}>
                                      {child.text}
                                    </Typography>
                                  }
                                />
                                {isSubOpen ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
                              </ListItemButton>
                            </ListItem>

                            <Collapse in={isSubOpen} timeout="auto" unmountOnExit>
                              <List component="div" disablePadding sx={{ pl: 2, mt: 0.5, mb: 1 }}>
                                {child.children?.map((sub) => {
                                  const matchTab = new URLSearchParams(location.search).get('tab');
                                  const activeTab = matchTab ? parseInt(matchTab, 10) : 0;
                                  const isSubActive = (location.pathname.startsWith('/so-reports') || location.pathname.startsWith('/so-dashboard')) && activeTab === sub.tab;

                                  const match = location.pathname.match(/^\/(so-reports|so-dashboard)\/([^/]+)/);
                                  const currentSoNumber = match ? match[2] : null;

                                  const targetPath = currentSoNumber 
                                    ? `/so-reports/${currentSoNumber}?tab=${sub.tab}` 
                                    : `/so-reports?tab=${sub.tab}`;

                                  return (
                                    <ListItem key={sub.text} disablePadding sx={{ mb: 0.5 }}>
                                      <ListItemButton
                                        onClick={() => handleNavigation(targetPath)}
                                        sx={{
                                          borderRadius: 2,
                                          py: 0.6,
                                          px: 2,
                                          bgcolor: isSubActive ? 'rgba(37, 99, 235, 0.04)' : 'transparent',
                                          color: isSubActive ? 'primary.main' : 'text.secondary',
                                          transition: 'all 0.2s ease',
                                          '&:hover': {
                                            bgcolor: 'action.hover',
                                            color: 'primary.main',
                                            transform: 'translateX(4px)',
                                          },
                                        }}
                                      >
                                        <ListItemText
                                          primary={
                                            <Typography sx={{ fontSize: '0.82rem', fontWeight: isSubActive ? 800 : 500 }}>
                                              {sub.text}
                                            </Typography>
                                          }
                                        />
                                      </ListItemButton>
                                    </ListItem>
                                  );
                                })}
                              </List>
                            </Collapse>
                          </React.Fragment>
                        );
                      }

                      const isSubActive = location.pathname === child.path;
                      return (
                        <ListItem key={child.text} disablePadding sx={{ mb: 0.5 }}>
                          <ListItemButton
                            onClick={() => handleNavigation(child.path)}
                            sx={{
                              borderRadius: 2.5,
                              py: 0.8,
                              px: 2,
                              bgcolor: isSubActive ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                              color: isSubActive ? 'primary.main' : 'text.secondary',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: 'action.hover',
                                color: 'primary.main',
                                transform: 'translateX(4px)',
                              },
                            }}
                          >
                            <ListItemText
                              primary={
                                <Typography sx={{ fontSize: '0.88rem', fontWeight: isSubActive ? 800 : 600 }}>
                                  {child.text}
                                </Typography>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          }

          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 3,
                  py: 1.2,
                  px: drawerCollapsed && !isMobile ? 1.5 : 2,
                  justifyContent: drawerCollapsed && !isMobile ? 'center' : 'initial',
                  bgcolor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'primary.contrastText' : 'text.secondary',
                  background: isActive ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : 'transparent',
                  boxShadow: isActive ? '0 8px 20px -6px rgba(37, 99, 235, 0.5)' : 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.main' : 'action.hover',
                    color: isActive ? 'primary.contrastText' : 'primary.main',
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: drawerCollapsed && !isMobile ? 0 : 40,
                    mr: drawerCollapsed && !isMobile ? 0 : 'initial',
                    justifyContent: 'center',
                    color: isActive ? 'primary.contrastText' : 'inherit',
                    transition: 'color 0.3s',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {(!drawerCollapsed || isMobile) && (
                  <ListItemText
                    primary={
                      <Typography sx={{ fontSize: '0.95rem', fontWeight: isActive ? 700 : 600 }}>
                        {item.text}
                      </Typography>
                    }
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Sidebar Footer Controls */}
      <Box sx={{ p: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
        <List disablePadding>
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={toggleTheme}
              sx={{
                borderRadius: 3,
                py: 1.2,
                justifyContent: drawerCollapsed && !isMobile ? 'center' : 'initial',
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' },
              }}
            >
              <ListItemIcon sx={{ minWidth: drawerCollapsed && !isMobile ? 0 : 40, color: 'inherit', justifyContent: 'center' }}>
                {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </ListItemIcon>
              {(!drawerCollapsed || isMobile) && (
                <ListItemText
                  primary={
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
                      {themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </Typography>
                  }
                />
              )}
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton
              onClick={logout}
              sx={{
                borderRadius: 3,
                py: 1.2,
                justifyContent: drawerCollapsed && !isMobile ? 'center' : 'initial',
                color: 'error.main',
                '&:hover': {
                  bgcolor: 'error.lighter',
                  background: 'rgba(239, 68, 68, 0.08)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: drawerCollapsed && !isMobile ? 0 : 40, color: 'inherit', justifyContent: 'center' }}>
                <LogoutIcon />
              </ListItemIcon>
              {(!drawerCollapsed || isMobile) && (
                <ListItemText
                  primary={
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
                      Sign Out
                    </Typography>
                  }
                />
              )}
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top Navbar Header */}
      <AppBar
        position="fixed"
        sx={{
          width: {
            md: `calc(100% - ${drawerCollapsed ? 76 : DRAWER_WIDTH}px)`,
          },
          ml: {
            md: `${drawerCollapsed ? 76 : DRAWER_WIDTH}px`,
          },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          bgcolor: 'background.default',
          backgroundImage: 'none',
          boxShadow: 'none',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={isMobile ? handleDrawerToggle : () => setDrawerCollapsed(!drawerCollapsed)}
              sx={{ color: 'text.primary' }}
            >
              <MenuIcon />
            </IconButton>

            {/* Company Logo in Top Navbar */}
            <Avatar
              sx={{
                background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
                width: 32,
                height: 32,
                fontWeight: 800,
                fontSize: '0.95rem',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)',
                display: { xs: 'none', sm: 'flex' },
              }}
            >
              W
            </Avatar>

            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', display: { xs: 'none', md: 'block' } }}>
              {getPageTitle()}
            </Typography>
          </Box>

          {/* Header Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            {/* Direct Logout Button */}
            <Tooltip title="Log Out Securely">
              <IconButton onClick={logout} color="error" sx={{ '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' } }}>
                <LogoutIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>

            {/* Admin Profile */}
            <Tooltip title="Admin Profile & Sessions">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    width: 38,
                    height: 38,
                    fontWeight: 700,
                    boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)',
                  }}
                >
                  A
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorElUser}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
              slotProps={{ paper: { sx: { width: 220, borderRadius: 4, mt: 1.5, boxShadow: '0 10px 40px rgba(0,0,0,0.2)', border: '1px solid', borderColor: 'divider' } } }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2.5, py: 1.8 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>Administrator</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{user?.userId || 'admin@workforce-management.com'}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/settings'); }} sx={{ py: 1.2, px: 2.5 }}>My Profile</MenuItem>
              <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/settings'); }} sx={{ py: 1.2, px: 2.5 }}>Security Settings</MenuItem>
              <Divider />
              <MenuItem onClick={() => { handleCloseUserMenu(); logout(); }} sx={{ py: 1.2, px: 2.5, color: 'error.main', fontWeight: 600 }}>Sign Out</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Left Sidebar Drawer - Mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: 'none' },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Left Sidebar Drawer - Desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: drawerCollapsed ? 76 : DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerCollapsed ? 76 : DRAWER_WIDTH,
            borderRight: '1px solid',
            borderColor: 'divider',
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

      {/* Page Content Container */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          width: {
            md: `calc(100% - ${drawerCollapsed ? 76 : DRAWER_WIDTH}px)`,
          },
          pt: { xs: 10, md: 12 },
          minHeight: '100vh',
          boxSizing: 'border-box',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Box sx={{ maxWidth: 1400, mx: 'auto' }} className="animate-fade-in">
          {children}
        </Box>
      </Box>
    </Box>
  );
};
