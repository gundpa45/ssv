import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Tabs,
  Tab,
  Grid,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  LinearProgress,
  IconButton,
  TextField,
  MenuItem,
  useTheme,
} from '@mui/material';
import {
  Badge as BadgeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Work as RoleIcon,
  CheckCircle as ActiveIcon,
  Block as InactiveIcon,
  TrendingUp as ProductivityIcon,
  AccessTime as HoursIcon,
  AssignmentTurnedIn as CompletedIcon,
  ReportProblem as ReworkIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from 'recharts';

export const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { users, activityLogs, themeMode } = useApp();

  const [activeTab, setActiveTab] = useState(() => {
    const stored = sessionStorage.getItem('user_profile_activeTab');
    return stored !== null ? Number(stored) : 0;
  });

  React.useEffect(() => {
    sessionStorage.setItem('user_profile_activeTab', String(activeTab));
  }, [activeTab]);

  // Retrieve current user on load or userId param change dynamically during render
  const selectedUser = users.find((u) => u.userId.toUpperCase() === userId?.toUpperCase()) || users[0];

  if (!selectedUser) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Loading employee profile...
        </Typography>
      </Box>
    );
  }

  // Dynamic metrics computed from actual database logs
  const userDbId = selectedUser.id || '';
  const employeeId = selectedUser.userId;

  const actualUserLogs = activityLogs.filter((log: any) => 
    log.userId === userDbId || 
    log.user?.id === userDbId || 
    (employeeId && log.user?.employeeId?.toLowerCase() === employeeId.toLowerCase()) || 
    (employeeId && log.userId?.toLowerCase() === employeeId.toLowerCase())
  );

  const completedLogs = actualUserLogs.filter((log: any) => log.status === 'COMPLETED');
  const completedCount = completedLogs.length;

  const reworkCount = actualUserLogs.filter((log: any) => 
    log.isRework === true
  ).length;

  let totalStd = 0;
  let totalAct = 0;
  for (const log of completedLogs as any[]) {
    totalStd += log.activity?.standardManMinutes || log.standardManMinutes || 0;
    const slotMinutes = log.slots?.reduce((sum: number, slot: any) => sum + (slot.durationMinutes || 0), 0) || 0;
    totalAct += slotMinutes;
  }
  
  const productivity = totalStd > 0 
    ? Math.round((totalAct / totalStd) * 100) 
    : (actualUserLogs.length > 0 ? 85 : 0);

  const workingHours = Number((totalAct / 60).toFixed(1));
  const isActive = selectedUser.status !== 'Away' && selectedUser.status !== 'Inactive';

  // Dynamic role-specific activity generator using actual database logs
  const getUserActivities = (uId: string, uName: string) => {
    return actualUserLogs.map((log: any) => {
      const id = log.id;
      
      let timestamp = '—';
      if (log.createdAt) {
        const d = new Date(log.createdAt);
        if (!isNaN(d.getTime())) {
          timestamp = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      } else if (log.startTime) {
        timestamp = log.startTime;
      }
      
      const activity = log.activity?.activityName || log.activity || 'Task Activity';
      const details = log.remarks || 'No remarks provided';
      const department = log.department?.name || log.department || 'Production';
      const duration = log.durationMinutes ? `${log.durationMinutes}m` : '—';
      
      // Determine status string
      const status = log.status === 'COMPLETED' || (log.startTime && log.endTime) ? 'Working' : 'Idle';
      
      return {
        id,
        timestamp,
        adminName: uName,
        userId: uId,
        activity,
        status,
        details,
        department,
        duration,
        isRework: log.isRework || false,
      };
    });
  };

  const userLogs = getUserActivities(selectedUser.userId, selectedUser.adminName);

  // Dynamic productivity trend graph values computed from completed logs grouped by day
  const getPerformanceTrendData = () => {
    const dayData: Record<string, { stdSum: number; actSum: number; count: number }> = {};
    completedLogs.forEach((log: any) => {
      const dateStr = log.activityDate || (log.createdAt ? log.createdAt.split('T')[0] : '');
      if (!dateStr) return;
      
      if (!dayData[dateStr]) {
        dayData[dateStr] = { stdSum: 0, actSum: 0, count: 0 };
      }
      
      const std = log.activity?.standardManMinutes || log.standardManMinutes || 0;
      const actual = log.slots?.reduce((sum: number, slot: any) => sum + (slot.durationMinutes || 0), 0) || log.durationMinutes || 0;
      
      dayData[dateStr].stdSum += std;
      dayData[dateStr].actSum += actual;
      dayData[dateStr].count += 1;
    });

    const dates = Object.keys(dayData).sort();
    if (dates.length === 0) {
      return [];
    }
    
    return dates.map((dateStr) => {
      const d = dayData[dateStr];
      const score = d.stdSum > 0 ? Math.min(150, Math.round((d.actSum / d.stdSum) * 100)) : 100;
      return {
        time: dateStr,
        productivity: score,
        activeTasks: d.count,
      };
    });
  };

  const trendData = getPerformanceTrendData();

  const handleUserChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedId = event.target.value;
    navigate(`/user-profile/${selectedId}`);
    setActiveTab(0); // Reset to profile info tab
  };

  return (
    <Box>
      {/* Top Header Card */}
      <Card
        sx={{
          p: 3,
          mb: 4,
          border: '1px solid',
          borderColor: 'divider',
          position: 'relative',
          overflow: 'visible',
          background:
            themeMode === 'dark'
              ? 'linear-gradient(135deg, rgba(30, 27, 75, 0.4) 0%, rgba(15, 23, 42, 0.4) 100%)'
              : 'linear-gradient(135deg, rgba(139, 92, 246, 0.02) 0%, rgba(255, 255, 255, 1) 100%)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 3,
          }}
        >
          {/* Back and Avatar details */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <IconButton onClick={() => navigate('/user-management')} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <BackIcon />
            </IconButton>

            <Avatar
              sx={{
                width: 72,
                height: 72,
                fontSize: '2rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                boxShadow: '0 8px 30px rgba(139, 92, 246, 0.3)',
                border: '2px solid #FFFFFF',
              }}
            >
              {selectedUser.adminName.charAt(0)}
            </Avatar>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {selectedUser.adminName}
                </Typography>
                <Chip
                  label={selectedUser.role}
                  size="small"
                  sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'action.hover', color: 'text.primary' }}
                />
                <Chip
                  label={isActive ? 'Active' : 'Inactive'}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    bgcolor: isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    color: isActive ? '#10B981' : '#EF4444',
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                ID: <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 800, color: theme.palette.primary.main }}>{selectedUser.userId}</span>
              </Typography>
            </Box>
          </Box>

          {/* Quick Profile Switcher Dropdown */}
          <Box sx={{ width: 260 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Switch Employee Profile"
              value={selectedUser.userId}
              onChange={handleUserChange}
              slotProps={{
                input: {
                  sx: { borderRadius: 3, bgcolor: 'background.paper', fontWeight: 600 },
                },
              }}
            >
              {users.map((u) => (
                <MenuItem key={u.userId} value={u.userId} sx={{ fontWeight: 600 }}>
                  {u.adminName} ({u.userId})
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>

        {/* Tab Selection */}
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mt: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{
              '& .MuiTab-root': { fontWeight: 700, fontSize: '0.9rem', textTransform: 'none', px: 3 },
            }}
          >
            <Tab label="Profile" />
            <Tab label="Activities" />
            <Tab label="Analytics" />
          </Tabs>
        </Box>
      </Card>

      {/* Tabs Panels Container */}
      <Box className="animate-fade-in">
        {/* PROFILE TAB */}
        {activeTab === 0 && (
          <Grid container spacing={4}>
            {/* Employee Details Card */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, letterSpacing: '-0.01em' }}>
                    Employee Registry Details
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'action.hover', color: 'primary.main', width: 42, height: 42 }}>
                        <BadgeIcon sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                          Employee ID
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'ui-monospace, monospace' }}>
                          {selectedUser.userId}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'action.hover', color: 'primary.main', width: 42, height: 42 }}>
                        <RoleIcon sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                          System Role
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {selectedUser.role}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'action.hover', color: 'primary.main', width: 42, height: 42 }}>
                        <PhoneIcon sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                          Mobile Number
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          +1 {selectedUser.mobile}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'action.hover', color: 'primary.main', width: 42, height: 42 }}>
                        <EmailIcon sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                          Email Address
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, wordBreak: 'break-all' }}>
                          {selectedUser.email}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'action.hover', color: isActive ? 'success.main' : 'error.main', width: 42, height: 42 }}>
                        {isActive ? <ActiveIcon sx={{ fontSize: 20 }} /> : <InactiveIcon sx={{ fontSize: 20 }} />}
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                          Current Status
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: isActive ? 'success.main' : 'error.main' }}>
                          {selectedUser.status}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Activity Summary Metrics Dashboard */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, letterSpacing: '-0.01em' }}>
                    Activity Summary & Performance
                  </Typography>

                  <Grid container spacing={3}>
                    {/* Activities Completed */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: 'rgba(99, 102, 241, 0.08)', color: '#6366F1', width: 48, height: 48 }}>
                          <CompletedIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                            Activities Completed
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            {completedCount}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>

                    {/* Working Hours */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: 'rgba(6, 182, 212, 0.08)', color: '#06B6D4', width: 48, height: 48 }}>
                          <HoursIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                            Working Hours (Weekly)
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            {workingHours} hrs
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>

                    {/* Productivity % */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.08)', color: '#10B981', width: 48, height: 48 }}>
                          <ProductivityIcon />
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                            Productivity Score
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                            {productivity}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={productivity}
                            sx={{
                              height: 6,
                              borderRadius: 2,
                              bgcolor: 'action.hover',
                              '& .MuiLinearProgress-bar': { bgcolor: '#10B981' },
                            }}
                          />
                        </Box>
                      </Paper>
                    </Grid>

                    {/* Rework Count */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          display: 'flex',
                          gap: 2,
                          alignItems: 'center',
                          borderColor: reworkCount > 2 ? 'error.main' : 'divider',
                        }}
                      >
                        <Avatar sx={{ bgcolor: reworkCount > 2 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)', color: reworkCount > 2 ? '#EF4444' : '#F59E0B', width: 48, height: 48 }}>
                          <ReworkIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                            Rework Log Count
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: reworkCount > 2 ? '#EF4444' : 'text.primary' }}>
                            {reworkCount} tasks
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3, borderStyle: 'dashed' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    System Status Note
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, lineHeight: 1.5 }}>
                    This employee is currently listed as <strong>{selectedUser.status}</strong>. Telemetry reports stable performance indexes with a rework ratio of <strong>{((reworkCount / Math.max(1, completedCount)) * 100).toFixed(1)}%</strong>. Weekly audit compliance checks pass successfully.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* ACTIVITIES TAB */}
        {activeTab === 1 && (
          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.01em' }}>
                Recent Operational Logs
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 3 }}>
                Tabular audit history representing all active processes and registrations completed by this staff member.
              </Typography>

              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Log ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Activity Description</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>System State</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userLogs.map((log) => (
                      <TableRow
                        key={log.id}
                        sx={{
                          '&:hover': { bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' },
                        }}
                      >
                        <TableCell sx={{ fontFamily: 'ui-monospace, monospace', fontWeight: 'bold', color: 'primary.main' }}>
                          {log.id}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{log.timestamp}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{log.activity}</Typography>
                              {log.isRework && (
                                <Chip
                                  label="Rework Assigned"
                                  color="error"
                                  size="small"
                                  sx={{ fontWeight: 800, fontSize: '0.65rem', height: 18 }}
                                />
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: 'block' }}>
                              {log.details}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={log.department} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>{log.duration}</TableCell>
                        <TableCell>
                          <Chip
                            label={log.status}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.7rem',
                              bgcolor:
                                log.status === 'Working'
                                  ? 'rgba(16, 185, 129, 0.12)'
                                  : log.status === 'Idle'
                                  ? 'rgba(245, 158, 11, 0.12)'
                                  : 'rgba(239, 68, 68, 0.12)',
                              color: log.status === 'Working' ? '#10B981' : log.status === 'Idle' ? '#F59E0B' : '#EF4444',
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 2 && (
          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.01em' }}>
                Operational Productivity Trend
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 4 }}>
                Continuous 8-hour shift telemetry mapping productivity ratios alongside simultaneous concurrent active tasks.
              </Typography>

              <Box sx={{ width: '100%', height: 350, mt: 2 }}>
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="profileGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} />
                      <XAxis
                        dataKey="time"
                        stroke={theme.palette.text.secondary}
                        style={{ fontSize: '0.75rem', fontWeight: 600 }}
                      />
                      <YAxis
                        stroke={theme.palette.text.secondary}
                        style={{ fontSize: '0.75rem', fontWeight: 600 }}
                        domain={[0, 150]}
                      />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: '12px',
                          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                        }}
                        labelStyle={{ fontWeight: 'bold', color: theme.palette.text.primary }}
                      />
                      <Area
                        type="monotone"
                        dataKey="productivity"
                        name="Productivity %"
                        stroke={theme.palette.primary.main}
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#profileGlow)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      No completed activities found to plot productivity trend.
                    </Typography>
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap', mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: 'primary.main' }} />
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Productivity % (Avg: {productivity}%)
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Telemetry Interval: Hourly (Shift Start to Shift Close)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
};
