import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Tabs,
  Tab,
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
  TextField,
  MenuItem,
  Grid,
  Checkbox,
  Tooltip,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  PlayArrow as ReviewIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  Lock as LockIcon,
} from '@mui/icons-material';

export const WorkVerification: React.FC = () => {
  const { activityLogs, user, checkoutActivityForReview, bulkVerifyActivities } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // --- Filter States ---
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [soFilter, setSoFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [activityFilter, setActivityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Tab State: Pending, Under Review, Approved, Rejected, Rework, All (init from navigation index)
  const [activeTab, setActiveTab] = useState(() => {
    const locState = location.state as { tabIndex?: number } | null;
    return locState && typeof locState.tabIndex === 'number' ? locState.tabIndex : 0;
  });

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50); // Standard 50 records per page

  // Multi-Select Checkbox States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'Approve' | 'Reject'>('Approve');
  const [bulkRemarks, setBulkRemarks] = useState('');

  const tabStatuses = ['Pending', 'Under Review', 'Approved', 'Rejected', 'Rework', 'All'];

  // --- Dynamic Option Lists ---
  const uniqueSOs = useMemo(() => {
    return Array.from(new Set(activityLogs.map(l => l.soNumber))).sort();
  }, [activityLogs]);

  const uniqueDepts = useMemo(() => {
    return Array.from(new Set(activityLogs.map(l => l.department))).sort();
  }, [activityLogs]);

  const uniqueActivities = useMemo(() => {
    return Array.from(new Set(activityLogs.map(l => l.activity))).sort();
  }, [activityLogs]);

  // --- Clear All Filters ---
  const handleClearFilters = () => {
    setEmployeeSearch('');
    setSoFilter('');
    setDeptFilter('');
    setActivityFilter('');
    setDateFilter('');
    setPriorityFilter('');
    setSearchQuery('');
    setPage(0);
  };

  // --- Tab Switcher ---
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setPage(0);
    setSelectedIds([]);
  };

  // --- Filter and Search Processing (Simulated Server-Side execution) ---
  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      // 1. Tab Status Filter
      const targetStatus = tabStatuses[activeTab];
      if (targetStatus !== 'All' && log.status !== targetStatus) {
        return false;
      }

      // 2. Employee search
      if (employeeSearch && !log.workerName.toLowerCase().includes(employeeSearch.toLowerCase())) {
        return false;
      }

      // 3. Sales Order filter
      if (soFilter && log.soNumber !== soFilter) {
        return false;
      }

      // 4. Department filter
      if (deptFilter && log.department !== deptFilter) {
        return false;
      }

      // 5. Activity filter
      if (activityFilter && log.activity !== activityFilter) {
        return false;
      }

      // 6. Date filter
      if (dateFilter && log.activityDate !== dateFilter) {
        return false;
      }

      // 7. Priority filter
      if (priorityFilter && log.reworkPriority !== priorityFilter) {
        return false;
      }

      // 8. Global search bar (SO, Employee, Department, Activity)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesQuery =
          log.workerName.toLowerCase().includes(query) ||
          log.soNumber.toLowerCase().includes(query) ||
          log.department.toLowerCase().includes(query) ||
          log.activity.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [activityLogs, activeTab, employeeSearch, soFilter, deptFilter, activityFilter, dateFilter, priorityFilter, searchQuery]);

  // Sliced Logs for Pagination
  const paginatedLogs = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredLogs.slice(start, start + rowsPerPage);
  }, [filteredLogs, page, rowsPerPage]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
    setSelectedIds([]);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setSelectedIds([]);
  };

  // --- Select Handling ---
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      // Select only selectable rows on current page (Pending or Under Review by current supervisor)
      const selectableIds = paginatedLogs
        .filter(l => (l.status === 'Pending' || (l.status === 'Under Review' && l.reviewedBy === user?.name)))
        .map(l => l.id);
      setSelectedIds(selectableIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (event: React.ChangeEvent<HTMLInputElement>, id: string) => {
    if (event.target.checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(rowId => rowId !== id));
    }
  };

  const handleReviewClick = (id: string, currentStatus: string) => {
    if (currentStatus === 'Pending') {
      checkoutActivityForReview(id, user?.name || 'Sam Supervisor');
    }
    navigate(`/review/${id}`);
  };

  const handleBulkActionSubmit = () => {
    if (selectedIds.length === 0) return;
    bulkVerifyActivities(selectedIds, bulkActionType, bulkRemarks || `Bulk ${bulkActionType}ed.`);
    setSelectedIds([]);
    setBulkRemarks('');
    setBulkDialogOpen(false);
  };

  // UI Chip Helpers
  const getPriorityChip = (priority?: string) => {
    const colors: Record<string, 'error' | 'warning' | 'info'> = {
      High: 'error',
      Medium: 'warning',
      Low: 'info',
    };
    return (
      <Chip
        label={priority || 'Medium'}
        size="small"
        color={colors[priority || 'Medium'] || 'warning'}
        variant="outlined"
        sx={{ fontWeight: 700, borderRadius: 1.5 }}
      />
    );
  };

  const getStatusChip = (status: string, reviewer?: string) => {
    const configs: Record<string, { color: 'warning' | 'success' | 'error' | 'secondary' | 'info', variant: 'outlined' | 'filled' }> = {
      Pending: { color: 'warning', variant: 'outlined' },
      Approved: { color: 'success', variant: 'outlined' },
      Rejected: { color: 'error', variant: 'outlined' },
      Rework: { color: 'secondary', variant: 'outlined' },
      'Under Review': { color: 'info', variant: 'filled' },
    };
    const c = configs[status] || { color: 'warning', variant: 'outlined' };
    
    if (status === 'Under Review') {
      return (
        <Tooltip title={`Under Review by: ${reviewer || 'Supervisor'}`}>
          <Chip
            label={reviewer === user?.name ? 'Reviewing (Me)' : `Reviewing (${reviewer?.split(' ')[0]})`}
            size="small"
            color="info"
            variant="filled"
            sx={{ fontWeight: 700, borderRadius: 1.5, background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', color: '#fff' }}
          />
        </Tooltip>
      );
    }

    return (
      <Chip
        label={status}
        size="small"
        color={c.color}
        variant={c.variant}
        sx={{ fontWeight: 700, borderRadius: 1.5 }}
      />
    );
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5 }}>
          Work Verification Queue
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          Verify and audit employee activity logs, assign rework corrections, and review submissions.
        </Typography>
      </Box>

      {/* Filter Section Card */}
      <Card sx={{ mb: 4, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2.5}>
            {/* Global Search */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Global Search"
                placeholder="Search Employee, SO, Dept..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>

            {/* Employee Search */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Employee Name"
                placeholder="Filter by name..."
                value={employeeSearch}
                onChange={e => setEmployeeSearch(e.target.value)}
              />
            </Grid>

            {/* SO Number */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Sales Order"
                value={soFilter}
                onChange={e => setSoFilter(e.target.value)}
              >
                <MenuItem value="">All Sales Orders</MenuItem>
                {uniqueSOs.map(so => (
                  <MenuItem key={so} value={so}>{so}</MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Department */}
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

            {/* Activity */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Activity type"
                value={activityFilter}
                onChange={e => setActivityFilter(e.target.value)}
              >
                <MenuItem value="">All Activities</MenuItem>
                {uniqueActivities.map(act => (
                  <MenuItem key={act} value={act}>{act}</MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Date */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="ACTIVITY DATE"
                slotProps={{ inputLabel: { shrink: true } }}
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
              />
            </Grid>

            {/* Priority */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                size="small"
                label="Priority"
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
              >
                <MenuItem value="">All Priorities</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </TextField>
            </Grid>

            {/* Actions */}
            <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                sx={{ borderRadius: 2.5, fontWeight: 700, py: 1 }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs Layout */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': { fontWeight: 700, fontSize: '0.95rem', minWidth: 100, textTransform: 'none' },
          }}
        >
          {tabStatuses.map((tabName, index) => {
            const count = activityLogs.filter(log => tabName === 'All' || log.status === tabName).length;
            return <Tab key={index} label={`${tabName} (${count})`} />;
          })}
        </Tabs>
      </Box>

      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2.5,
            bgcolor: 'rgba(37, 99, 235, 0.05)',
            border: '1px solid',
            borderColor: 'primary.light',
            borderRadius: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700 }}>
            {selectedIds.length} activities selected for bulk verification
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<ApproveIcon />}
              onClick={() => {
                setBulkActionType('Approve');
                setBulkDialogOpen(true);
              }}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              Bulk Approve
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<RejectIcon />}
              onClick={() => {
                setBulkActionType('Reject');
                setBulkDialogOpen(true);
              }}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              Bulk Reject
            </Button>
          </Box>
        </Paper>
      )}

      {/* Main Table */}
      <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <TableContainer>
          <Table sx={{ minWidth: 800 }} size="medium" stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedIds.length > 0 && selectedIds.length < paginatedLogs.filter(l => l.status === 'Pending' || (l.status === 'Under Review' && l.reviewedBy === user?.name)).length}
                    checked={paginatedLogs.length > 0 && selectedIds.length === paginatedLogs.filter(l => l.status === 'Pending' || (l.status === 'Under Review' && l.reviewedBy === user?.name)).length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>SO Number</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Activity</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Duration</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Std Time</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Deviation</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 8 }}>
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                      No activity logs found matching the filter criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLogs.map(log => {
                  const isSelected = selectedIds.includes(log.id);
                  // Locked check: 'Under Review' status AND reviewed by another supervisor
                  const isLockedByOther = log.status === 'Under Review' && log.reviewedBy !== user?.name;
                  const isSelectable = log.status === 'Pending' || (log.status === 'Under Review' && log.reviewedBy === user?.name);

                  // Calculate deviation between actual duration vs standard time
                  const deviationPercent = log.standardManMinutes > 0 
                    ? Math.round(((log.durationMinutes - log.standardManMinutes) / log.standardManMinutes) * 100)
                    : 0;

                  const deviationColor = deviationPercent > 20 
                    ? 'error.main' 
                    : (deviationPercent < -10 ? 'success.main' : 'text.secondary');

                  return (
                    <TableRow
                      key={log.id}
                      hover
                      selected={isSelected}
                      sx={{
                        '&.Mui-selected': { bgcolor: 'rgba(37, 99, 235, 0.02)' },
                        '&:last-child td, &:last-child th': { border: 0 }
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          disabled={!isSelectable || isLockedByOther}
                          onChange={e => handleSelectRow(e, log.id)}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{log.workerName}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{log.soNumber}</TableCell>
                      <TableCell>{log.department}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{log.activity}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{log.durationMinutes} Mins</TableCell>
                      <TableCell align="right" color="text.secondary">{log.standardManMinutes} Mins</TableCell>
                      <TableCell align="right" sx={{ color: deviationColor, fontWeight: 700 }}>
                        {deviationPercent > 0 ? `+${deviationPercent}%` : `${deviationPercent}%`}
                      </TableCell>
                      <TableCell>{getPriorityChip(log.reworkPriority)}</TableCell>
                      <TableCell>{getStatusChip(log.status, log.reviewedBy)}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Tooltip title={isLockedByOther ? `Locked by ${log.reviewedBy}` : 'Review submission details'}>
                            <span>
                              <IconButton
                                size="small"
                                color="primary"
                                disabled={isLockedByOther}
                                onClick={() => handleReviewClick(log.id, log.status)}
                              >
                                {log.status === 'Pending' || log.status === 'Under Review' ? (
                                  <ReviewIcon fontSize="small" />
                                ) : (
                                  <ViewIcon fontSize="small" />
                                )}
                              </IconButton>
                            </span>
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
          count={filteredLogs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      </Card>

      {/* Bulk Action Remarks Dialog */}
      <Dialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>
          Bulk {bulkActionType === 'Approve' ? 'Approval' : 'Rejection'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            You are about to verify {selectedIds.length} activities. Please enter remarks below.
          </Typography>
          <TextField
            fullWidth
            label="Verification Remarks"
            multiline
            rows={3}
            placeholder={bulkActionType === 'Approve' ? 'e.g. Bulk approved and verified.' : 'e.g. Duration is incorrect for these records.'}
            value={bulkRemarks}
            onChange={e => setBulkRemarks(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setBulkDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            onClick={handleBulkActionSubmit}
            variant="contained"
            color={bulkActionType === 'Approve' ? 'success' : 'error'}
            sx={{ borderRadius: 2 }}
          >
            Confirm Verification
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default WorkVerification;
