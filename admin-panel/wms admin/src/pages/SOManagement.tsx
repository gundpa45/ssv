import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { SalesOrder } from '../context/AppContext';
import {
  Grid,
  Card,
  Typography,
  Box,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  LinearProgress,
  Tooltip,
  FormControlLabel,
  Checkbox,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  RestartAlt as ResetIcon,
  Save as SaveIcon,
  Assignment as SOIcon,
  Edit as EditIcon,
  ToggleOn as ActivateIcon,
  ToggleOff as DeactivateIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  KeyboardArrowLeft,
  KeyboardArrowRight,
} from '@mui/icons-material';

export const SOManagement: React.FC = () => {
  const { salesOrders, addNewSalesOrder, updateSalesOrder, toggleSOStatus, deleteSalesOrder, themeMode, departments, activityLogs, currentUserRole, soPermissions } = useApp();
  const navigate = useNavigate();

  // Search & Filters State
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(() => {
    const stored = sessionStorage.getItem('so_activeTab');
    return stored !== null ? Number(stored) : 0;
  }); // 0: All, 1: Active, 2: Completed, 3: Delayed

  React.useEffect(() => {
    sessionStorage.setItem('so_activeTab', String(activeTab));
  }, [activeTab]);

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Delete Confirmation Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [soToDelete, setSoToDelete] = useState<SalesOrder | null>(null);



  // Form Dialog State
  const [formOpen, setFormOpen] = useState(false);
  const [soNumber, setSoNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [editMode, setEditMode] = useState(false);
  const [editingSoId, setEditingSoId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  // Snackbar State
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Form Reset handler
  const handleResetForm = () => {
    setSoNumber('');
    setCustomerName('');
    setProjectName('');
    setStartDate('');
    setEndDate('');
    setDescription('');
    setErrors({});
    setEditMode(false);
    setEditingSoId(null);
    setIsActive(true);
  };

  // Form Validators
  const validate = (): boolean => {
    const tempErrors: Record<string, string | undefined> = {};
    let isValid = true;

    if (!soNumber.trim()) {
      tempErrors.soNumber = 'SO Number is required';
      isValid = false;
    } else if (
      !editMode &&
      salesOrders.some((so) => so.soNumber.toLowerCase() === soNumber.trim().toLowerCase())
    ) {
      tempErrors.soNumber = 'This SO Number already exists';
      isValid = false;
    }

    if (!customerName.trim()) {
      tempErrors.customerName = 'Customer Name is required';
      isValid = false;
    }

    if (!startDate) {
      tempErrors.startDate = 'Start Date is required';
      isValid = false;
    }

    if (!endDate) {
      tempErrors.endDate = 'End Date is required';
      isValid = false;
    } else if (startDate && new Date(endDate) < new Date(startDate)) {
      tempErrors.endDate = 'End Date cannot be before Start Date';
      isValid = false;
    }

    if (!description.trim()) {
      tempErrors.description = 'Description is required';
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  // Save handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const activeDepts = departments.filter(d => d.status === 'Active');
    const allActiveDeptNames = activeDepts.map(d => d.name);
    const allActiveActNames = activeDepts.flatMap(d => (d.activities || []).filter(a => a.status === 'Active').map(a => a.name));

    const newSO: any = {
      soNumber: soNumber.trim().toUpperCase(),
      customerName: customerName.trim().toUpperCase(),
      projectName: projectName.trim(),
      startDate,
      endDate,
      description: description.trim(),
      status: editMode ? (salesOrders.find(so => so.id === editingSoId)?.status || 'Not Started') : 'Not Started',
      workers: editMode ? (salesOrders.find(so => so.id === editingSoId)?.workers || []) : [],
      activities: editMode ? (salesOrders.find(so => so.id === editingSoId)?.activities || []) : [],
      allowedDepartments: allActiveDeptNames,
      allowedActivities: allActiveActNames,
      isActive: isActive,
    };

    let success = false;
    if (editMode && editingSoId) {
      success = await updateSalesOrder(editingSoId, payloadSO);
    } else {
      success = await addNewSalesOrder(payloadSO);
    }

    if (success) {
      setSnackbar({
        open: true,
        message: editMode
          ? `Sales Order "${payloadSO.soNumber}" updated successfully!`
          : `Sales Order "${payloadSO.soNumber}" registered and configured successfully!`,
        severity: 'success',
      });
      setFormOpen(false);
      handleResetForm();
    } else {
      setSnackbar({
        open: true,
        message: editMode
          ? 'Could not update Sales Order. Please verify data.'
          : 'Could not register Sales Order. Please verify data.',
        severity: 'error',
      });
    }
  };

  const handleEditClick = (so: SalesOrder) => {
    setEditMode(true);
    setEditingSoId(so.id || null);
    setSoNumber(so.soNumber);
    setCustomerName(so.customerName);
    setProjectName(so.projectName);
    setStartDate(so.startDate);
    setEndDate(so.endDate);
    setDescription(so.description);
    setIsActive(so.isActive !== false);
    setErrors({});
    setFormOpen(true);
  };



  // Filtering Logic
  const filteredSOs = salesOrders.filter((so) => {
    // 1. Real-time Search query
    const matchSearch =
      so.soNumber.toLowerCase().includes(search.toLowerCase()) ||
      so.customerName.toLowerCase().includes(search.toLowerCase()) ||
      so.projectName.toLowerCase().includes(search.toLowerCase());

    // Calculate dynamic status parameters
    const totalActs = so.allowedActivities ? so.allowedActivities.length : 0;
    const loggedActs = new Set(
      activityLogs
        .filter((log: any) => {
          const logSoNumber = log.SalesOrder?.soNumber || log.soNumber || log.soId;
          return logSoNumber === so.soNumber;
        })
        .map((log: any) => log.activity?.activityName || log.activity || '')
    );
    const completedActs = so.allowedActivities 
      ? so.allowedActivities.filter(act => loggedActs.has(act)).length
      : 0;
    const isCompleted = so.status === 'Completed' || (totalActs > 0 && completedActs === totalActs);
    const isDeactivated = so.isActive === false;

    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue = so.endDate && so.endDate < todayStr;
    const isDelayed = !isDeactivated && !isCompleted && (so.status === 'Delayed' || isOverdue);

    const isActiveSO = !isDeactivated && !isCompleted && !isDelayed;

    // 2. Tab selection filtering
    let matchTab = true;
    if (activeTab === 1) {
      // Active SO (not deactivated, not completed, not delayed)
      matchTab = isActiveSO;
    } else if (activeTab === 2) {
      // Completed SO
      matchTab = isCompleted;
    } else if (activeTab === 3) {
      // Delayed SO
      matchTab = isDelayed;
    } else if (activeTab === 4) {
      // Inactive SO
      matchTab = isDeactivated;
    }

    return matchSearch && matchTab;
  });


  return (
    <Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: 3, fontWeight: 700 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>


      {/* SO List Master Table Card */}
      <Card sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
        {/* Navigation Filters */}
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => {
              setActiveTab(val);
              setPage(0);
            }}
            sx={{
              '& .MuiTab-root': { fontWeight: 700, fontSize: '0.9rem', textTransform: 'none', px: 3 },
            }}
          >
            <Tab label="All Sales Orders" />
            <Tab label="Active SO" />
            <Tab label="Completed SO" />
            <Tab label="Delayed SO" />
            <Tab label="Inactive SO" />
          </Tabs>
        </Box>

        {/* Search bar & Add Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <TextField
            size="small"
            placeholder="Search SO #, Customer, or Project..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 3, width: { xs: '100%', sm: 300 }, bgcolor: 'background.default' },
              },
            }}
          />

          {/* Role Badge */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip
              label={`Role: ${currentUserRole}`}
              size="small"
              sx={{
                fontWeight: 800,
                fontSize: '0.72rem',
                bgcolor: currentUserRole === 'Admin' ? 'rgba(139,92,246,0.12)'
                  : ['Manager','Supervisor'].includes(currentUserRole) ? 'rgba(6,182,212,0.12)'
                  : 'rgba(16,185,129,0.10)',
                color: currentUserRole === 'Admin' ? '#8B5CF6'
                  : ['Manager','Supervisor'].includes(currentUserRole) ? '#06B6D4'
                  : '#10B981',
                border: '1px solid',
                borderColor: currentUserRole === 'Admin' ? 'rgba(139,92,246,0.3)'
                  : ['Manager','Supervisor'].includes(currentUserRole) ? 'rgba(6,182,212,0.3)'
                  : 'rgba(16,185,129,0.3)',
              }}
            />
            {soPermissions.canCreate && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => { handleResetForm(); setFormOpen(true); }}
                sx={{
                  borderRadius: 3,
                  fontWeight: 700,
                  px: 3,
                  py: 1,
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                  boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                  }
                }}
              >
                Create Sales Order
              </Button>
            )}
          </Box>
        </Box>

        {/* Table representation */}
        <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, py: 1.5 }}>SO NO</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>CUSTOMER NAME</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>START DATE</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>END DATE</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>COMPLETED ACTIVITIES</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>REMAINING ACTIVITIES</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>TOTAL MAN HOURS</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '15%' }}>PROGRESS</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>REWORK COUNT</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">ACTION</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSOs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                      <SOIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
                        {activeTab === 0 && 'No Sales Orders Found'}
                        {activeTab === 1 && 'No Active Sales Orders'}
                        {activeTab === 2 && 'No Completed Sales Orders'}
                        {activeTab === 3 && 'No Delayed Sales Orders'}
                        {activeTab === 4 && 'No Inactive Sales Orders'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, maxWidth: 400, mb: 3, textAlign: 'center' }}>
                        {activeTab === 0 && (soPermissions.canCreate ? 'Create a new SO to begin tracking work activities.' : 'No sales orders are visible for your role.')}
                        {activeTab === 1 && 'All sales orders are currently inactive, completed, or past their deadline.'}
                        {activeTab === 2 && 'No sales orders have been completed yet.'}
                        {activeTab === 3 && 'No sales orders have exceeded their end date. All SOs are within schedule.'}
                        {activeTab === 4 && 'No sales orders have been deactivated. All SOs are currently active.'}
                      </Typography>
                      {activeTab === 0 && soPermissions.canCreate && (
                        <Button
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => { handleResetForm(); setFormOpen(true); }}
                          sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
                        >
                          Create Your First SO
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSOs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((so) => {
                  // Progress math: handle both flat and nested backend log formats
                  const totalActs = so.allowedActivities ? so.allowedActivities.length : 0;
                  const loggedActs = new Set(
                    activityLogs
                      .filter((log: any) => {
                        const logSoNumber = log.SalesOrder?.soNumber || log.soNumber || log.soId;
                        return logSoNumber === so.soNumber;
                      })
                      .map((log: any) => log.activity?.activityName || log.activity || '')
                  );
                  const completedActs = so.allowedActivities 
                    ? so.allowedActivities.filter(act => loggedActs.has(act)).length
                    : 0;
                  const progressPercentage = totalActs > 0 ? Math.round((completedActs / totalActs) * 100) : 0;

                  // Management KPIs Math
                  const soLogs = activityLogs.filter((log: any) => (log.SalesOrder?.soNumber || log.soNumber || log.soId) === so.soNumber);
                  const totalWorkingHours = Math.round(soLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0) / 60 * 10) / 10;
                  const totalRework = soLogs.filter(log => log.remarks?.toLowerCase().includes('rework') || log.remarks?.toLowerCase().includes('correction')).length;

                  return (
                    <React.Fragment key={so.soNumber}>
                      <TableRow
                        sx={{
                          transition: 'background-color 0.2s',
                          '&:hover': { bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' },
                        }}
                      >
                        <TableCell sx={{ fontWeight: 800 }}>
                          <Button
                            onClick={() => navigate(`/so-reports/${so.soNumber}`)}
                            sx={{
                              fontFamily: 'ui-monospace, monospace',
                              fontWeight: 'bold',
                              color: 'primary.main',
                              textTransform: 'none',
                              p: 0,
                              minWidth: 0,
                              '&:hover': { textDecoration: 'underline', bgcolor: 'transparent' },
                            }}
                          >
                            {so.soNumber}
                          </Button>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{so.customerName}</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.82rem', fontWeight: 600 }}>{so.startDate}</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.82rem', fontWeight: 600 }}>{so.endDate}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#10B981', pl: 3 }}>{completedActs}</TableCell>
                        <TableCell sx={{ fontWeight: 700, pl: 3 }}>{totalActs - completedActs}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.85rem' }}>{totalWorkingHours} hrs</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: '100%' }}>
                              <LinearProgress
                                variant="determinate"
                                value={progressPercentage}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                  '& .MuiLinearProgress-bar': {
                                    background: progressPercentage === 100 
                                      ? 'linear-gradient(90deg, #10B981, #059669)'
                                      : 'linear-gradient(90deg, #2563EB, #06B6D4)',
                                    borderRadius: 3,
                                  }
                                }}
                              />
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 800, minWidth: 28, textAlign: 'right' }}>
                              {progressPercentage}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, pl: 3 }}>{totalRework}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            {/* Toggle Active/Inactive — Manager level+ only */}
                            {soPermissions.canToggleStatus && (
                              <Tooltip title={so.isActive !== false ? "Deactivate Sales Order" : "Activate Sales Order"}>
                                <IconButton
                                  size="small"
                                  color={so.isActive !== false ? "success" : "error"}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!so.id) {
                                      setSnackbar({ open: true, message: 'Cannot update: Sales Order ID missing.', severity: 'error' });
                                      return;
                                    }
                                    const newIsActive = so.isActive === false ? true : false;
                                    const success = await toggleSOStatus(so.id, newIsActive);
                                    if (success) {
                                      setSnackbar({
                                        open: true,
                                        message: `Sales Order "${so.soNumber}" is now ${newIsActive ? 'Active' : 'Inactive'}.`,
                                        severity: 'success',
                                      });
                                    } else {
                                      setSnackbar({
                                        open: true,
                                        message: `Failed to update Sales Order "${so.soNumber}" status. Check console for details.`,
                                        severity: 'error',
                                      });
                                    }
                                  }}
                                  sx={{
                                    '&:hover': {
                                      background: so.isActive !== false ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                                    }
                                  }}
                                >
                                  {so.isActive !== false ? <ActivateIcon sx={{ fontSize: 24 }} /> : <DeactivateIcon sx={{ fontSize: 24 }} />}
                                </IconButton>
                              </Tooltip>
                            )}

                            {/* Edit SO — Manager level+ only */}
                            {soPermissions.canEdit && (
                              <Tooltip title="Edit Sales Order">
                                <IconButton
                                  size="small"
                                  color="warning"
                                  onClick={() => handleEditClick(so)}
                                  sx={{
                                    '&:hover': {
                                      background: 'rgba(237, 137, 54, 0.08)',
                                    }
                                  }}
                                >
                                  <EditIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            )}

                            {/* View SO Reports — Skilled+ only */}
                            {soPermissions.canViewDashboard && (
                              <Tooltip title="View SO Reports">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => navigate(`/so-reports/${so.soNumber}`)}
                                  sx={{
                                    '&:hover': {
                                      background: 'rgba(37, 99, 235, 0.08)',
                                    }
                                  }}
                                >
                                  <ViewIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                            )}

                            {/* Delete SO — Admin only */}
                            {soPermissions.canDelete && (
                              <Tooltip title="Delete Sales Order">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setSoToDelete(so);
                                    setDeleteConfirmOpen(true);
                                  }}
                                  sx={{
                                    '&:hover': {
                                      background: 'rgba(239, 68, 68, 0.08)',
                                    }
                                  }}
                                >
                                  <DeleteIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                            )}

                            {/* View-only indicator for restricted roles */}
                            {!soPermissions.canToggleStatus && !soPermissions.canEdit && !soPermissions.canViewDashboard && (
                              <Chip label="View Only" size="small" sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary' }} />
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Custom Pagination Component matching 2nd image style */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            pt: 2.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            mt: 2.5,
          }}
        >
          {/* Rows per page selector on the left */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Rows per page:
            </Typography>
            <TextField
              select
              size="small"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              slotProps={{
                select: {
                  sx: {
                    borderRadius: 2,
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                    '& .MuiSelect-select': { py: 0.75, px: 1.5 }
                  }
                }
              }}
              sx={{ width: 80 }}
            >
              {[5, 10, 25, 50].map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </TextField>
            <Typography variant="caption" sx={{ fontWeight: 650, color: 'text.secondary', ml: 1 }}>
              Showing {filteredSOs.length > 0 ? page * rowsPerPage + 1 : 0}-{Math.min(filteredSOs.length, (page + 1) * rowsPerPage)} of {filteredSOs.length}
            </Typography>
          </Box>

          {/* Page numbers selector matching the 2nd image style */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              overflow: 'hidden',
              bgcolor: 'background.paper',
            }}
          >
            {/* Previous Button */}
            <Button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                color: page === 0 ? 'text.disabled' : 'text.primary',
                px: 2,
                py: 1,
                borderRadius: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                borderRight: '1px solid',
                borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' },
                '&.Mui-disabled': { color: 'text.disabled' }
              }}
            >
              <KeyboardArrowLeft sx={{ fontSize: 18, mr: -0.25 }} /> Previous
            </Button>

            {/* Page Number Buttons */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'stretch',
                height: '100%',
              }}
            >
              {(() => {
                const totalPages = Math.ceil(filteredSOs.length / rowsPerPage);
                if (totalPages === 0) return null;
                const pages: (number | string)[] = [];
                if (totalPages <= 7) {
                  for (let i = 0; i < totalPages; i++) pages.push(i);
                } else {
                  pages.push(0);
                  let start = Math.max(1, page - 1);
                  let end = Math.min(totalPages - 2, page + 1);
                  if (page <= 2) {
                    end = 3;
                  } else if (page >= totalPages - 3) {
                    start = totalPages - 4;
                  }
                  if (start > 1) pages.push('...');
                  for (let i = start; i <= end; i++) pages.push(i);
                  if (end < totalPages - 2) pages.push('...');
                  pages.push(totalPages - 1);
                }

                return pages.map((p, idx) => {
                  if (p === '...') {
                    return (
                      <Box
                        key={`ellipsis-${idx}`}
                        sx={{
                          px: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'text.secondary',
                          fontWeight: 700,
                          borderRight: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        ...
                      </Box>
                    );
                  }

                  const isSelected = p === page;
                  return (
                    <Button
                      key={`page-${p}`}
                      onClick={() => setPage(p as number)}
                      sx={{
                        minWidth: 42,
                        height: 42,
                        borderRadius: 0,
                        fontWeight: isSelected ? 800 : 600,
                        fontSize: '0.9rem',
                        color: isSelected ? 'text.primary' : 'text.secondary',
                        // Draw outline if selected matching the image style
                        border: '1.5px solid',
                        borderColor: isSelected ? 'text.primary' : 'transparent',
                        borderRight: isSelected ? '1.5px solid' : '1px solid',
                        borderRightColor: isSelected ? 'text.primary' : 'divider',
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: isSelected ? 'transparent' : 'action.hover',
                        },
                      }}
                    >
                      {(p as number) + 1}
                    </Button>
                  );
                });
              })()}
            </Box>

            {/* Next Button */}
            <Button
              disabled={page >= Math.ceil(filteredSOs.length / rowsPerPage) - 1 || filteredSOs.length === 0}
              onClick={() => setPage(page + 1)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                color: (page >= Math.ceil(filteredSOs.length / rowsPerPage) - 1 || filteredSOs.length === 0) ? 'text.disabled' : 'text.primary',
                px: 2,
                py: 1,
                borderRadius: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                '&:hover': { bgcolor: 'action.hover' },
                '&.Mui-disabled': { color: 'text.disabled' }
              }}
            >
              Next <KeyboardArrowRight sx={{ fontSize: 18, ml: -0.25 }} />
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Create Sales Order Dialog Form Modal */}
      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 4, px: 2, py: 1 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SOIcon color="primary" />
          {editMode ? 'Edit Sales Order Requisition' : 'Create Sales Order Requisition'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box component="form" noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  required
                  fullWidth
                  disabled={editMode}
                  label="SO Number"
                  placeholder="e.g. SO-2026-006"
                  value={soNumber}
                  onChange={(e) => {
                    setSoNumber(e.target.value);
                    if (errors.soNumber) setErrors((prev) => ({ ...prev, soNumber: undefined }));
                  }}
                  error={Boolean(errors.soNumber)}
                  helperText={errors.soNumber}
                  slotProps={{
                    input: { sx: { borderRadius: 3, textTransform: 'uppercase', fontFamily: 'ui-monospace, monospace', fontWeight: 'bold' } },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  required
                  fullWidth
                  label="Customer Name"
                  placeholder="e.g. ABC Power Ltd"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (errors.customerName) setErrors((prev) => ({ ...prev, customerName: undefined }));
                  }}
                  error={Boolean(errors.customerName)}
                  helperText={errors.customerName}
                  slotProps={{
                    input: { sx: { borderRadius: 3, fontWeight: 600, textTransform: 'uppercase' } },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Project Name"
                  placeholder="e.g. 100MVA Transformer Manufacturing"
                  value={projectName}
                  onChange={(e) => {
                    setProjectName(e.target.value);
                  }}
                  slotProps={{
                    input: { sx: { borderRadius: 3, fontWeight: 600 } },
                  }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  required
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: undefined }));
                  }}
                  error={Boolean(errors.startDate)}
                  helperText={errors.startDate}
                  slotProps={{
                    inputLabel: { shrink: true },
                    input: { sx: { borderRadius: 3 } },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  required
                  fullWidth
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: undefined }));
                  }}
                  error={Boolean(errors.endDate)}
                  helperText={errors.endDate}
                  slotProps={{
                    inputLabel: { shrink: true },
                    input: { sx: { borderRadius: 3 } },
                  }}
                />
              </Grid>
            </Grid>

            <TextField
              required
              fullWidth
              multiline
              rows={3}
              label="Description"
              placeholder="Provide a detailed description of the project, engineering guidelines, deliverables..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              error={Boolean(errors.description)}
              helperText={errors.description}
              slotProps={{
                input: { sx: { borderRadius: 3 } },
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>Active Status</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 550 }}>
                    Mark this Sales Order as Active to allow employees to log work against it.
                  </Typography>
                </Box>
              }
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ pb: 3, px: 3, mt: 1, gap: 1 }}>
          <Button
            onClick={handleResetForm}
            startIcon={<ResetIcon />}
            sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'none' }}
          >
            Reset
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            onClick={() => setFormOpen(false)}
            sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            sx={{
              fontWeight: 750,
              borderRadius: 2.5,
              px: 3.5,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
            }}
          >
            Save Sales Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        slotProps={{
          paper: {
            sx: { borderRadius: 4, p: 2, maxWidth: 450 }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5, color: 'error.main' }}>
          <DeleteIcon />
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.primary" sx={{ fontWeight: 700, mb: 1 }}>
            Are you sure you want to delete Sales Order:
          </Typography>
          {soToDelete && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: themeMode === 'dark' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.02)', borderColor: 'error.light', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, fontFamily: 'ui-monospace, monospace' }}>
                SO Number: {soToDelete.soNumber}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Customer: {soToDelete.customerName}
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ pb: 1, px: 2, gap: 1 }}>
          <Button
            onClick={() => {
              setDeleteConfirmOpen(false);
              setSoToDelete(null);
            }}
            sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              if (soToDelete?.id) {
                const success = await deleteSalesOrder(soToDelete.id);
                if (success) {
                  setSnackbar({
                    open: true,
                    message: `Sales Order "${soToDelete.soNumber}" deleted successfully!`,
                    severity: 'success',
                  });
                  // Adjust page if current page becomes empty after deletion
                  const remainingCount = filteredSOs.length - 1;
                  const maxPage = Math.max(0, Math.ceil(remainingCount / rowsPerPage) - 1);
                  if (page > maxPage) {
                    setPage(maxPage);
                  }
                } else {
                  setSnackbar({
                    open: true,
                    message: `Failed to delete Sales Order "${soToDelete.soNumber}".`,
                    severity: 'error',
                  });
                }
              }
              setDeleteConfirmOpen(false);
              setSoToDelete(null);
            }}
            sx={{
              fontWeight: 800,
              borderRadius: 2.5,
              px: 3,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
            }}
          >
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
