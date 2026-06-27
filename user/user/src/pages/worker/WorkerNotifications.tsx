import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Paper,
  Chip,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  Sync as ReworkIcon,
  CheckCircle as ApprovedIcon,
  Info as InfoIcon,
  Check as DoneIcon,
} from '@mui/icons-material';

export const WorkerNotifications: React.FC = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useApp();

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      if (a.isRead === b.isRead) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.isRead ? 1 : -1;
    });
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getStyleForType = (type: string, isRead: boolean) => {
    if (isRead) {
      return {
        bg: '#F8FAFC',
        borderLeft: '4px solid #94A3B8',
        tagBg: 'rgba(148, 163, 184, 0.12)',
        tagColor: '#64748B',
        avatarBg: 'rgba(148, 163, 184, 0.12)',
        avatarColor: '#64748B',
        btnBg: '#64748B',
        btnColor: '#FFFFFF',
        icon: <ApprovedIcon sx={{ fontSize: 20 }} />,
        title: 'Approved',
      };
    }

    const t = type.toLowerCase();
    if (t === 'rework') {
      return {
        bg: '#FFF5F5',
        borderLeft: '4px solid #EF4444',
        tagBg: '#FEE2E2',
        tagColor: '#EF4444',
        avatarBg: 'rgba(239, 68, 68, 0.08)',
        avatarColor: '#EF4444',
        btnBg: '#EF4444',
        btnColor: '#FFFFFF',
        icon: <ReworkIcon sx={{ fontSize: 20 }} />,
        title: 'Rework Assigned',
      };
    }
    if (t === 'approved') {
      return {
        bg: '#F0FDF4',
        borderLeft: '4px solid #10B981',
        tagBg: '#D1FAE5',
        tagColor: '#10B981',
        avatarBg: 'rgba(16, 185, 129, 0.08)',
        avatarColor: '#10B981',
        btnBg: '#10B981',
        btnColor: '#FFFFFF',
        icon: <ApprovedIcon sx={{ fontSize: 20 }} />,
        title: 'Approved',
      };
    }
    return {
      bg: '#EFF6FF',
      borderLeft: '4px solid #3B82F6',
      tagBg: '#DBEAFE',
      tagColor: '#3B82F6',
      avatarBg: 'rgba(59, 130, 246, 0.08)',
      avatarColor: '#3B82F6',
      btnBg: '#3B82F6',
      btnColor: '#FFFFFF',
      icon: <InfoIcon sx={{ fontSize: 20 }} />,
      title: 'Information',
    };
  };

  const getFormattedDate = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0B1E3F', letterSpacing: '-0.02em', mb: 0.5 }}>
          Notifications & Rework
        </Typography>
      </Box>

      <Card sx={{ borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: 'none', mb: 3 }}>
        <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0B1E3F' }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} new`}
                size="small"
                sx={{
                  bgcolor: '#EF4444',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  height: 20,
                }}
              />
            )}
          </Box>

          <Button
            variant="outlined"
            onClick={markAllNotificationsAsRead}
            disabled={unreadCount === 0}
            sx={{
              borderRadius: '10px',
              fontWeight: 750,
              textTransform: 'none',
              px: 2.5,
              py: 0.75,
              color: '#0B1E3F',
              borderColor: '#CBD5E1',
              '&:hover': {
                bgcolor: '#F8FAFC',
                borderColor: '#94A3B8',
              },
            }}
          >
            Mark all as read
          </Button>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {sortedNotifications.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <Typography sx={{ color: '#64748B', fontWeight: 650 }}>
              No notifications logged.
            </Typography>
          </Paper>
        ) : (
          sortedNotifications.map((notif) => {
            const styles = getStyleForType(notif.type, notif.isRead);
            return (
              <Paper
                key={notif.id}
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  bgcolor: styles.bg,
                  border: '1px solid #E2E8F0',
                  borderLeft: styles.borderLeft,
                  boxShadow: 'none',
                  display: 'flex',
                  gap: 2.5,
                  alignItems: 'flex-start',
                }}
              >
                <Avatar sx={{ bgcolor: styles.avatarBg, color: styles.avatarColor, width: 44, height: 44, flexShrink: 0 }}>
                  {styles.icon}
                </Avatar>

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                      label={styles.title}
                      size="small"
                      sx={{
                        bgcolor: styles.tagBg,
                        color: styles.tagColor,
                        fontWeight: 850,
                        fontSize: '0.72rem',
                        height: 22,
                        borderRadius: '6px',
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700 }}>
                      {getFormattedDate(notif.createdAt)}
                    </Typography>
                  </Box>

                  <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 600, mb: 2, lineHeight: 1.5 }}>
                    {notif.message}
                  </Typography>

                  {notif.type.toLowerCase() === 'rework' && notif.referenceId && (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      <Chip label={notif.referenceId} size="small" sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 800, fontSize: '0.72rem', borderRadius: '4px' }} />
                      <Chip label="Core Assembly" size="small" sx={{ bgcolor: '#FFFBEB', color: '#B45309', fontWeight: 800, fontSize: '0.72rem', borderRadius: '4px' }} />
                      <Chip label="Core Clamping" size="small" sx={{ bgcolor: '#FEE2E2', color: '#EF4444', fontWeight: 800, fontSize: '0.72rem', borderRadius: '4px' }} />
                    </Box>
                  )}

                  {!notif.isRead && (
                    <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      ● Unread
                    </Typography>
                  )}
                </Box>

                <IconButton
                  disabled={notif.isRead}
                  onClick={() => markNotificationAsRead(notif.id)}
                  sx={{
                    bgcolor: notif.isRead ? 'transparent' : styles.btnBg,
                    color: notif.isRead ? 'rgba(0,0,0,0.1)' : styles.btnColor,
                    '&:hover': {
                      bgcolor: notif.isRead ? 'transparent' : styles.btnBg,
                      opacity: 0.85,
                    },
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                  }}
                >
                  <DoneIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Paper>
            );
          })
        )}
      </Box>
    </Box>
  );
};
