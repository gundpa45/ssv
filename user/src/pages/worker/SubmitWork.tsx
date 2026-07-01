import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Select,
  MenuItem,
  FormControl,
  TextField,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  Avatar,
  Paper,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Send as SendIcon,
  Warning as WarningIcon,
  TrendingUp as TrendIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface ActivityEntry {
  activityId: string;
  activityName: string;
  duration: string;
  standardMinutes: number;
  status?: 'IN_PROGRESS' | 'COMPLETED';
  progressPercentage?: number;
}

interface DeptEntry {
  id: string;
  departmentId: string;
  departmentName: string;
  selectedActivities: ActivityEntry[];
}

interface CoworkerEntry {
  id: string;
  employeeId: string;
  name: string;
  role: string;
}

export const SubmitWork: React.FC = () => {
  const { user, users, salesOrders, departments, addNewActivityLog, resumeActivityLog } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we are resuming an active activity log
  const resumeLog = location.state?.resumeLog as any | undefined;

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [submitting, setSubmitting] = useState(false);
  const [workType, setWorkType] = useState<'Work' | 'Rework'>('Work');
  const [selectedSONumber, setSelectedSONumber] = useState('');
  const [deptEntries, setDeptEntries] = useState<DeptEntry[]>([
    {
      id: 'entry-1',
      departmentId: '',
      departmentName: '',
      selectedActivities: [],
    }
  ]);
  const [coworkers, setCoworkers] = useState<CoworkerEntry[]>([]);
  const [selectedRemarks, setSelectedRemarks] = useState<string[]>([]);
  const [additionalRemarks, setAdditionalRemarks] = useState('');

  // States for resuming flow
  const [resumeDuration, setResumeDuration] = useState('');
  const [resumeStatus, setResumeStatus] = useState<'IN_PROGRESS' | 'COMPLETED'>('IN_PROGRESS');
  const [resumeProgress, setResumeProgress] = useState(resumeLog?.progressPercentage || 0);

  const employeeId = user?.userId || 'EMP008';
  const workerName = user?.name || 'Worker';

  // Get today's date formatted
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, []);

  const remarksTags = [
    'Material unavailable', 'Machine breakdown', 'Power outage',
    'Waiting for inspection clearance', 'Drawing / specification not available',
    'Required tool unavailable', 'Waiting for crane / lifting equipment',
    'Operator / team member absent', 'Quality rejection – rework required',
    'Scheduled maintenance downtime', 'Raw material quality issue',
    'Customer hold instruction'
  ];

  // Productivity calculation based on standard time per activity
  const calculations = useMemo(() => {
    let totalActMinutes = 0;
    let totalStdMinutes = 0;

    deptEntries.forEach((entry) => {
      entry.selectedActivities.forEach((act) => {
        const actual = parseInt(act.duration) || 0;
        totalActMinutes += actual;
        if (act.status === 'IN_PROGRESS') {
          totalStdMinutes += actual;
        } else {
          totalStdMinutes += act.standardMinutes || 0;
        }
      });
    });

    const hours = Math.floor(totalActMinutes / 60);
    const mins = totalActMinutes % 60;
    const timeFormatted = `${totalActMinutes} min (${hours}h ${mins}m)`;

    // Productivity = (Standard Time / Actual Time) × 100
    // Higher is better — if you do a task in less time than standard, productivity > 100%
    const productivityPct = totalActMinutes > 0 && totalStdMinutes > 0
      ? Math.round((totalStdMinutes / totalActMinutes) * 100)
      : 0;

    return {
      totalActMinutes,
      totalStdMinutes,
      timeFormatted,
      productivityPct,
    };
  }, [deptEntries]);

  const handleDeptSelectChange = (entryId: string, deptId: string) => {
    const matchedDept = departments.find(d => d.id === deptId);
    if (!matchedDept) return;

    setDeptEntries(prev => prev.map(entry => {
      if (entry.id === entryId) {
        return {
          ...entry,
          departmentId: matchedDept.id || '',
          departmentName: matchedDept.name,
          selectedActivities: [],
        };
      }
      return entry;
    }));
  };

  const handleAddDeptEntry = () => {
    const newId = `entry-${Date.now()}`;
    setDeptEntries(prev => [
      ...prev,
      {
        id: newId,
        departmentId: '',
        departmentName: '',
        selectedActivities: [],
      }
    ]);
  };

  const handleDeleteDeptEntry = (entryId: string) => {
    if (deptEntries.length === 1) {
      setSnackbar({
        open: true,
        message: 'At least one department entry is required.',
        severity: 'error',
      });
      return;
    }
    setDeptEntries(prev => prev.filter(e => e.id !== entryId));
  };

  const handleToggleActivity = (entryId: string, actId: string, actName: string, stdMin: number) => {
    setDeptEntries(prev => prev.map(entry => {
      if (entry.id === entryId) {
        const exists = entry.selectedActivities.some(a => a.activityId === actId);
        let updated: ActivityEntry[];

        if (exists) {
          updated = entry.selectedActivities.filter(a => a.activityId !== actId);
        } else {
          updated = [
            ...entry.selectedActivities,
            {
              activityId: actId,
              activityName: actName,
              duration: '',
              standardMinutes: stdMin,
              status: 'COMPLETED',
              progressPercentage: 100,
            }
          ];
        }

        return {
          ...entry,
          selectedActivities: updated,
        };
      }
      return entry;
    }));
  };

  const handleStatusChange = (entryId: string, actId: string, status: 'IN_PROGRESS' | 'COMPLETED') => {
    setDeptEntries(prev => prev.map(entry => {
      if (entry.id === entryId) {
        return {
          ...entry,
          selectedActivities: entry.selectedActivities.map(act =>
            act.activityId === actId ? {
              ...act,
              status,
              progressPercentage: status === 'COMPLETED' ? 100 : 0
            } : act
          ),
        };
      }
      return entry;
    }));
  };

  const handleProgressChange = (entryId: string, actId: string, val: string) => {
    const num = Math.max(0, Math.min(100, parseInt(val) || 0));
    setDeptEntries(prev => prev.map(entry => {
      if (entry.id === entryId) {
        return {
          ...entry,
          selectedActivities: entry.selectedActivities.map(act =>
            act.activityId === actId ? { ...act, progressPercentage: num } : act
          ),
        };
      }
      return entry;
    }));
  };

  const handleDurationChange = (entryId: string, actId: string, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    setDeptEntries(prev => prev.map(entry => {
      if (entry.id === entryId) {
        return {
          ...entry,
          selectedActivities: entry.selectedActivities.map(act =>
            act.activityId === actId ? { ...act, duration: cleaned } : act
          ),
        };
      }
      return entry;
    }));
  };

  const handleToggleRemarksTag = (tag: string) => {
    setSelectedRemarks(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      }
      return [...prev, tag];
    });
  };

  const handleAddCoworker = () => {
    const newId = `co-${Date.now()}`;
    setCoworkers(prev => [
      ...prev,
      {
        id: newId,
        employeeId: '',
        name: '',
        role: '',
      }
    ]);
  };

  const handleCoworkerSelect = (rowId: string, coworkerEmpId: string) => {
    const matchedUser = users.find(u => u.userId === coworkerEmpId || u.id === coworkerEmpId);
    if (!matchedUser) return;

    setCoworkers(prev => prev.map(c => {
      if (c.id === rowId) {
        return {
          ...c,
          employeeId: matchedUser.userId,
          name: matchedUser.adminName,
          role: matchedUser.role,
        };
      }
      return c;
    }));
  };

  const handleDeleteCoworker = (rowId: string) => {
    setCoworkers(prev => prev.filter(c => c.id !== rowId));
  };

  const handleSubmitReport = async () => {
    // Validation
    if (!selectedSONumber) {
      setSnackbar({ open: true, message: 'Please select a Sales Order / Serial Number.', severity: 'error' });
      return;
    }

    let hasError = false;
    let emptyDuration = false;
    let noActivities = true;

    deptEntries.forEach(entry => {
      if (!entry.departmentId) {
        hasError = true;
      }
      if (entry.selectedActivities.length > 0) {
        noActivities = false;
      }
      entry.selectedActivities.forEach(act => {
        if (!act.duration || parseInt(act.duration) <= 0) {
          emptyDuration = true;
        }
      });
    });

    if (hasError) {
      setSnackbar({ open: true, message: 'Please specify the department in all entries.', severity: 'error' });
      return;
    }

    if (noActivities) {
      setSnackbar({ open: true, message: 'Please select at least one activity under your department entries.', severity: 'error' });
      return;
    }

    if (emptyDuration) {
      setSnackbar({ open: true, message: 'Please enter actual duration (> 0 minutes) for all selected activities.', severity: 'error' });
      return;
    }

    setSubmitting(true);
    const coworkerIds = coworkers.map(c => c.employeeId).filter(Boolean);
    const compiledRemarks = [...selectedRemarks, additionalRemarks].filter(Boolean).join('; ');

    try {
      let successCount = 0;
      let totalLogsCount = 0;

      for (const entry of deptEntries) {
        for (const act of entry.selectedActivities) {
          totalLogsCount++;
          const payload = {
            soNumber: selectedSONumber,
            department: entry.departmentName,
            activity: act.activityName,
            durationMinutes: parseInt(act.duration) || 0,
            remarks: compiledRemarks || '',
            coworkers: coworkerIds,
            employeeId: user?.id || user?.userId,
            startTime: '09:00',
            endTime: '17:30',
            userId: user?.id || user?.userId || '',
            workerName: user?.name || workerName,
            standardManMinutes: act.standardMinutes,
            status: act.status || 'COMPLETED',
            progressPercentage: act.status === 'COMPLETED' ? 100 : (act.progressPercentage || 0),
          };

          const result = await addNewActivityLog(payload);
          if (result) successCount++;
        }
      }

      if (successCount === totalLogsCount && totalLogsCount > 0) {
        setSnackbar({ open: true, message: '🎉 Work report submitted successfully!', severity: 'success' });
        // Reset form
        setSelectedSONumber('');
        setDeptEntries([{ id: 'entry-1', departmentId: '', departmentName: '', selectedActivities: [] }]);
        setCoworkers([]);
        setSelectedRemarks([]);
        setAdditionalRemarks('');
        setTimeout(() => {
          navigate('/history');
        }, 1800);
      } else {
        setSnackbar({ open: true, message: `Report submitted (${successCount}/${totalLogsCount} logs saved).`, severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'A network error occurred. Please try again.', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitResume = async () => {
    if (!resumeLog) return;

    const dur = parseInt(resumeDuration) || 0;
    if (dur <= 0) {
      setSnackbar({ open: true, message: 'Please enter actual duration (> 0 minutes) for this session.', severity: 'error' });
      return;
    }

    if (resumeStatus === 'IN_PROGRESS' && (resumeProgress < 0 || resumeProgress >= 100)) {
      setSnackbar({ open: true, message: 'Progress percentage for an In Progress activity must be between 0 and 99.', severity: 'error' });
      return;
    }

    setSubmitting(true);
    const coworkerIds = coworkers.map(c => c.employeeId).filter(Boolean);
    const compiledRemarks = [...selectedRemarks, additionalRemarks].filter(Boolean).join('; ');

    try {
      const success = await resumeActivityLog(resumeLog.id, {
        durationMinutes: dur,
        progressPercentage: resumeStatus === 'COMPLETED' ? 100 : resumeProgress,
        status: resumeStatus,
        remarks: compiledRemarks || '',
        coworkers: coworkerIds,
        startTime: '09:00',
        endTime: '17:30',
      });

      if (success) {
        setSnackbar({ open: true, message: '🎉 Activity updated successfully!', severity: 'success' });
        setTimeout(() => {
          navigate('/history');
        }, 1800);
      } else {
        setSnackbar({ open: true, message: 'Failed to update activity.', severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'A network error occurred. Please try again.', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const getProductivityBadgeColor = (score: number) => {
    if (score === 0) return { bg: '#F1F5F9', color: '#64748B' };
    if (score < 70) return { bg: '#FEE2E2', color: '#EF4444' };
    if (score < 85) return { bg: '#FEF3C7', color: '#F59E0B' };
    return { bg: '#D1FAE5', color: '#10B981' };
  };

  const badgeStyles = getProductivityBadgeColor(calculations.productivityPct);

  // Resume form layout definition
  if (resumeLog) {
    return (
      <Box sx={{ pb: 6 }}>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar(p => ({ ...p, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: '12px', fontWeight: 650 }}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0B1E3F', letterSpacing: '-0.02em' }}>
            Resume Activity Progress
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600, mt: 0.5 }}>
            Update minutes worked and current completion percentage for this ongoing activity.
          </Typography>
        </Box>

        {/* Resumed Task Metadata */}
        <Card sx={{ borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: 'none', mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Avatar sx={{ bgcolor: '#F59E0B', color: '#FFFFFF', width: 28, height: 28, fontSize: '0.9rem', fontWeight: 700 }}>✓</Avatar>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0B1E3F' }}>Active Activity Details</Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.5 }}>Sales Order</Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: '#0F172A' }}>{resumeLog.soNumber}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.5 }}>Department / Activity</Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: '#0F172A' }}>{resumeLog.department} — {resumeLog.activity}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.5 }}>Cumulative Duration Logged</Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: '#0F172A' }}>{resumeLog.durationMinutes} mins</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Resume Session Inputs */}
        <Card sx={{ borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: 'none', mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Avatar sx={{ bgcolor: '#0B1E3F', color: '#FFFFFF', width: 28, height: 28, fontSize: '0.9rem', fontWeight: 700 }}>1</Avatar>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0B1E3F' }}>Session Log Details</Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 1 }}>Minutes Worked in this Session</Typography>
                <TextField
                  fullWidth
                  placeholder="e.g. 45"
                  value={resumeDuration}
                  onChange={(e) => setResumeDuration(e.target.value.replace(/\D/g, ''))}
                  slotProps={{
                    input: {
                      endAdornment: <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700 }}>min</Typography>,
                      sx: { borderRadius: '12px', fontWeight: 750 }
                    }
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 1 }}>Task Status</Typography>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button
                    fullWidth
                    variant={resumeStatus === 'IN_PROGRESS' ? 'contained' : 'outlined'}
                    onClick={() => setResumeStatus('IN_PROGRESS')}
                    sx={{
                      borderRadius: '12px',
                      py: 1.2,
                      fontWeight: 800,
                      textTransform: 'none',
                      color: resumeStatus === 'IN_PROGRESS' ? '#FFFFFF' : '#64748B',
                      bgcolor: resumeStatus === 'IN_PROGRESS' ? '#0B1E3F' : '#FFFFFF',
                      borderColor: resumeStatus === 'IN_PROGRESS' ? '#0B1E3F' : '#E2E8F0',
                    }}
                  >
                    In Progress
                  </Button>
                  <Button
                    fullWidth
                    variant={resumeStatus === 'COMPLETED' ? 'contained' : 'outlined'}
                    onClick={() => {
                      setResumeStatus('COMPLETED');
                      setResumeProgress(100);
                    }}
                    sx={{
                      borderRadius: '12px',
                      py: 1.2,
                      fontWeight: 800,
                      textTransform: 'none',
                      color: resumeStatus === 'COMPLETED' ? '#FFFFFF' : '#64748B',
                      bgcolor: resumeStatus === 'COMPLETED' ? '#0B1E3F' : '#FFFFFF',
                      borderColor: resumeStatus === 'COMPLETED' ? '#0B1E3F' : '#E2E8F0',
                    }}
                  >
                    Completed
                  </Button>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 1 }}>Progress Percentage (0-100)</Typography>
                <TextField
                  fullWidth
                  type="number"
                  disabled={resumeStatus === 'COMPLETED'}
                  placeholder="e.g. 50"
                  value={resumeProgress}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                    setResumeProgress(val);
                  }}
                  slotProps={{
                    input: {
                      endAdornment: <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700 }}>%</Typography>,
                      sx: { borderRadius: '12px', fontWeight: 750 }
                    }
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Step 2: Coworkers (Optional) */}
        <Card sx={{ borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: 'none', mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: '#0B1E3F', color: '#FFFFFF', width: 28, height: 28, fontSize: '0.9rem', fontWeight: 700 }}>2</Avatar>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0B1E3F' }}>
                  Co-Workers <span style={{ color: '#64748B', fontWeight: 500, fontSize: '0.78rem' }}>(optional)</span>
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddCoworker}
                sx={{
                  borderRadius: '10px',
                  fontWeight: 750,
                  textTransform: 'none',
                  px: 2,
                  color: '#0B1E3F',
                  borderColor: '#CBD5E1',
                  '&:hover': { bgcolor: '#F8FAFC' },
                }}
              >
                Add Co-Worker
              </Button>
            </Box>

            {coworkers.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, fontStyle: 'italic', py: 1 }}>
                No coworkers logged. Click "Add Co-Worker" to include coworkers.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {coworkers.map((co, index) => (
                  <Grid size={{ xs: 12, md: 6 }} key={co.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#64748B', width: 20 }}>{index + 1}</Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={co.employeeId}
                        onChange={(e) => handleCoworkerSelect(co.id, e.target.value)}
                        displayEmpty
                        sx={{ borderRadius: '10px', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', fontWeight: 650 }}
                      >
                        <MenuItem value="" disabled>Select Co-Worker</MenuItem>
                        {users
                          .filter(u => u.userId !== employeeId && u.role !== 'Admin')
                          .map(u => (
                            <MenuItem key={u.userId} value={u.userId} sx={{ fontWeight: 600 }}>{u.userId} — {u.adminName}</MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                    {co.role && (
                      <Chip
                        label={co.role}
                        size="small"
                        sx={{ fontWeight: 800, fontSize: '0.75rem', bgcolor: '#EFF6FF', color: '#1E40AF', borderRadius: '6px' }}
                      />
                    )}
                    <IconButton onClick={() => handleDeleteCoworker(co.id)} sx={{ color: '#94A3B8', '&:hover': { color: '#EF4444' } }}>
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Remarks (Optional) */}
        <Card sx={{ borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: 'none', mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Avatar sx={{ bgcolor: '#0B1E3F', color: '#FFFFFF', width: 28, height: 28, fontSize: '0.9rem', fontWeight: 700 }}>3</Avatar>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0B1E3F' }}>Remarks / Idle Reasons</Typography>
            </Box>
            <Grid container spacing={1.2} sx={{ mb: 3 }}>
              {remarksTags.map((tag) => {
                const isSelected = selectedRemarks.includes(tag);
                return (
                  <Grid size="auto" key={tag}>
                    <Button
                      variant={isSelected ? 'contained' : 'outlined'}
                      onClick={() => handleToggleRemarksTag(tag)}
                      sx={{
                        borderRadius: '8px',
                        px: 2,
                        py: 0.85,
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        textTransform: 'none',
                        color: isSelected ? '#B45309' : '#475569',
                        bgcolor: isSelected ? '#FFFBEB' : '#FFFFFF',
                        borderColor: isSelected ? '#FBBF24' : '#E2E8F0',
                      }}
                    >
                      {tag}
                    </Button>
                  </Grid>
                );
              })}
            </Grid>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', mb: 1 }}>Additional Remarks</Typography>
            <TextField
              fullWidth multiline rows={3} placeholder="Add any additional session remarks here..."
              value={additionalRemarks} onChange={(e) => setAdditionalRemarks(e.target.value)}
              slotProps={{ input: { sx: { borderRadius: '12px', bgcolor: '#FFFFFF' } } }}
            />
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/dashboard')} disabled={submitting} sx={{ borderRadius: '12px', px: 4, py: 1.5, fontWeight: 700, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitResume}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} sx={{ color: '#FFFFFF' }} /> : <SendIcon />}
            sx={{
              borderRadius: '12px',
              bgcolor: '#0B1E3F',
              color: '#FFFFFF',
              px: 5,
              py: 1.8,
              fontWeight: 800,
              boxShadow: '0 4px 14px rgba(11, 30, 63, 0.25)',
              '&:hover': { bgcolor: '#173366' },
            }}
          >
            {submitting ? 'Updating...' : 'Submit Session Update'}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 6 }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: '12px', fontWeight: 650 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0B1E3F', letterSpacing: '-0.02em' }}>
          Submit Daily Work Report
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600, mt: 0.5 }}>
          Fill in the details below for each activity completed today. Productivity is calculated based on standard time per activity.
        </Typography>
      </Box>

      {/* Step 1: Basic Information */}
      <Card sx={{ borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: 'none', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Avatar sx={{ bgcolor: '#0B1E3F', color: '#FFFFFF', width: 28, height: 28, fontSize: '0.9rem', fontWeight: 700 }}>1</Avatar>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0B1E3F' }}>Basic Information</Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 1 }}>Employee ID</Typography>
              <TextField fullWidth disabled value={employeeId} slotProps={{ input: { sx: { borderRadius: '12px', fontWeight: 700, bgcolor: '#F8FAFC' } } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 1 }}>Employee Name</Typography>
              <TextField fullWidth disabled value={workerName} slotProps={{ input: { sx: { borderRadius: '12px', fontWeight: 700, bgcolor: '#F8FAFC' } } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 1 }}>Date</Typography>
              <TextField fullWidth disabled value={todayFormatted} slotProps={{ input: { sx: { borderRadius: '12px', fontWeight: 700, bgcolor: '#F8FAFC' } } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 1 }}>Work Type</Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                {['Work', 'Rework'].map((type) => {
                  const isActive = workType === type;
                  return (
                    <Button
                      key={type}
                      fullWidth
                      variant={isActive ? 'contained' : 'outlined'}
                      onClick={() => setWorkType(type as 'Work' | 'Rework')}
                      sx={{
                        borderRadius: '12px',
                        py: 1.2,
                        fontWeight: 800,
                        textTransform: 'none',
                        color: isActive ? '#FFFFFF' : '#64748B',
                        bgcolor: isActive ? '#0B1E3F' : '#FFFFFF',
                        borderColor: isActive ? '#0B1E3F' : '#E2E8F0',
                        boxShadow: isActive ? '0 4px 10px rgba(11, 30, 63, 0.15)' : 'none',
                        '&:hover': {
                          bgcolor: isActive ? '#173366' : '#F8FAFC',
                          borderColor: isActive ? '#173366' : '#CBD5E1',
                        },
                      }}
                    >
                      {type}
                    </Button>
                  );
                })}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Step 2: Sales Order / Serial Number */}
      <Card sx={{ borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: 'none', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Avatar sx={{ bgcolor: '#0B1E3F', color: '#FFFFFF', width: 28, height: 28, fontSize: '0.9rem', fontWeight: 700 }}>2</Avatar>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0B1E3F' }}>Sales Order / Serial Number</Typography>
          </Box>

          {salesOrders.length === 0 ? (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <CircularProgress size={24} sx={{ color: '#0B1E3F', mb: 1 }} />
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>Loading sales orders...</Typography>
            </Box>
          ) : (
            <>
              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                {salesOrders.map((so) => {
                  const isSelected = selectedSONumber === so.soNumber;
                  return (
                    <Grid size="auto" key={so.id || so.soNumber}>
                      <Tooltip title={so.customerName || so.projectName || ''} placement="top" arrow>
                        <Button
                          variant={isSelected ? 'contained' : 'outlined'}
                          onClick={() => setSelectedSONumber(so.soNumber)}
                          sx={{
                            borderRadius: '8px',
                            px: 2.2,
                            py: 1,
                            fontWeight: 700,
                            textTransform: 'none',
                            color: isSelected ? '#FFFFFF' : '#1E293B',
                            bgcolor: isSelected ? '#0B1E3F' : '#FFFFFF',
                            borderColor: isSelected ? '#0B1E3F' : '#E2E8F0',
                            '&:hover': {
                              bgcolor: isSelected ? '#173366' : '#F8FAFC',
                            },
                          }}
                        >
                          {so.soNumber}
                        </Button>
                      </Tooltip>
                    </Grid>
                  );
                })}
              </Grid>

              {selectedSONumber ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 800 }}>
                    ✓ Selected: {selectedSONumber}
                  </Typography>
                  {salesOrders.find(s => s.soNumber === selectedSONumber)?.customerName && (
                    <Chip
                      label={salesOrders.find(s => s.soNumber === selectedSONumber)?.customerName}
                      size="small"
                      sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, fontSize: '0.72rem' }}
                    />
                  )}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 600, fontStyle: 'italic' }}>
                  No sales order selected. Click one above.
                </Typography>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Departments & Activities */}
      <Card sx={{ borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: 'none', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: '#0B1E3F', color: '#FFFFFF', width: 28, height: 28, fontSize: '0.9rem', fontWeight: 700 }}>3</Avatar>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0B1E3F' }}>Departments & Activities</Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddDeptEntry}
              sx={{
                borderRadius: '10px',
                fontWeight: 750,
                textTransform: 'none',
                px: 2,
                color: '#0B1E3F',
                borderColor: '#CBD5E1',
                '&:hover': {
                  bgcolor: '#F8FAFC',
                  borderColor: '#94A3B8',
                },
              }}
            >
              Add Department
            </Button>
          </Box>

          {departments.length === 0 ? (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <CircularProgress size={24} sx={{ color: '#0B1E3F', mb: 1 }} />
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>Loading departments...</Typography>
            </Box>
          ) : (
            deptEntries.map((entry, index) => {
              const selectedDeptObj = departments.find(d => d.id === entry.departmentId);
              const deptActivities = selectedDeptObj?.activities || [];

              return (
                <Box
                  key={entry.id}
                  sx={{
                    mb: 3,
                    p: 3,
                    borderRadius: '16px',
                    border: '1px dashed #E2E8F0',
                    bgcolor: '#F8FAFC',
                    position: 'relative',
                  }}
                >
                  <IconButton
                    onClick={() => handleDeleteDeptEntry(entry.id)}
                    sx={{ position: 'absolute', top: 12, right: 12, color: '#64748B', '&:hover': { color: '#EF4444' } }}
                  >
                    <DeleteIcon />
                  </IconButton>

                  <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 850, display: 'block', mb: 2 }}>
                    DEPARTMENT ENTRY #{index + 1}
                  </Typography>

                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', mb: 1 }}>Department</Typography>
                      <FormControl fullWidth size="medium">
                        <Select
                          value={entry.departmentId}
                          onChange={(e) => handleDeptSelectChange(entry.id, e.target.value)}
                          displayEmpty
                          sx={{
                            borderRadius: '12px',
                            bgcolor: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            fontWeight: 650,
                            color: entry.departmentId ? '#0F172A' : '#94A3B8',
                            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                          }}
                        >
                          <MenuItem value="" disabled sx={{ fontWeight: 600 }}>Select Department</MenuItem>
                          {departments.map((dept) => (
                            <MenuItem key={dept.id} value={dept.id} sx={{ fontWeight: 600 }}>{dept.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  {entry.departmentId && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', mb: 1.5 }}>
                        Activities <span style={{ fontWeight: 500, color: '#64748B', fontSize: '0.78rem' }}>(select all that apply)</span>
                      </Typography>
                      {deptActivities.length === 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                          <InfoIcon sx={{ fontSize: 16, color: '#94A3B8' }} />
                          <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 600, fontStyle: 'italic' }}>
                            No activities configured for this department.
                          </Typography>
                        </Box>
                      ) : (
                        <Grid container spacing={1}>
                          {deptActivities.map((act) => {
                            const isActSelected = entry.selectedActivities.some(a => a.activityId === act.id);
                            return (
                              <Grid size="auto" key={act.id}>
                                <Tooltip title={`Standard: ${act.standardMinutes} min`} placement="top" arrow>
                                  <Button
                                    variant={isActSelected ? 'contained' : 'outlined'}
                                    onClick={() => handleToggleActivity(entry.id, act.id, act.name, act.standardMinutes)}
                                    startIcon={isActSelected && <CheckIcon sx={{ fontSize: 16 }} />}
                                    sx={{
                                      borderRadius: '30px',
                                      px: 2,
                                      py: 0.75,
                                      fontWeight: 700,
                                      fontSize: '0.8rem',
                                      textTransform: 'none',
                                      color: isActSelected ? '#FFFFFF' : '#1E293B',
                                      bgcolor: isActSelected ? '#0B1E3F' : '#FFFFFF',
                                      borderColor: isActSelected ? '#0B1E3F' : '#E2E8F0',
                                      '&:hover': {
                                        bgcolor: isActSelected ? '#173366' : '#FFFFFF',
                                      },
                                    }}
                                  >
                                    {act.name}
                                  </Button>
                                </Tooltip>
                              </Grid>
                            );
                          })}
                        </Grid>
                      )}
                    </Box>
                  )}

                  {entry.selectedActivities.length > 0 && (
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', mb: 2 }}>Duration (minutes) per activity:</Typography>
                      <Grid container spacing={2}>
                        {entry.selectedActivities.map((act) => {
                          const actual = parseInt(act.duration) || 0;
                          const actProductivity = actual > 0 && act.standardMinutes > 0
                            ? Math.round((act.standardMinutes / actual) * 100)
                            : null;
                          return (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={act.activityId}>
                              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.8 }}>{act.activityName}</Typography>
                              <TextField
                                fullWidth
                                size="small"
                                placeholder="e.g. 90"
                                value={act.duration}
                                onChange={(e) => handleDurationChange(entry.id, act.activityId, e.target.value)}
                                slotProps={{
                                  input: {
                                    endAdornment: <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700 }}>min</Typography>,
                                    sx: { borderRadius: '10px', bgcolor: '#FFFFFF', fontWeight: 750 },
                                  }
                                }}
                              />
                              
                              {/* Status Select */}
                              <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                                <Select
                                  value={act.status || 'COMPLETED'}
                                  onChange={(e) => handleStatusChange(entry.id, act.activityId, e.target.value as any)}
                                  sx={{
                                    borderRadius: '10px',
                                    bgcolor: '#FFFFFF',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    '& .MuiSelect-select': { py: 0.8 }
                                  }}
                                >
                                  <MenuItem value="COMPLETED" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Completed</MenuItem>
                                  <MenuItem value="IN_PROGRESS" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>In Progress</MenuItem>
                                </Select>
                              </FormControl>

                              {/* Progress Percentage */}
                              {act.status === 'IN_PROGRESS' && (
                                <TextField
                                  fullWidth
                                  size="small"
                                  type="number"
                                  placeholder="Progress %"
                                  value={act.progressPercentage !== undefined ? act.progressPercentage : 0}
                                  onChange={(e) => handleProgressChange(entry.id, act.activityId, e.target.value)}
                                  slotProps={{
                                    input: {
                                      endAdornment: <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700 }}>%</Typography>,
                                      sx: { borderRadius: '10px', bgcolor: '#FFFFFF', fontWeight: 750 },
                                    }
                                  }}
                                  sx={{ mt: 1 }}
                                />
                              )}

                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                                  Standard: {act.standardMinutes} min
                                </Typography>
                                {actProductivity !== null && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontWeight: 800,
                                      color: act.status === 'IN_PROGRESS' ? '#10B981' : (actProductivity >= 85 ? '#10B981' : actProductivity >= 70 ? '#F59E0B' : '#EF4444'),
                                    }}
                                  >
                                    {act.status === 'IN_PROGRESS' ? '100% prod' : `${actProductivity}% prod`}
                                  </Typography>
                                )}
                              </Box>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Box>
                  )}
                </Box>
              );
            })
          )}

          {calculations.totalActMinutes > 0 && (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: '12px',
                bgcolor: '#F1F5F9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1.5,
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  Total Work Time:{' '}
                  <span style={{ color: '#0B1E3F', fontSize: '1rem', marginLeft: '4px' }}>{calculations.timeFormatted}</span>
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Standard time: {calculations.totalStdMinutes} min
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendIcon sx={{ fontSize: 18, color: badgeStyles.color }} />
                <Chip
                  label={`${calculations.productivityPct}% Productivity`}
                  sx={{
                    bgcolor: badgeStyles.bg,
                    color: badgeStyles.color,
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    borderRadius: '8px',
                    py: 1.8,
                    px: 1,
                  }}
                />
              </Box>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Step 4: Coworkers */}
      <Card sx={{ borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: 'none', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: '#0B1E3F', color: '#FFFFFF', width: 28, height: 28, fontSize: '0.9rem', fontWeight: 700 }}>4</Avatar>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0B1E3F' }}>
                Co-Workers <span style={{ color: '#64748B', fontWeight: 500, fontSize: '0.78rem' }}>(optional)</span>
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddCoworker}
              sx={{
                borderRadius: '10px',
                fontWeight: 750,
                textTransform: 'none',
                px: 2,
                color: '#0B1E3F',
                borderColor: '#CBD5E1',
                '&:hover': { bgcolor: '#F8FAFC' },
              }}
            >
              Add Co-Worker
            </Button>
          </Box>

          {coworkers.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, fontStyle: 'italic', py: 1 }}>
              No coworkers logged. Click "Add Co-Worker" to include coworkers.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {coworkers.map((co, index) => (
                <Grid size={{ xs: 12, md: 6 }} key={co.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#64748B', width: 20 }}>{index + 1}</Typography>

                  <FormControl fullWidth size="small">
                    <Select
                      value={co.employeeId}
                      onChange={(e) => handleCoworkerSelect(co.id, e.target.value)}
                      displayEmpty
                      sx={{
                        borderRadius: '10px',
                        bgcolor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        fontWeight: 650,
                      }}
                    >
                      <MenuItem value="" disabled>Select Co-Worker</MenuItem>
                      {users
                        .filter(u => u.userId !== employeeId && u.role !== 'Admin')
                        .map(u => (
                          <MenuItem key={u.userId} value={u.userId} sx={{ fontWeight: 600 }}>{u.userId} — {u.adminName}</MenuItem>
                        ))}
                    </Select>
                  </FormControl>

                  {co.role && (
                    <Chip
                      label={co.role}
                      size="small"
                      icon={co.role.toLowerCase() === 'trainee' ? <WarningIcon sx={{ fontSize: '12px !important' }} /> : undefined}
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        bgcolor: co.role.toLowerCase() === 'trainee' ? '#FFFBEB' : '#EFF6FF',
                        color: co.role.toLowerCase() === 'trainee' ? '#B45309' : '#1E40AF',
                        border: '1px solid',
                        borderColor: co.role.toLowerCase() === 'trainee' ? '#FDE68A' : '#BFDBFE',
                        borderRadius: '6px',
                        height: 24,
                      }}
                    />
                  )}

                  <IconButton onClick={() => handleDeleteCoworker(co.id)} sx={{ color: '#94A3B8', '&:hover': { color: '#EF4444' } }}>
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Step 5: Remarks */}
      <Card sx={{ borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: 'none', mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Avatar sx={{ bgcolor: '#0B1E3F', color: '#FFFFFF', width: 28, height: 28, fontSize: '0.9rem', fontWeight: 700 }}>5</Avatar>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0B1E3F' }}>
              Remarks / Idle Reasons <span style={{ color: '#64748B', fontWeight: 500, fontSize: '0.78rem' }}>(optional)</span>
            </Typography>
          </Box>

          <Grid container spacing={1.2} sx={{ mb: 3 }}>
            {remarksTags.map((tag) => {
              const isSelected = selectedRemarks.includes(tag);
              return (
                <Grid size="auto" key={tag}>
                  <Button
                    variant={isSelected ? 'contained' : 'outlined'}
                    onClick={() => handleToggleRemarksTag(tag)}
                    startIcon={isSelected && <CheckIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      borderRadius: '8px',
                      px: 2,
                      py: 0.85,
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      textTransform: 'none',
                      color: isSelected ? '#B45309' : '#475569',
                      bgcolor: isSelected ? '#FFFBEB' : '#FFFFFF',
                      borderColor: isSelected ? '#FBBF24' : '#E2E8F0',
                      '&:hover': {
                        bgcolor: isSelected ? '#FFF9E6' : '#F8FAFC',
                        borderColor: isSelected ? '#F59E0B' : '#CBD5E1',
                      },
                    }}
                  >
                    {tag}
                  </Button>
                </Grid>
              );
            })}
          </Grid>

          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', mb: 1 }}>Additional Remarks (optional)</Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Add any additional remarks, observations, or reasons for delay..."
            value={additionalRemarks}
            onChange={(e) => setAdditionalRemarks(e.target.value)}
            slotProps={{
              input: { sx: { borderRadius: '12px', bgcolor: '#FFFFFF' } }
            }}
          />
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/dashboard')}
          disabled={submitting}
          sx={{
            borderRadius: '12px',
            px: 4,
            py: 1.5,
            fontWeight: 700,
            textTransform: 'none',
            borderColor: '#E2E8F0',
            color: '#64748B',
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmitReport}
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={18} sx={{ color: '#FFFFFF' }} /> : <SendIcon />}
          sx={{
            borderRadius: '12px',
            bgcolor: '#0B1E3F',
            color: '#FFFFFF',
            px: 5,
            py: 1.8,
            fontWeight: 800,
            fontSize: '1rem',
            textTransform: 'none',
            boxShadow: '0 4px 14px rgba(11, 30, 63, 0.25)',
            '&:hover': { bgcolor: '#173366' },
            '&:disabled': { bgcolor: '#94A3B8' },
          }}
        >
          {submitting ? 'Submitting...' : 'Submit Daily Work Report'}
        </Button>
      </Box>
    </Box>
  );
};
