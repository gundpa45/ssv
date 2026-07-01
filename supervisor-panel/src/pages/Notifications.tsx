import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  CheckCircle as MarkReadIcon,
  ArchiveOutlined as ArchiveIcon,
  Warning as AlertIcon,
  Build as ReworkIcon,
  NotificationsActive as SubmissionIcon,
  SettingsSuggest as SystemIcon,
} from '@mui/icons-material';

export const Notifications: React.FC = () => {
  const { notifications, markNotificationRead, archiveNotification, markAllNotificationsRead } = useApp();
  const [activeTab, setActiveTab] = useState(0);

  const tabStatuses = ['All', 'Unread', 'Archived'];

  const filteredNotifs = useMemo(() => {
    return notifications.filter(n => {
      const target = tabStatuses[activeTab];
      if (target === 'Unread') return n.status === 'Unread';
      if (target === 'Archived') return n.status === 'Archived';
      return n.status !== 'Archived'; // 'All' displays read & unread, not archived
    });
  }, [notifications, activeTab]);

  const getNotifIcon = (type: string, priority: string) => {
    const color = priority === 'High' ? 'error.main' : (priority === 'Medium' ? 'warning.main' : 'primary.main');
    
    if (type === 'New Submission') return <SubmissionIcon sx={{ color }} />;
    if (type === 'High Priority Rework') return <ReworkIcon sx={{ color }} />;
    if (type === 'Pending Alert') return <AlertIcon sx={{ color }} />;
    return <SystemIcon sx={{ color }} />;
  };

  const getPriorityChip = (priority: string) => {
    const color = priority === 'High' ? 'error' : (priority === 'Medium' ? 'warning' : 'info');
    return (
      <Chip
        label={`${priority} Priority`}
        size="small"
        color={color}
        sx={{ fontWeight: 700, borderRadius: 1, height: 20, fontSize: '0.72rem' }}
      />
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5 }}>
            Operational Alerts
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Stay updated with raw worker submissions, overdue review warnings, and plant notifications.
          </Typography>
        </Box>
        
        {notifications.some(n => n.status === 'Unread') && (
          <Button
            variant="outlined"
            onClick={markAllNotificationsRead}
            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
          >
            Mark all read
          </Button>
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
          <Tab label={`All Alerts (${notifications.filter(n => n.status !== 'Archived').length})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
          <Tab label={`Unread (${notifications.filter(n => n.status === 'Unread').length})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
          <Tab label={`Archived (${notifications.filter(n => n.status === 'Archived').length})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
        </Tabs>
      </Box>

      {/* Alert list */}
      <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        {filteredNotifs.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
              No notifications found in this view.
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredNotifs.map((notif, index) => {
              const isUnread = notif.status === 'Unread';
              return (
                <React.Fragment key={notif.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    sx={{
                      p: 3,
                      bgcolor: isUnread ? 'rgba(37, 99, 235, 0.02)' : 'transparent',
                      transition: 'background-color 0.2s',
                    }}
                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {isUnread && (
                          <Tooltip title="Mark as Read">
                            <IconButton color="primary" onClick={() => markNotificationRead(notif.id)}>
                              <MarkReadIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {notif.status !== 'Archived' && (
                          <Tooltip title="Archive Alert">
                            <IconButton color="secondary" onClick={() => archiveNotification(notif.id)}>
                              <ArchiveIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    }
                  >
                    <ListItemIcon sx={{ minWidth: 48 }}>
                      {getNotifIcon(notif.type, notif.priority)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: isUnread ? 800 : 600, color: 'text.primary' }}>
                            {notif.title}
                          </Typography>
                          {getPriorityChip(notif.priority)}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: isUnread ? 600 : 500, mb: 0.5 }}>
                            {notif.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(notif.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Card>
    </Box>
  );
};
export default Notifications;
