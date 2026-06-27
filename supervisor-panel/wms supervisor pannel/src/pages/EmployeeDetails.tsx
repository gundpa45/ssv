import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Avatar,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Assignment as ActivitiesIcon,
  AccessTime as HoursIcon,
  TrendingUp as ProductivityIcon,
  BuildCircleOutlined as ReworkIcon,
  CheckCircle as ApprovalRateIcon,
  Person as UserIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
} from 'recharts';

export const EmployeeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { users, activityLogs } = useApp();

  const [activeTab, setActiveTab] = useState(0);

  const employee = useMemo(() => {
    return users.find(u => u.employeeId === id);
  }, [users, id]);

  const logs = useMemo(() => {
    return activityLogs
      .filter(l => l.userId === id)
      .sort((a, b) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime());
  }, [activityLogs, id]);

  const reworkLogs = useMemo(() => {
    return logs.filter(l => l.status === 'Rework' || l.reworkReason);
  }, [logs]);

  // Aggregate SO contribution
  const soContributions = useMemo(() => {
    const map: Record<string, { soNumber: string; count: number; mins: number; prodSum: number; approvedCount: number }> = {};
    logs.forEach(l => {
      if (!map[l.soNumber]) {
        map[l.soNumber] = { soNumber: l.soNumber, count: 0, mins: 0, prodSum: 0, approvedCount: 0 };
      }
      const data = map[l.soNumber]!;
      data.count += 1;
      data.mins += l.durationMinutes;
      if (l.status === 'Approved') {
        data.approvedCount += 1;
        const ratio = l.standardManMinutes > 0 ? (l.standardManMinutes / l.durationMinutes) * 100 : 100;
        data.prodSum += Math.min(150, ratio);
      }
    });

    const totalMins = logs.reduce((sum, l) => sum + l.durationMinutes, 0) || 1;

    return Object.values(map).map(item => ({
      soNumber: item.soNumber,
      activities: item.count,
      hours: Math.round((item.mins / 60) * 10) / 10,
      contributionPercent: Math.round((item.mins / totalMins) * 100),
      productivity: item.approvedCount > 0 ? Math.round(item.prodSum / item.approvedCount) : 100,
    }));
  }, [logs]);

  // Productivity Trend data (latest 10 approved activities over time)
  const chartData = useMemo(() => {
    return [...logs]
      .filter(l => l.status === 'Approved')
      .slice(0, 15)
      .reverse()
      .map((l, index) => {
        const ratio = l.standardManMinutes > 0 ? (l.standardManMinutes / l.durationMinutes) * 100 : 100;
        return {
          name: l.activityDate.slice(5), // MM-DD
          Productivity: Math.round(Math.min(150, ratio)),
          Activity: l.activity.slice(0, 12) + '...',
        };
      });
  }, [logs]);

  if (!employee) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Employee Records Not Found
        </Typography>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/monitoring')}>
          Back to Workforce list
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/monitoring')}
          sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: 'none', mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
          Employee details: {employee.name}
        </Typography>
      </Box>

      {/* Row 1: Profile Summary & KPI Tiles */}
      <Grid container spacing={3.5} sx={{ mb: 4 }}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3.5, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  width: 80,
                  height: 80,
                  mb: 2,
                  fontSize: '2rem',
                  fontWeight: 800,
                  boxShadow: '0 8px 24px rgba(37, 99, 235, 0.2)',
                }}
              >
                {employee.name.split(' ').map(n => n[0]).join('')}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {employee.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 2 }}>
                {employee.role} • {employee.department}
              </Typography>
              <Chip label={employee.status} color={employee.status === 'Working' ? 'success' : 'warning'} sx={{ fontWeight: 700, borderRadius: 1.5, mb: 3 }} />

              <Divider sx={{ width: '100%', mb: 2 }} />

              <Box sx={{ width: '100%', textAlign: 'left' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                  EMPLOYEE ID
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, fontFamily: 'monospace' }}>
                  {employee.employeeId}
                </Typography>

                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                  CONTACT EMAIL
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                  {employee.email}
                </Typography>

                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                  MOBILE PHONE
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                  {employee.mobile}
                </Typography>

                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                  JOINED FACTORY
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {employee.joinedDate}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Dynamic Tiles Grid */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2.5} sx={{ height: '100%' }}>
            {[
              { title: 'Total Activities', value: employee.activitiesCount, icon: <ActivitiesIcon />, color: '#3B82F6', desc: 'Registered submissions' },
              { title: 'Hours winded', value: `${employee.hoursWorked} hrs`, icon: <HoursIcon />, color: '#10B981', desc: 'Effective actual duration' },
              { title: 'Windings Productivity', value: `${employee.productivity}%`, icon: <ProductivityIcon />, color: '#F59E0B', desc: 'Average performance' },
              { title: 'Finalized Reworks', value: employee.reworkCount, icon: <ReworkIcon />, color: '#8B5CF6', desc: 'Required corrections' },
              { title: 'Submission approval rate', value: `${employee.approvalRate}%`, icon: <ApprovalRateIcon />, color: '#06B6D4', desc: 'Acceptance index ratio' },
            ].map((stat, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {stat.title}
                      </Typography>
                      <Avatar sx={{ bgcolor: `${stat.color}15`, color: stat.color, width: 38, height: 38 }}>
                        {stat.icon}
                      </Avatar>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {stat.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      {/* Row 2: Performance Details Tabs Section */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label={`Activity Logs (${logs.length})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
          <Tab label={`SO Contributions (${soContributions.length})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
          <Tab label={`Rework Records (${reworkLogs.length})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
          <Tab label="Productivity Trend Charts" sx={{ fontWeight: 700, textTransform: 'none' }} />
        </Tabs>
      </Box>

      {/* Tab Contents */}

      {/* 1. Activity Logs Tab */}
      {activeTab === 0 && (
        <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>SO Number</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Activity</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Logged Time</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Std Time</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Auditor</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      No activity logs found for this employee.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((item) => {
                    return (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{item.activityDate}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.soNumber}</TableCell>
                        <TableCell>{item.activity}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{item.durationMinutes}m</TableCell>
                        <TableCell align="right">{item.standardManMinutes}m</TableCell>
                        <TableCell>
                          <Chip
                            label={item.status}
                            size="small"
                            color={item.status === 'Approved' ? 'success' : (item.status === 'Rejected' ? 'error' : (item.status === 'Rework' ? 'secondary' : 'warning'))}
                            sx={{ fontWeight: 700, borderRadius: 1 }}
                          />
                        </TableCell>
                        <TableCell>{item.reviewedBy || 'Unassigned'}</TableCell>
                        <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.remarks || item.reworkReason || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* 2. SO Contributions Tab */}
      {activeTab === 1 && (
        <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Sales Order Number</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Activities</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Logged Hours</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Windings Contribution %</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Productivity index</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {soContributions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      No Sales Order contributions recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  soContributions.map((item, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{item.soNumber}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{item.activities}</TableCell>
                      <TableCell align="right">{item.hours} hrs</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{item.contributionPercent}%</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: item.productivity > 90 ? 'success.main' : 'text.primary' }}>
                        {item.productivity}%
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* 3. Rework Records Tab */}
      {activeTab === 2 && (
        <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Sales Order</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Activity</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Assigned Defect</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Expected Correction</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Verified By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reworkLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      🎉 Excellent! No reworks logged for this employee.
                    </TableCell>
                  </TableRow>
                ) : (
                  reworkLogs.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{item.activityDate}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{item.soNumber}</TableCell>
                      <TableCell>{item.activity}</TableCell>
                      <TableCell sx={{ color: 'error.main', fontWeight: 600 }}>{item.reworkReason || 'Check Failed'}</TableCell>
                      <TableCell>{item.expectedCorrection || 'Repair winding thickness.'}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.reworkPriority || 'Medium'}
                          size="small"
                          color={item.reworkPriority === 'High' ? 'error' : (item.reworkPriority === 'Medium' ? 'warning' : 'info')}
                          sx={{ fontWeight: 700, borderRadius: 1 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{item.reworkDueDate || '-'}</TableCell>
                      <TableCell>{item.reviewedBy}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* 4. Productivity Charts Tab */}
      {activeTab === 3 && (
        <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3 }}>
              Chronological Productivity Index (Latest 15 Audited Submissions)
            </Typography>
            {chartData.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No verified metrics to display. Verify pending activities first.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: 11, fontWeight: 600 }} />
                    <YAxis domain={[50, 150]} stroke="#6B7280" style={{ fontSize: 11, fontWeight: 600 }} label={{ value: 'Productivity (%)', angle: -90, position: 'insideLeft', offset: 10, style: { fontWeight: 700 } }} />
                    <ChartTooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid rgba(37,99,235,0.2)',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Productivity"
                      stroke="url(#blueGradient)"
                      strokeWidth={3}
                      dot={{ r: 5, strokeWidth: 2, fill: '#ffffff' }}
                      activeDot={{ r: 7 }}
                    />
                    <defs>
                      <linearGradient id="blueGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#2563EB" />
                        <stop offset="100%" stopColor="#06B6D4" />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
export default EmployeeDetails;
