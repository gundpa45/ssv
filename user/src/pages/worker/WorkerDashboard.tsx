import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Button,
  Paper,
  Chip,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  AccessTime as ClockIcon,
  TrendingUp as TrendIcon,
  CheckCircleOutlined as CheckIcon,
  NotificationsActive as NotificationsIcon,
  ArrowForward as ArrowIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export const WorkerDashboard: React.FC = () => {
  const { user, activityLogs, notifications } = useApp();
  const navigate = useNavigate();

  const today = useMemo(() => new Date().toDateString(), []);
  const workerName = user?.name || 'Employee';
  const firstName = workerName.split(' ')[0];

  const workerLogs = useMemo(() => {
    return activityLogs.filter(log => 
      log.userId === user?.id || 
      log.userId === user?.userId || 
      log.workerName === workerName
    );
  }, [activityLogs, user, workerName]);

  const stats = useMemo(() => {
    const todayLogs = workerLogs.filter(log => {
      const hasSlotToday = log.slots && log.slots.some((s: any) => {
        const slotDate = new Date(s.createdAt || s.startTime || log.createdAt || log.activityDate).toDateString();
        return slotDate === today;
      });
      const logDate = log.createdAt || log.activityDate ? new Date(log.createdAt || log.activityDate).toDateString() : '';
      return hasSlotToday || logDate === today;
    });

    let totalMinutesToday = 0;
    workerLogs.forEach(log => {
      if (log.slots && log.slots.length > 0) {
        log.slots.forEach((slot: any) => {
          const slotDate = new Date(slot.createdAt || slot.startTime || log.createdAt || log.activityDate).toDateString();
          if (slotDate === today) {
            totalMinutesToday += slot.durationMinutes || 0;
          }
        });
      } else {
        const logDate = log.createdAt || log.activityDate ? new Date(log.createdAt || log.activityDate).toDateString() : '';
        if (logDate === today) {
          totalMinutesToday += log.durationMinutes || 0;
        }
      }
    });

    const hoursToday = Math.round((totalMinutesToday / 60) * 10) / 10;

    let totalStdMinutes = 0;
    let totalActMinutes = 0;
    
    workerLogs.forEach(log => {
      if (log.durationMinutes) {
        totalActMinutes += log.durationMinutes;
        if (log.status === 'COMPLETED') {
          totalStdMinutes += log.standardManMinutes || 60;
        } else if (log.status === 'IN_PROGRESS') {
          totalStdMinutes += log.durationMinutes; // 100% productive contribution
        }
      }
    });

    // Productivity based on actual time utilization
    const avgProductivity = totalActMinutes > 0
      ? Math.round((totalStdMinutes / totalActMinutes) * 100)
      : 100; 

    const completedTasksCount = workerLogs.filter(log => log.status === 'COMPLETED').length;
    const inProgressTasksCount = workerLogs.filter(log => log.status === 'IN_PROGRESS').length;
    const unreadCount = notifications.filter(n => !n.isRead).length;

    const inProgressLogs = workerLogs.filter(log => log.status === 'IN_PROGRESS');

    return {
      hoursToday,
      totalMinutesToday,
      avgProductivity,
      completedTasksCount,
      inProgressTasksCount,
      unreadCount,
      todayLogs,
      inProgressLogs,
    };
  }, [workerLogs, notifications, today]);

  const getProductivityColor = (score: number) => {
    if (score >= 95) return '#10B981'; 
    if (score >= 80) return '#3B82F6'; 
    if (score >= 65) return '#F59E0B'; 
    return '#EF4444'; 
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Card
        sx={{
          p: 3,
          mb: 4,
          background: 'linear-gradient(135deg, #0B1E3F 0%, #173366 100%)',
          color: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 10px 25px rgba(11, 30, 63, 0.15)',
        }}
      >
        <Grid container spacing={3} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 8 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 1 }}>
              Welcome back, {firstName}!
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>
              Here is your performance snapshot for today. Keep up the great work!
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
            <Button
              variant="contained"
              onClick={() => navigate('/submit-work')}
              endIcon={<ArrowIcon />}
              sx={{
                bgcolor: '#F59E0B',
                color: '#FFFFFF',
                borderRadius: '12px',
                px: 3,
                py: 1.5,
                fontWeight: 800,
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
                '&:hover': {
                  bgcolor: '#D97706',
                },
              }}
            >
              Submit Daily Report
            </Button>
          </Grid>
        </Grid>
      </Card>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            label: 'Worked Today',
            value: `${stats.totalMinutesToday} mins`,
            subText: `Shift: ${stats.hoursToday} hrs`,
            icon: <ClockIcon />,
            color: '#3B82F6',
            onClick: () => navigate('/history'),
          },
          {
            label: 'Productivity Score',
            value: `${stats.avgProductivity}%`,
            subText: 'Target: >= 85%',
            icon: <TrendIcon />,
            color: getProductivityColor(stats.avgProductivity),
            onClick: () => {},
          },
          {
            label: 'Completed Tasks',
            value: `${stats.completedTasksCount} Activities`,
            subText: 'Total fully completed',
            icon: <CheckIcon />,
            color: '#10B981',
            onClick: () => navigate('/history'),
          },
          {
            label: 'In Progress Tasks',
            value: `${stats.inProgressTasksCount} Activities`,
            subText: 'Multi-shift tasks active',
            icon: <NotificationsIcon />,
            color: stats.inProgressTasksCount > 0 ? '#F59E0B' : '#64748B',
            onClick: () => {},
          },
        ].map((card, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
            <Paper
              onClick={card.onClick}
              sx={{
                p: 3,
                borderRadius: '20px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.04)',
                },
              }}
            >
              <Avatar sx={{ bgcolor: 'rgba(0,0,0,0.03)', color: card.color, width: 48, height: 48 }}>
                {card.icon}
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                  {card.label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.2 }}>
                  {card.value}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                  {card.subText}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* In Progress Activities Ledger */}
      {stats.inProgressLogs.length > 0 && (
        <Card sx={{ borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: 'none', mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0B1E3F', mb: 2.5 }}>
              In Progress Activities (Resumable)
            </Typography>
            <Grid container spacing={3.5}>
              {stats.inProgressLogs.map((log) => (
                <Grid size={{ xs: 12, md: 6 }} key={log.id}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: '16px',
                      bgcolor: '#FFFDF9',
                      borderColor: '#FEF3C7',
                      position: 'relative',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                          {log.activity}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mt: 0.2 }}>
                          SO: {log.soNumber} · Dept: {log.department}
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<PlayIcon />}
                        onClick={() => navigate('/submit-work', { state: { resumeLog: log } })}
                        sx={{
                          bgcolor: '#F59E0B',
                          color: '#FFFFFF',
                          borderRadius: '8px',
                          fontWeight: 750,
                          px: 2,
                          textTransform: 'none',
                          boxShadow: 'none',
                          '&:hover': { bgcolor: '#D97706' },
                        }}
                      >
                        Resume
                      </Button>
                    </Box>

                    <Box sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                          Progress
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 800 }}>
                          {log.progressPercentage || 0}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={log.progressPercentage || 0}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: '#FEE2E2',
                          '& .MuiLinearProgress-bar': { bgcolor: '#F59E0B', borderRadius: 3 }
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                        Time logged so far:
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#1E293B', fontWeight: 800 }}>
                        {log.durationMinutes} minutes
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0B1E3F' }}>
                  Today's Submissions
                </Typography>
                <Button
                  variant="text"
                  onClick={() => navigate('/history')}
                  endIcon={<ArrowIcon sx={{ fontSize: 16 }} />}
                  sx={{ fontWeight: 700, textTransform: 'none', color: '#1E3A8A' }}
                >
                  View History
                </Button>
              </Box>

              {stats.todayLogs.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center', color: '#94A3B8' }}>
                  <Typography variant="body2" sx={{ fontWeight: 650, mb: 1 }}>
                    No work reports submitted today.
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/submit-work')}
                    size="small"
                    sx={{ mt: 1, borderRadius: '8px', fontWeight: 700, textTransform: 'none' }}
                  >
                    File New Report
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {stats.todayLogs.map((log) => {
                    const logProd = log.status === 'COMPLETED'
                      ? (log.standardManMinutes && log.durationMinutes ? Math.round((log.standardManMinutes / log.durationMinutes) * 100) : 100)
                      : 100; // 100% productive contribution for in-progress tasks

                    const minutesToday = log.slots && log.slots.length > 0
                      ? log.slots.reduce((sum: number, s: any) => {
                          const slotDate = new Date(s.createdAt || s.startTime || log.createdAt || log.activityDate).toDateString();
                          return slotDate === today ? sum + (s.durationMinutes || 0) : sum;
                        }, 0)
                      : log.durationMinutes || 0;

                    return (
                      <Paper
                        key={log.id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: '12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                            {log.activity}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mt: 0.3 }}>
                            Serial: {log.soNumber} · Dept: {log.department}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                            {minutesToday} min
                          </Typography>
                          {log.slots && log.slots.length > 1 && (
                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, display: 'block' }}>
                              Total: {log.durationMinutes} min
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', mt: 0.5 }}>
                            <Chip
                              label={log.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                              size="small"
                              sx={{
                                height: 18,
                                fontWeight: 800,
                                fontSize: '0.65rem',
                                bgcolor: log.status === 'COMPLETED' ? '#D1FAE5' : '#FEF3C7',
                                color: log.status === 'COMPLETED' ? '#065F46' : '#92400E',
                              }}
                            />
                            <Chip
                              label={`${logProd}% Prod`}
                              size="small"
                              sx={{
                                height: 18,
                                fontWeight: 800,
                                fontSize: '0.65rem',
                                bgcolor: logProd >= 85 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                color: logProd >= 85 ? '#10B981' : '#EF4444',
                              }}
                            />
                          </Box>
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: 'none', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0B1E3F', mb: 3 }}>
                Shift Progress Ledger
              </Typography>
              
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 700 }}>
                    Shift Hours Logged
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#0F172A', fontWeight: 800 }}>
                    {stats.hoursToday} / 8.0 hrs
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(100, (stats.hoursToday / 8.0) * 100)} 
                  sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#3B82F6', borderRadius: 4 } }} 
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 700 }}>
                    Overall Productivity Score
                  </Typography>
                  <Typography variant="body2" sx={{ color: getProductivityColor(stats.avgProductivity), fontWeight: 800 }}>
                    {stats.avgProductivity}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(100, stats.avgProductivity)} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4, 
                    bgcolor: '#F1F5F9', 
                    '& .MuiLinearProgress-bar': { bgcolor: getProductivityColor(stats.avgProductivity), borderRadius: 4 } 
                  }} 
                />
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                  Roster Profile & Shifts
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Shift Roster</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Day Shift (09:00 - 17:30)</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Department</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{user?.userId === 'EMP008' ? 'Dispatch' : 'Core Assembly'}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

