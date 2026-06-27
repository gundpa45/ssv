import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
} from '@mui/material';
import {
  AccessTime as ClockIcon,
} from '@mui/icons-material';

export const SubmissionHistory: React.FC = () => {
  const { user, activityLogs } = useApp();

  const workerName = user?.name || 'Deepak Gupta';

  const workerLogs = useMemo(() => {
    return activityLogs.map((log: any) => {
      const employeeId = log.user?.employeeId || log.userId || '';
      const wName = log.workerName || `${log.user?.firstName || ''} ${log.user?.lastName || ''}`.trim();

      if (employeeId !== user?.userId && log.userId !== user?.id && wName !== workerName) {
        return null;
      }

      const soNumber = log.SalesOrder?.soNumber || log.soNumber || log.soId || 'S-TRF-2401';
      const departmentName = log.department?.name || log.department || 'Dispatch';
      const activityName = log.activity?.activityName || log.activity || 'Task';
      const standardManMinutes = log.activity?.standardManMinutes || log.standardManMinutes || 200;
      const durationMinutes = log.durationMinutes || 0;
      
      const rawDate = log.createdAt || log.activityDate || new Date().toISOString();
      const formattedDate = new Date(rawDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      return {
        id: log.id,
        soNumber,
        department: departmentName,
        activity: activityName,
        date: formattedDate,
        standardMinutes: standardManMinutes,
        actualMinutes: durationMinutes,
        status: log.status || 'PENDING',
      };
    }).filter(Boolean);
  }, [activityLogs, user, workerName]);

  const getStatusStyle = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'APPROVED' || s === 'COMPLETED') {
      return { label: 'Approved', bg: 'rgba(16, 185, 129, 0.12)', color: '#10B981', border: 'rgba(16, 185, 129, 0.2)' };
    }
    if (s === 'REWORK_ASSIGNED' || s === 'REWORK') {
      return { label: 'Rework', bg: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', border: 'rgba(239, 68, 68, 0.2)' };
    }
    return { label: 'Pending', bg: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', border: 'rgba(245, 158, 11, 0.2)' };
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0B1E3F', letterSpacing: '-0.02em', mb: 0.5 }}>
          Submission History
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
          All your submitted work reports. Click any entry to view full details.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
        <CardContent sx={{ p: workerLogs.length === 0 ? 6 : 3 }}>
          {workerLogs.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
              <Avatar sx={{ bgcolor: '#F8FAFC', width: 80, height: 80, mb: 3, border: '1.5px solid #E2E8F0' }}>
                <ClockIcon sx={{ fontSize: 44, color: '#94A3B8' }} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#475569', mb: 0.5 }}>
                No submissions yet
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                Your submitted reports will appear here.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: 'none' }}>
              <Table size="medium">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    {['S Number / Serial', 'Department', 'Activity Logged', 'Date Submitted', 'Actual Duration', 'Productivity', 'Approval Status'].map((header) => (
                      <TableCell key={header} sx={{ fontWeight: 800, color: '#0B1E3F', fontSize: '0.8rem', py: 2 }}>
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {workerLogs.map((log: any) => {
                    const statusStyle = getStatusStyle(log.status);
                    // Productivity = (Standard / Actual) × 100: faster = better
                    const productivityScore = log.standardMinutes && log.actualMinutes
                      ? Math.round((log.standardMinutes / log.actualMinutes) * 100)
                      : 100;

                    return (
                      <TableRow key={log.id} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                        <TableCell sx={{ fontWeight: 800, color: '#2563EB', fontFamily: 'monospace', fontSize: '0.88rem' }}>
                          {log.soNumber}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#1E293B' }}>
                          {log.department}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#475569' }}>
                          {log.activity}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 650, color: '#64748B' }}>
                          {log.date}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 750, color: '#1E293B' }}>
                          {log.actualMinutes} min
                        </TableCell>
                        <TableCell sx={{ fontWeight: 850, color: productivityScore >= 85 ? '#10B981' : '#EF4444' }}>
                          {productivityScore}%
                        </TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                          <Chip
                            label={statusStyle.label}
                            size="small"
                            sx={{
                              bgcolor: statusStyle.bg,
                              color: statusStyle.color,
                              border: `1px solid ${statusStyle.border}`,
                              fontWeight: 850,
                              fontSize: '0.75rem',
                              borderRadius: '6px',
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
