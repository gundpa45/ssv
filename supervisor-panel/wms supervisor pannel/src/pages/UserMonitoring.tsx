import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  MenuItem,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  TablePagination,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
  Assessment as ReportIcon,
  People as TotalWorkersIcon,
  PlayArrow as ActiveWorkersIcon,
  CheckCircle as ApprovedIcon,
  TrendingDown as IdleIcon,
  Warning as AlertIcon,
  Star as StarIcon,
} from '@mui/icons-material';

export const UserMonitoring: React.FC = () => {
  const { users, activityLogs, dashboardKPIs } = useApp();
  const navigate = useNavigate();

  // --- Filter States ---
  const [nameSearch, setNameSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [prodRangeFilter, setProdRangeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const uniqueDepts = useMemo(() => {
    return Array.from(new Set(users.filter(u => u.role !== 'Supervisor').map(u => u.department))).sort();
  }, [users]);

  const handleClearFilters = () => {
    setNameSearch('');
    setDeptFilter('');
    setProdRangeFilter('');
    setStatusFilter('');
    setPage(0);
  };

  // --- Simulated Server-Side Filter implementation ---
  const filteredUsers = useMemo(() => {
    return users.filter(w => {
      // Exclude supervisors from workforce list
      if (w.role === 'Supervisor') return false;

      // Name / ID search
      if (nameSearch) {
        const query = nameSearch.toLowerCase();
        const matchesName = w.name.toLowerCase().includes(query) || w.employeeId.toLowerCase().includes(query);
        if (!matchesName) return false;
      }

      // Department filter
      if (deptFilter && w.department !== deptFilter) {
        return false;
      }

      // Status filter
      if (statusFilter && w.status !== statusFilter) {
        return false;
      }

      // Productivity range filter
      if (prodRangeFilter) {
        if (prodRangeFilter === 'low' && w.productivity >= 70) return false;
        if (prodRangeFilter === 'med' && (w.productivity < 70 || w.productivity > 85)) return false;
        if (prodRangeFilter === 'high' && w.productivity <= 85) return false;
      }

      return true;
    });
  }, [users, nameSearch, deptFilter, prodRangeFilter, statusFilter]);

  const paginatedUsers = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, page, rowsPerPage]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Helper to obtain the last logged activity description
  const getLastActivity = (employeeId: string) => {
    const employeeLogs = activityLogs.filter(l => l.userId === employeeId);
    if (employeeLogs.length === 0) return 'No activity logged today.';
    
    // Sort by time
    const sorted = [...employeeLogs].sort((a, b) => {
      return new Date(b.reviewedAt || b.timeline[0]?.timestamp || 0).getTime() - new Date(a.reviewedAt || a.timeline[0]?.timestamp || 0).getTime();
    });
    
    const latest = sorted[0]!;
    return `${latest.activity} (${latest.soNumber}) • ${latest.status}`;
  };

  const getPerformanceBadge = (productivity: number) => {
    if (productivity > 95) {
      return (
        <Chip
          label="Top Performer"
          size="small"
          color="success"
          icon={<StarIcon sx={{ fontSize: '14px !important' }} />}
          sx={{ fontWeight: 800, borderRadius: 1.5 }}
        />
      );
    }
    if (productivity < 70) {
      return (
        <Chip
          label="Needs Attention"
          size="small"
          color="error"
          icon={<AlertIcon sx={{ fontSize: '14px !important' }} />}
          sx={{ fontWeight: 800, borderRadius: 1.5 }}
        />
      );
    }
    return (
      <Chip
        label="Steady"
        size="small"
        color="primary"
        variant="outlined"
        sx={{ fontWeight: 700, borderRadius: 1.5 }}
      />
    );
  };

  const getStatusChip = (status: string) => {
    const colors: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
      Working: 'success',
      Idle: 'warning',
      Away: 'info',
      Active: 'success',
      Inactive: 'error',
    };
    return (
      <Chip
        label={status}
        size="small"
        color={colors[status] || 'info'}
        sx={{ fontWeight: 700, borderRadius: 1.5 }}
      />
    );
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5 }}>
          Workforce Monitoring Telemetry
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          Real-time check on factory floor execution, worker activity counts, and live productivity scoreboards.
        </Typography>
      </Box>

      {/* KPI Row */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {[
          { title: 'Total Workforce', value: users.filter(u => u.role !== 'Supervisor').length, icon: <TotalWorkersIcon />, color: '#2563EB', desc: 'Registered operators' },
          { title: 'Active Right Now', value: dashboardKPIs.activeWorkers, icon: <ActiveWorkersIcon />, color: '#10B981', desc: 'Logged logs today' },
          { title: 'Average Team Productivity', value: `${dashboardKPIs.averageProductivity}%`, icon: <ApprovedIcon />, color: '#F59E0B', desc: 'Ratio standard to actual' },
          { title: 'Low Performance Alerts', value: users.filter(u => u.role !== 'Supervisor' && u.productivity < 70).length, icon: <AlertIcon />, color: '#EF4444', desc: 'Productivity < 70%' },
        ].map((kpi, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                    {kpi.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                    {kpi.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {kpi.desc}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: `${kpi.color}15`, color: kpi.color, width: 48, height: 48 }}>
                  {kpi.icon}
                </Avatar>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters Card */}
      <Card sx={{ mb: 4, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Worker Name or ID"
                placeholder="Search..."
                value={nameSearch}
                onChange={e => setNameSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Department"
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
              >
                <MenuItem value="">All Departments</MenuItem>
                {uniqueDepts.map(dept => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Productivity Profile"
                value={prodRangeFilter}
                onChange={e => setProdRangeFilter(e.target.value)}
              >
                <MenuItem value="">All Scores</MenuItem>
                <MenuItem value="low">Underperformer (&lt;70%)</MenuItem>
                <MenuItem value="med">Steady (70% - 85%)</MenuItem>
                <MenuItem value="high">High Performers (&gt;85%)</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Shift Status"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="Working">Working</MenuItem>
                <MenuItem value="Idle">Idle</MenuItem>
                <MenuItem value="Away">Away</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <TableContainer>
          <Table sx={{ minWidth: 800 }} size="medium" stickyHeader>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Employee Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Employee ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Activities</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Reworks</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Hours Worked</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Productivity</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Performance</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Last logged activity</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Shift Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 8 }}>
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                      No workers found matching selected parameters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map(worker => {
                  return (
                    <TableRow key={worker.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 600 }}>{worker.name}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{worker.employeeId}</TableCell>
                      <TableCell>{worker.department}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{worker.activitiesCount}</TableCell>
                      <TableCell align="right" color="error.main" sx={{ fontWeight: 600 }}>{worker.reworkCount}</TableCell>
                      <TableCell align="right">{worker.hoursWorked} hrs</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: worker.productivity > 85 ? 'success.main' : (worker.productivity < 70 ? 'error.main' : 'text.primary') }}>
                        {worker.productivity}%
                      </TableCell>
                      <TableCell>{getPerformanceBadge(worker.productivity)}</TableCell>
                      <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                        {getLastActivity(worker.employeeId)}
                      </TableCell>
                      <TableCell>{getStatusChip(worker.status)}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Tooltip title="View Detailed Employee Performance">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/employee/${worker.employeeId}`)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Open Performance Reports">
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={() => navigate('/reports', { state: { selectedEmpId: worker.employeeId } })}
                            >
                              <ReportIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[50, 100, 200]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      </Card>
    </Box>
  );
};
export default UserMonitoring;
