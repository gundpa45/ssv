import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Divider,
  Chip,
  Avatar,
  Paper,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Build as ReworkIcon,
  AttachFile as FileIcon,
  InsertDriveFile as DocIcon,
  PhotoCamera as PhotoIcon,
  History as TimelineIcon,
  Person as UserIcon,
} from '@mui/icons-material';

export const ReviewActivity: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    activityLogs,
    user,
    checkoutActivityForReview,
    releaseActivityFromReview,
    approveActivity,
    rejectActivity,
    assignRework,
  } = useApp();

  const log = activityLogs.find(l => l.id === id);

  // --- Local states for actions ---
  const [remarks, setRemarks] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [reworkReason, setReworkReason] = useState('');
  const [expectedCorrection, setExpectedCorrection] = useState('');
  const [reworkPriority, setReworkPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [reworkDueDate, setReworkDueDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0]!;
  });

  const [activeForm, setActiveForm] = useState<'Approve' | 'Reject' | 'Rework' | null>(null);
  const [error, setError] = useState('');

  // Lock Checkout logic: checkout on mount, unlock on unmount if not finalized
  useEffect(() => {
    if (log && log.status === 'Pending') {
      checkoutActivityForReview(log.id, user?.name || 'Sam Supervisor');
    }

    return () => {
      // Release lock on unmount if the status is still Under Review
      if (log) {
        // Fetch fresh status to make sure we don't unlock already finalized logs
        const freshLog = activityLogs.find(l => l.id === log.id);
        if (freshLog && freshLog.status === 'Under Review' && freshLog.reviewedBy === user?.name) {
          releaseActivityFromReview(freshLog.id);
        }
      }
    };
  }, [id]);

  if (!log) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Activity Log Not Found
        </Typography>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/verification')}>
          Back to Verification
        </Button>
      </Box>
    );
  }

  // Calculate deviation percentage
  const deviation = log.standardManMinutes > 0
    ? Math.round(((log.durationMinutes - log.standardManMinutes) / log.standardManMinutes) * 100)
    : 0;

  const deviationColor = deviation > 20 
    ? 'error' 
    : (deviation < -10 ? 'success' : 'primary');

  const handleApprove = () => {
    approveActivity(log.id, remarks);
    navigate('/verification');
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      setError('Please provide a mandatory reason for rejection.');
      return;
    }
    rejectActivity(log.id, rejectReason);
    navigate('/verification');
  };

  const handleRework = () => {
    if (!reworkReason.trim()) {
      setError('Please enter a reason for the rework correction.');
      return;
    }
    if (!expectedCorrection.trim()) {
      setError('Please specify the expected corrections required.');
      return;
    }
    assignRework(log.id, {
      reason: reworkReason,
      expectedCorrection,
      priority: reworkPriority,
      dueDate: reworkDueDate,
    });
    navigate('/verification');
  };

  const getTimelineIcon = (action: string) => {
    const colors: Record<string, string> = {
      Submitted: '#3B82F6',
      'Under Review': '#F59E0B',
      Approved: '#10B981',
      Rejected: '#EF4444',
      'Rework Assigned': '#8B5CF6',
      'Rework Completed': '#06B6D4',
    };
    const c = colors[action] || '#6B7280';
    return (
      <Avatar sx={{ bgcolor: `${c}15`, color: c, width: 34, height: 34 }}>
        <TimelineIcon sx={{ fontSize: 18 }} />
      </Avatar>
    );
  };

  return (
    <Box>
      {/* Back Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3.5 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/verification')}
          sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: 'none', mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
          Verify Activity Log: {log.id}
        </Typography>
      </Box>

      <Grid container spacing={3.5}>
        {/* Left Column: Details & Submissions */}
        <Grid item xs={12} lg={8}>
          {/* Section 1: Activity Details */}
          <Card sx={{ mb: 3.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2.5 }}>
                1. Activity Details
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                      EMPLOYEE
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {log.workerName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      ID: {log.userId}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                      SALES ORDER
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                      {log.soNumber}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                      DEPARTMENT
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {log.department}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                      ACTIVITY TYPE
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {log.activity}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                      DATE & TIMING
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {log.activityDate} • {log.startTime} - {log.endTime}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                      AUDIT STATUS
                    </Typography>
                    <Chip
                      label={log.status}
                      color={log.status === 'Approved' ? 'success' : (log.status === 'Rejected' ? 'error' : (log.status === 'Rework' ? 'secondary' : 'warning'))}
                      sx={{ fontWeight: 800, borderRadius: 1.5 }}
                    />
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Time Deviation Widgets */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Duration Performance Comparison
                  </Typography>
                  <Typography variant="subtitle2" color={`${deviationColor}.main`} sx={{ fontWeight: 800 }}>
                    {deviation > 0 ? `+${deviation}% Over Standard` : `${deviation}% Under Standard`}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, (log.durationMinutes / Math.max(1, log.standardManMinutes)) * 70)} // visual scale
                  color={deviation > 20 ? 'error' : (deviation < -10 ? 'success' : 'primary')}
                  sx={{ height: 10, borderRadius: 5, mb: 2 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Standard Time: <strong>{log.standardManMinutes} mins</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Actual time logged: <strong>{log.durationMinutes} mins</strong>
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Section 2: Employee Submission Details */}
          <Card sx={{ mb: 3.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                2. Employee Submission
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, fontWeight: 500 }}>
                Remarks: <span style={{ color: '#111827', fontWeight: 600 }}>{log.remarks || 'No remarks provided.'}</span>
              </Typography>

              {log.coworkers && log.coworkers.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                    CO-WORKERS ON THIS LOG
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {log.coworkers.map((name, i) => (
                      <Chip key={i} label={name} size="small" icon={<UserIcon />} sx={{ fontWeight: 600 }} />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Attachments list */}
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1.5 }}>
                SUPPORTING ATTACHMENTS
              </Typography>
              {log.attachments && log.attachments.length > 0 ? (
                <Grid container spacing={2}>
                  {log.attachments.map((file, i) => (
                    <Grid item xs={12} sm={6} key={i}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.8,
                          borderRadius: 3,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          bgcolor: 'background.default',
                          '&:hover': { borderColor: 'primary.main', cursor: 'pointer' },
                        }}
                      >
                        {file.type === 'Photo' ? (
                          <PhotoIcon color="primary" />
                        ) : (
                          <DocIcon color="secondary" />
                        )}
                        <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', flexGrow: 1 }}>
                          <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                            {file.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Type: {file.type}
                          </Typography>
                        </Box>
                        <Button size="small" startIcon={<FileIcon />} sx={{ fontWeight: 700 }}>
                          Download
                        </Button>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No photo or documents attached to this log.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Supervisor Actions & Timeline */}
        <Grid item xs={12} lg={4}>
          {/* Section 3: Review Decision Panel */}
          <Card sx={{ mb: 3.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                3. Supervisor Review
              </Typography>

              {log.status !== 'Pending' && log.status !== 'Under Review' ? (
                <Box sx={{ p: 2.5, bgcolor: 'rgba(16, 185, 129, 0.05)', borderRadius: 3, border: '1px solid', borderColor: 'success.light' }}>
                  <Typography variant="subtitle2" color="success.main" sx={{ fontWeight: 700, mb: 1 }}>
                    Locked Permanently
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    This activity log has already been verified and locked.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                    Verified By: <strong>{log.reviewedBy}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                    Verified At: <strong>{log.reviewedAt ? new Date(log.reviewedAt).toLocaleString() : ''}</strong>
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {activeForm === null && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<ApproveIcon />}
                        onClick={() => setActiveForm('Approve')}
                        sx={{ py: 1.2, borderRadius: 2.5, fontWeight: 700 }}
                      >
                        Approve Activity
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<RejectIcon />}
                        onClick={() => setActiveForm('Reject')}
                        sx={{ py: 1.2, borderRadius: 2.5, fontWeight: 700 }}
                      >
                        Reject Activity
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<ReworkIcon />}
                        onClick={() => setActiveForm('Rework')}
                        sx={{ py: 1.2, borderRadius: 2.5, fontWeight: 700 }}
                      >
                        Assign Rework
                      </Button>
                    </Box>
                  )}

                  {error && (
                    <Typography variant="caption" color="error" sx={{ fontWeight: 600 }}>
                      {error}
                    </Typography>
                  )}

                  {/* APPROVE FORM */}
                  {activeForm === 'Approve' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Approve Submission
                      </Typography>
                      <TextField
                        fullWidth
                        label="Supervisor Remarks (Optional)"
                        placeholder="e.g. Verified, standards met perfectly."
                        multiline
                        rows={2}
                        value={remarks}
                        onChange={e => setRemarks(e.target.value)}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" variant="outlined" onClick={() => { setActiveForm(null); setError(''); }} sx={{ flexGrow: 1, borderRadius: 2 }}>
                          Back
                        </Button>
                        <Button size="small" variant="contained" color="success" onClick={handleApprove} sx={{ flexGrow: 1, borderRadius: 2 }}>
                          Confirm Approval
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {/* REJECT FORM */}
                  {activeForm === 'Reject' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'error.main' }}>
                        Reject Submission
                      </Typography>
                      <TextField
                        fullWidth
                        required
                        label="Rejection Reason (Mandatory)"
                        placeholder="Please specify why this log is invalid..."
                        multiline
                        rows={3}
                        value={rejectReason}
                        onChange={e => { setRejectReason(e.target.value); setError(''); }}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" variant="outlined" onClick={() => { setActiveForm(null); setError(''); }} sx={{ flexGrow: 1, borderRadius: 2 }}>
                          Back
                        </Button>
                        <Button size="small" variant="contained" color="error" onClick={handleReject} sx={{ flexGrow: 1, borderRadius: 2 }}>
                          Confirm Reject
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {/* REWORK FORM */}
                  {activeForm === 'Rework' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                        Assign Rework Correction
                      </Typography>
                      <TextField
                        fullWidth
                        required
                        label="Reason for correction"
                        placeholder="Describe the defect or check failed..."
                        value={reworkReason}
                        onChange={e => { setReworkReason(e.target.value); setError(''); }}
                      />
                      <TextField
                        fullWidth
                        required
                        label="Expected Correction"
                        placeholder="Detail expected correction instructions..."
                        multiline
                        rows={2}
                        value={expectedCorrection}
                        onChange={e => { setExpectedCorrection(e.target.value); setError(''); }}
                      />
                      <FormControl fullWidth size="small">
                        <InputLabel>Priority</InputLabel>
                        <Select
                          value={reworkPriority}
                          label="Priority"
                          onChange={e => setReworkPriority(e.target.value as any)}
                        >
                          <MenuItem value="Low">Low</MenuItem>
                          <MenuItem value="Medium">Medium</MenuItem>
                          <MenuItem value="High">High</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="DUE DATE"
                        slotProps={{ inputLabel: { shrink: true } }}
                        value={reworkDueDate}
                        onChange={e => setReworkDueDate(e.target.value)}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" variant="outlined" onClick={() => { setActiveForm(null); setError(''); }} sx={{ flexGrow: 1, borderRadius: 2 }}>
                          Back
                        </Button>
                        <Button size="small" variant="contained" color="secondary" onClick={handleRework} sx={{ flexGrow: 1, borderRadius: 2 }}>
                          Assign Rework
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Section 4: Audit Timeline */}
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2.5 }}>
                4. Activity Timeline
              </Typography>
              <List sx={{ p: 0 }}>
                {log.timeline.map((event, index) => (
                  <ListItem key={index} alignItems="flex-start" sx={{ px: 0, py: 1.5 }}>
                    <ListItemIcon sx={{ minWidth: 46 }}>
                      {getTimelineIcon(event.action)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {event.action}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.primary" sx={{ fontWeight: 600, display: 'block', mt: 0.2 }}>
                            By: {event.user}
                          </Typography>
                          {event.remarks && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic', fontSize: '0.82rem' }}>
                              &quot;{event.remarks}&quot;
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
export default ReviewActivity;
