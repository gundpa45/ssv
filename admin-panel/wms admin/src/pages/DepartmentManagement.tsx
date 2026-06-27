import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Department, DeptActivity } from '../context/AppContext';
import {
  Grid,
  Card,
  Typography,
  Box,
  Avatar,
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
  MenuItem,
  Snackbar,
  Alert,
  Breadcrumbs,
  Link,
  Tooltip,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Help as ConfirmIcon,
  DeveloperMode as DevIcon,
  SupportAgent as SupportIcon,
  TrendingUp as PerformanceIcon,
  ArrowBack as BackIcon,
  Rule as RuleIcon,
  Timer as TimerIcon,
  PowerSettingsNew as ToggleIcon,
  CheckCircle as SaveIcon,
  FolderSpecial as WizardIcon,
} from '@mui/icons-material';

export const DepartmentManagement: React.FC = () => {
  const { themeMode, departments, setDepartments } = useApp();

  // ── Multi-View State ───────────────────────────────────────────────
  // 'listing' | 'details' | 'wizard'
  const [currentView, setCurrentView] = useState<'listing' | 'details' | 'wizard'>('listing');
  const [activeDept, setActiveDept] = useState<Department | null>(null);

  // ── Guided Wizard State ────────────────────────────────────────────
  const [wizardDept, setWizardDept] = useState<Department | null>(null);
  const [wizardActivities, setWizardActivities] = useState<DeptActivity[]>([]);

  const [deptSearch, setDeptSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activitySearch, setActivitySearch] = useState('');

  // Department Info Form State
  const [deptFormOpen, setDeptFormOpen] = useState(false);
  const [deptFormMode, setDeptFormMode] = useState<'add' | 'edit'>('add');
  const [targetDeptName, setTargetDeptName] = useState<string | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptStatus, setDeptStatus] = useState<'Active' | 'Inactive'>('Active');
  const [deptErrors, setDeptErrors] = useState<Record<string, string | undefined>>({});

  // Department Delete State
  const [deptDeleteOpen, setDeptDeleteOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);

  // Wizard Cancel State
  const [wizCancelOpen, setWizCancelOpen] = useState(false);

  // ── Direct Activity Adder State (Main Action Bar) ────────────────
  const [directActOpen, setDirectActOpen] = useState(false);
  const [directSelectedDept, setDirectSelectedDept] = useState('');
  const [directActName, setDirectActName] = useState('');
  const [directActMinutes, setDirectActMinutes] = useState<number | ''>('');
  const [directActErrors, setDirectActErrors] = useState<Record<string, string | undefined>>({});

  // ── Department Details View - Activity Form State ─────────────────
  const [detailsActOpen, setDetailsActOpen] = useState(false);
  const [detailsActFormMode, setDetailsActFormMode] = useState<'add' | 'edit'>('add');
  const [targetActId, setTargetActId] = useState<string | null>(null);
  const [detailsActName, setDetailsActName] = useState('');
  const [detailsActMinutes, setDetailsActMinutes] = useState<number | ''>('');
  const [detailsActStatus, setDetailsActStatus] = useState<'Active' | 'Inactive'>('Active');
  const [detailsActErrors, setDetailsActErrors] = useState<Record<string, string | undefined>>({});

  // Details View - Activity Delete State
  const [actDeleteOpen, setActDeleteOpen] = useState(false);
  const [actToDelete, setActToDelete] = useState<DeptActivity | null>(null);

  // ── Guided Wizard - Temporary Activity Form State ─────────────────
  const [wizActFormOpen, setWizActFormOpen] = useState(false);
  const [wizActFormMode, setWizActFormMode] = useState<'add' | 'edit'>('add');
  const [targetWizActId, setTargetWizActId] = useState<string | null>(null);
  const [wizActName, setWizActName] = useState('');
  const [wizActMinutes, setWizActMinutes] = useState<number | ''>('');
  const [wizActErrors, setWizActErrors] = useState<Record<string, string | undefined>>({});

  // ── Snackbar State ────────────────────────────────────────────────
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // ── Icon Helper ────────────────────────────────────────────────────
  const getDeptIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'production':
        return <PerformanceIcon sx={{ fontSize: 22, color: '#8B5CF6' }} />;
      case 'quality assurance':
        return <DevIcon sx={{ fontSize: 22, color: '#EC4899' }} />;
      case 'stores':
        return <BusinessIcon sx={{ fontSize: 22, color: '#F59E0B' }} />;
      case 'maintenance':
        return <SupportIcon sx={{ fontSize: 22, color: '#06B6D4' }} />;
      default:
        return <PerformanceIcon sx={{ fontSize: 22, color: '#6366F1' }} />;
    }
  };

  // ── Listing Page Dynamic KPIs & Filters ───────────────────────────
  const filteredDepartments = departments.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
      d.description.toLowerCase().includes(deptSearch.toLowerCase());

    const matchStatus = statusFilter === 'All' || d.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const totalDeptsCount = departments.length;
  const activeDeptsCount = departments.filter((d) => d.status === 'Active').length;
  const inactiveDeptsCount = totalDeptsCount - activeDeptsCount;
  const totalActivitiesCount = departments.reduce((sum, d) => sum + (d.activities || []).length, 0);

  // ── Department Action Form Validation & Submit ─────────────────────
  const validateDept = (): boolean => {
    const tempErrors: Record<string, string> = {};
    let isValid = true;

    if (!deptName.trim()) {
      tempErrors.name = 'Department Name is required';
      isValid = false;
    } else if (!/^[a-zA-Z\s]{3,30}$/.test(deptName.trim())) {
      tempErrors.name = 'Name must be 3-30 letters';
      isValid = false;
    } else if (
      deptFormMode === 'add' &&
      departments.some((d) => d.name.toLowerCase() === deptName.trim().toLowerCase())
    ) {
      tempErrors.name = 'A department with this name already exists';
      isValid = false;
    }

    if (!deptDesc.trim()) {
      tempErrors.desc = 'Description is required';
      isValid = false;
    } else if (deptDesc.trim().length < 10) {
      tempErrors.desc = 'Description must be at least 10 characters';
      isValid = false;
    }

    setDeptErrors(tempErrors);
    return isValid;
  };

  const handleAddDeptClick = () => {
    setDeptFormMode('add');
    setTargetDeptName(null);
    setDeptName('');
    setDeptDesc('');
    setDeptStatus('Active');
    setDeptErrors({});
    setDeptFormOpen(true);
  };

  const handleEditDeptClick = (dept: Department, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeptFormMode('edit');
    setTargetDeptName(dept.name);
    setDeptName(dept.name);
    setDeptDesc(dept.description);
    setDeptStatus(dept.status);
    setDeptErrors({});
    setDeptFormOpen(true);
  };

  const handleDeleteDeptClick = (dept: Department, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeptToDelete(dept);
    setDeptDeleteOpen(true);
  };

  const handleToggleDeptStatus = (dept: Department, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus: 'Active' | 'Inactive' = dept.status === 'Active' ? 'Inactive' : 'Active';
    setDepartments((prev) =>
      prev.map((d) => (d.name === dept.name ? { ...d, status: newStatus } : d))
    );
    setSnackbar({
      open: true,
      message: `Department "${dept.name}" status updated to ${newStatus}.`,
      severity: 'success',
    });
  };

  const handleSaveDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDept()) return;

    const trimmedName = deptName.trim();
    const trimmedDesc = deptDesc.trim();

    if (deptFormMode === 'add') {
      const newDept: Department = { id: '',
        name: trimmedName,
        description: trimmedDesc,
        status: deptStatus,
        createdDate: new Date().toISOString().split('T')[0],
        activities: [],
      };

      setDepartments((prev) => [...prev, newDept]);
      setDeptFormOpen(false);

      // Start Guided Step-by-Step Wizard for this Department
      setWizardDept(newDept);
      setWizardActivities([]);
      setCurrentView('wizard');

      setSnackbar({
        open: true,
        message: `Department "${trimmedName}" created! Now configure its activities.`,
        severity: 'success',
      });
    } else {
      setDepartments((prev) =>
        prev.map((d) =>
          d.name === targetDeptName
            ? { ...d, name: trimmedName, description: trimmedDesc, status: deptStatus }
            : d
        )
      );

      // Sync active view details if open
      if (activeDept && activeDept.name === targetDeptName) {
        setActiveDept((prev) =>
          prev ? { ...prev, name: trimmedName, description: trimmedDesc, status: deptStatus } : null
        );
      }

      setDeptFormOpen(false);
      setSnackbar({
        open: true,
        message: `Department "${trimmedName}" settings updated successfully!`,
        severity: 'success',
      });
    }
  };

  const handleConfirmDeleteDept = () => {
    if (!deptToDelete) return;
    setDepartments((prev) => prev.filter((d) => d.name !== deptToDelete.name));
    setSnackbar({
      open: true,
      message: `Department "${deptToDelete.name}" purged successfully from registry.`,
      severity: 'success',
    });
    setDeptDeleteOpen(false);
    setDeptToDelete(null);
  };

  // ── DIRECT ACTIVITY ADDER (Main Header Button) ─────────────────────
  const validateDirectAct = (): boolean => {
    const tempErrors: Record<string, string> = {};
    let isValid = true;

    if (!directSelectedDept) {
      tempErrors.dept = 'Please select a target department';
      isValid = false;
    }

    if (!directActName.trim()) {
      tempErrors.name = 'Activity Name is required';
      isValid = false;
    } else if (directSelectedDept) {
      const selected = departments.find((d) => d.name === directSelectedDept);
      if ((selected?.activities || []).some((a) => a.name.toLowerCase() === directActName.trim().toLowerCase())) {
        tempErrors.name = 'This activity name already exists in the selected department';
        isValid = false;
      }
    }

    if (directActMinutes === '') {
      tempErrors.minutes = 'Standard Minutes is required';
      isValid = false;
    } else if (isNaN(Number(directActMinutes)) || Number(directActMinutes) <= 0) {
      tempErrors.minutes = 'Must be a positive integer';
      isValid = false;
    }

    setDirectActErrors(tempErrors);
    return isValid;
  };

  const handleDirectActClick = () => {
    setDirectSelectedDept('');
    setDirectActName('');
    setDirectActMinutes('');
    setDirectActErrors({});
    setDirectActOpen(true);
  };

  const handleSaveDirectAct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDirectAct()) return;

    const newAct: DeptActivity = {
      id: `ACT-${Math.floor(100 + Math.random() * 900)}`,
      name: directActName.trim(),
      standardMinutes: Number(directActMinutes),
      status: 'Active',
    };

    setDepartments((prev) =>
      prev.map((d) => {
        if (d.name === directSelectedDept) {
          return { ...d, activities: [...(d.activities || []), newAct] };
        }
        return d;
      })
    );

    setDirectActOpen(false);
    setSnackbar({
      open: true,
      message: `Activity "${directActName}" added to the ${directSelectedDept} department!`,
      severity: 'success',
    });
  };

  // ── GUIDED CREATION WIZARD SCREEN HANDLERS ─────────────────────────
  const validateWizAct = (): boolean => {
    const tempErrors: Record<string, string> = {};
    let isValid = true;

    if (!wizActName.trim()) {
      tempErrors.name = 'Activity Name is required';
      isValid = false;
    } else if (
      wizActFormMode === 'add' &&
      wizardActivities.some((a) => a.name.toLowerCase() === wizActName.trim().toLowerCase())
    ) {
      tempErrors.name = 'An activity with this name is already pending in the wizard list';
      isValid = false;
    }

    if (wizActMinutes === '') {
      tempErrors.minutes = 'Standard Minutes is required';
      isValid = false;
    } else if (isNaN(Number(wizActMinutes)) || Number(wizActMinutes) <= 0) {
      tempErrors.minutes = 'Must be a positive integer duration';
      isValid = false;
    }

    setWizActErrors(tempErrors);
    return isValid;
  };


  const handleOpenWizActEdit = (act: DeptActivity) => {
    setWizActFormMode('edit');
    setTargetWizActId(act.id);
    setWizActName(act.name);
    setWizActMinutes(act.standardMinutes);
    setWizActErrors({});
    setWizActFormOpen(true);
  };

  const handleWizActSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateWizAct()) return;

    if (wizActFormMode === 'add') {
      const tempAct: DeptActivity = {
        id: `WIZ-ACT-${Math.floor(100 + Math.random() * 900)}`,
        name: wizActName.trim(),
        standardMinutes: Number(wizActMinutes),
        status: 'Active',
      };
      setWizardActivities((prev) => [...prev, tempAct]);
    } else {
      setWizardActivities((prev) =>
        prev.map((a) =>
          a.id === targetWizActId
            ? { ...a, name: wizActName.trim(), standardMinutes: Number(wizActMinutes) }
            : a
        )
      );
    }
    setWizActFormOpen(false);
  };

  const handleDeleteWizAct = (actId: string) => {
    setWizardActivities((prev) => prev.filter((a) => a.id !== actId));
  };

  const handleSaveWizardActivities = () => {
    if (!wizardDept) return;

    setDepartments((prev) =>
      prev.map((d) =>
        d.name === wizardDept.name ? { ...d, activities: wizardActivities } : d
      )
    );

    setCurrentView('listing');
    setWizardDept(null);
    setWizardActivities([]);
    setSnackbar({
      open: true,
      message: `Guided setup completed! Linked ${wizardActivities.length} activities successfully.`,
      severity: 'success',
    });
  };

  // ── DEPARTMENT DETAILS VIEW ACT OPERATION HANDLERS ────────────────
  const validateDetailsAct = (): boolean => {
    const tempErrors: Record<string, string> = {};
    let isValid = true;

    if (!detailsActName.trim()) {
      tempErrors.name = 'Activity Name is required';
      isValid = false;
    } else if (
      detailsActFormMode === 'add' &&
      (activeDept?.activities || []).some((a) => a.name.toLowerCase() === detailsActName.trim().toLowerCase())
    ) {
      tempErrors.name = 'This activity already exists inside this department';
      isValid = false;
    }

    if (detailsActMinutes === '') {
      tempErrors.minutes = 'Standard Minutes is required';
      isValid = false;
    } else if (isNaN(Number(detailsActMinutes)) || Number(detailsActMinutes) <= 0) {
      tempErrors.minutes = 'Must be a positive integer';
      isValid = false;
    }

    setDetailsActErrors(tempErrors);
    return isValid;
  };

  const handleOpenDetailsActAdd = () => {
    setDetailsActFormMode('add');
    setTargetActId(null);
    setDetailsActName('');
    setDetailsActMinutes('');
    setDetailsActStatus('Active');
    setDetailsActErrors({});
    setDetailsActOpen(true);
  };

  const handleOpenDetailsActEdit = (act: DeptActivity) => {
    setDetailsActFormMode('edit');
    setTargetActId(act.id);
    setDetailsActName(act.name);
    setDetailsActMinutes(act.standardMinutes);
    setDetailsActStatus(act.status);
    setDetailsActErrors({});
    setDetailsActOpen(true);
  };

  const handleSaveDetailsAct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDept || !validateDetailsAct()) return;

    const minVal = Number(detailsActMinutes);
    const nameVal = detailsActName.trim();

    if (detailsActFormMode === 'add') {
      const newAct: DeptActivity = {
        id: `ACT-${Math.floor(100 + Math.random() * 900)}`,
        name: nameVal,
        standardMinutes: minVal,
        status: detailsActStatus,
      };

      setDepartments((prev) =>
        prev.map((d) => {
          if (d.name === activeDept.name) {
            return { ...d, activities: [...(d.activities || []), newAct] };
          }
          return d;
        })
      );

      setActiveDept((prev) =>
        prev ? { ...prev, activities: [...(prev.activities || []), newAct] } : null
      );

      setSnackbar({
        open: true,
        message: `Activity "${nameVal}" added directly to ${activeDept.name}.`,
        severity: 'success',
      });
    } else {
      setDepartments((prev) =>
        prev.map((d) => {
          if (d.name === activeDept.name) {
            const updated = (d.activities || []).map((a) =>
              a.id === targetActId
                ? { ...a, name: nameVal, standardMinutes: minVal, status: detailsActStatus }
                : a
            );
            return { ...d, activities: updated };
          }
          return d;
        })
      );

      setActiveDept((prev) => {
        if (!prev) return null;
        const updated = (prev.activities || []).map((a) =>
          a.id === targetActId
            ? { ...a, name: nameVal, standardMinutes: minVal, status: detailsActStatus }
            : a
        );
        return { ...prev, activities: updated };
      });

      setSnackbar({
        open: true,
        message: `Activity "${nameVal}" settings updated!`,
        severity: 'success',
      });
    }
    setDetailsActOpen(false);
  };

  const handleToggleDetailsActStatus = (act: DeptActivity) => {
    if (!activeDept) return;
    const newStatus: 'Active' | 'Inactive' = act.status === 'Active' ? 'Inactive' : 'Active';

    setDepartments((prev) =>
      prev.map((d) => {
        if (d.name === activeDept.name) {
          const updated = (d.activities || []).map((a) =>
            a.id === act.id ? { ...a, status: newStatus } : a
          );
          return { ...d, activities: updated };
        }
        return d;
      })
    );

    setActiveDept((prev) => {
      if (!prev) return null;
      const updated = (prev.activities || []).map((a) => (a.id === act.id ? { ...a, status: newStatus } : a));
      return { ...prev, activities: updated };
    });

    setSnackbar({
      open: true,
      message: `Activity "${act.name}" set to ${newStatus}.`,
      severity: 'success',
    });
  };

  const handleDeleteDetailsActClick = (act: DeptActivity) => {
    setActToDelete(act);
    setActDeleteOpen(true);
  };

  const handleConfirmDeleteDetailsAct = () => {
    if (!activeDept || !actToDelete) return;

    setDepartments((prev) =>
      prev.map((d) => {
        if (d.name === activeDept.name) {
          const filtered = (d.activities || []).filter((a) => a.id !== actToDelete.id);
          return { ...d, activities: filtered };
        }
        return d;
      })
    );

    setActiveDept((prev) => {
      if (!prev) return null;
      const filtered = (prev.activities || []).filter((a) => a.id !== actToDelete.id);
      return { ...prev, activities: filtered };
    });

    setActDeleteOpen(false);
    setActToDelete(null);
    setSnackbar({
      open: true,
      message: `Activity Purged from department templates registry.`,
      severity: 'success',
    });
  };

  return (
    <Box>
      {/* ── SnackBar Notifications ── */}
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

      {/* ════════════════════════════════════════════════════════════════
          VIEW 1: DEPARTMENT LISTING MASTER PAGE
      ════════════════════════════════════════════════════════════════ */}
      {currentView === 'listing' && (
        <Box>
          {/* Header Description Banner */}
          <Card sx={{ p: 3, mb: 4, border: '1px solid', borderColor: 'divider', background: themeMode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)' }}>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 1, background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
              Departments & Activities Directory
            </Typography>
          </Card>

          {/* KPI Dashboard Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {[
              { label: 'Total Departments', value: `${totalDeptsCount} Divisions`, color: '#6366F1', icon: <BusinessIcon /> },
              { label: 'Active Departments', value: `${activeDeptsCount} Active`, color: '#10B981', icon: <PerformanceIcon /> },
              { label: 'Inactive Departments', value: `${inactiveDeptsCount} Inactive`, color: '#EF4444', icon: <BusinessIcon /> },
              { label: 'Total Activity Templates', value: `${totalActivitiesCount} Items`, color: '#06B6D4', icon: <RuleIcon /> },
            ].map((kpi, idx) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'rgba(99,102,241,0.08)', color: kpi.color, width: 44, height: 44 }}>
                    {kpi.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                      {kpi.label}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 850 }}>
                      {kpi.value}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Main Datagrid Container */}
          <Card sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
            {/* Header Action Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3.5 }}>
              {/* Search & Status Filters */}
              <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, maxWidth: { xs: '100%', sm: 500 } }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search departments..."
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 3, bgcolor: 'background.default' },
                    },
                  }}
                />

                <TextField
                  select
                  size="small"
                  sx={{ minWidth: 150 }}
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 600 } } }}
                >
                  <MenuItem value="All" sx={{ fontWeight: 600 }}>All Statuses</MenuItem>
                  <MenuItem value="Active" sx={{ fontWeight: 600 }}>Active Only</MenuItem>
                  <MenuItem value="Inactive" sx={{ fontWeight: 600 }}>Inactive Only</MenuItem>
                </TextField>
              </Box>

              {/* Side-by-Side Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddDeptClick}
                  sx={{
                    borderRadius: 3,
                    fontWeight: 750,
                    px: 2.8,
                    py: 1,
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
                  }}
                >
                  Add Department
                </Button>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleDirectActClick}
                  sx={{
                    borderRadius: 3,
                    fontWeight: 750,
                    px: 2.8,
                    py: 1,
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
                    boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)',
                  }}
                >
                  Add Activity
                </Button>
              </Box>
            </Box>

            {/* Department Table */}
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
              <Table size="medium">
                <TableHead sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.secondary', py: 1.8, width: '25%' }}>Department Name</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.secondary', width: '45%' }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.secondary', width: '12%' }}>Total Activities</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.secondary', width: '10%' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.secondary', width: '8%', pr: 3 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDepartments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                          No departments matching current filter options.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDepartments.map((dept) => {
                      const isActive = dept.status === 'Active';
                      return (
                        <TableRow
                          key={dept.name}
                          onClick={() => {
                            setActiveDept(dept);
                            setCurrentView('details');
                          }}
                          sx={{
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            '&:hover': { bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' },
                          }}
                        >
                          {/* Name Avatar */}
                          <TableCell sx={{ py: 1.6 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', width: 34, height: 34 }}>
                                {getDeptIcon(dept.name)}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontWeight: 800 }}>{dept.name}</Typography>
                            </Box>
                          </TableCell>

                          {/* Description */}
                          <TableCell sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.85rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {dept.description}
                          </TableCell>

                          {/* Total Activities count */}
                          <TableCell sx={{ fontWeight: 800, pl: 5 }}>
                            {(dept.activities || []).length}
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Chip
                              label={dept.status}
                              size="small"
                              sx={{
                                fontWeight: 850,
                                fontSize: '0.75rem',
                                bgcolor: isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                color: isActive ? '#10B981' : '#EF4444',
                              }}
                            />
                          </TableCell>

                          {/* Actions buttons */}
                          <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                              <Tooltip title="View Activities details">
                                <Button
                                  size="small"
                                  onClick={() => {
                                    setActiveDept(dept);
                                    setCurrentView('details');
                                  }}
                                  sx={{ textTransform: 'none', fontWeight: 700, mr: 1 }}
                                >
                                  View/Edit
                                </Button>
                              </Tooltip>
                              <Tooltip title="Edit Department settings">
                                <IconButton size="small" color="primary" onClick={(e) => handleEditDeptClick(dept, e)}>
                                  <EditIcon sx={{ fontSize: 17 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Toggle status chip">
                                <IconButton size="small" color="secondary" onClick={(e) => handleToggleDeptStatus(dept, e)}>
                                  <ToggleIcon sx={{ fontSize: 17 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Division">
                                <IconButton size="small" color="error" onClick={(e) => handleDeleteDeptClick(dept, e)}>
                                  <DeleteIcon sx={{ fontSize: 17 }} />
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
          </Card>
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════════════
          VIEW 2: DYNAMIC DEPARTMENT DETAILS VIEW
      ════════════════════════════════════════════════════════════════ */}
      {currentView === 'details' && activeDept && (
        <Box>
          {/* Breadcrumb Header navigation */}
          <Box sx={{ mb: 3 }}>
            <Breadcrumbs sx={{ fontWeight: 600, mb: 1.5 }}>
              <Link
                underline="hover"
                color="inherit"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveDept(null);
                  setCurrentView('listing');
                }}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
              >
                <BusinessIcon sx={{ mr: 0.5, fontSize: 17 }} />
                Departments
              </Link>
              <Typography color="text.primary" sx={{ fontWeight: 800 }}>
                {activeDept.name} Department
              </Typography>
            </Breadcrumbs>

            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => {
                setActiveDept(null);
                setCurrentView('listing');
              }}
              sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: 'none' }}
            >
              Back to Departments
            </Button>
          </Box>

          {/* Department Meta Information */}
          <Card sx={{ p: 3, mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'primary.main', mb: 2.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Department Specifications
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Department Name</Typography>
                <Typography variant="body1" sx={{ fontWeight: 850, mt: 0.5 }}>{activeDept.name}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Operational Status</Typography>
                <Chip
                  label={activeDept.status}
                  size="small"
                  sx={{
                    mt: 0.5,
                    fontWeight: 850,
                    bgcolor: activeDept.status === 'Active' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    color: activeDept.status === 'Active' ? '#10B981' : '#EF4444',
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Total Activities</Typography>
                <Typography variant="body1" sx={{ fontWeight: 850, mt: 0.5, color: 'primary.main' }}>
                  {(activeDept.activities || []).length} Templates
                </Typography>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>Description</Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.005)' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.6, color: 'text.primary' }}>
                    {activeDept.description}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Card>

          {/* Activities Listing card */}
          <Card sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3.5 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  Department Activity Templates
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Setup templates standard man-minutes, edit operations, and create new activity tasks.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                  size="small"
                  placeholder="Search activities..."
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'text.secondary', fontSize: 17 }} />
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 3, minWidth: 220, bgcolor: 'background.default' },
                    },
                  }}
                />

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenDetailsActAdd}
                  sx={{
                    borderRadius: 3,
                    fontWeight: 750,
                    px: 3,
                    py: 1,
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
                    boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)',
                  }}
                >
                  Add Activity
                </Button>
              </Box>
            </Box>

            {/* Nested Activities Table */}
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
              <Table size="medium">
                <TableHead sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.secondary', py: 1.8 }}>Activity Name</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.secondary' }}>Standard Minutes</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.secondary' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.secondary', pr: 3.5 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(activeDept.activities || []).filter(a => a.name.toLowerCase().includes(activitySearch.toLowerCase())).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                          No activity templates found. Click Add Activity to create a new one.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    (activeDept.activities || [])
                      .filter(a => a.name.toLowerCase().includes(activitySearch.toLowerCase()))
                      .map((act) => {
                        const isActive = act.status === 'Active';
                        return (
                          <TableRow key={act.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                            <TableCell sx={{ py: 1.5, fontWeight: 800, color: 'text.primary' }}>
                              {act.name}
                            </TableCell>

                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <TimerIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" sx={{ fontWeight: 750 }}>
                                  {act.standardMinutes} Minutes
                                </Typography>
                              </Box>
                            </TableCell>

                            <TableCell>
                              <Chip
                                label={act.status}
                                size="small"
                                sx={{
                                  fontWeight: 850,
                                  fontSize: '0.75rem',
                                  bgcolor: isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                  color: isActive ? '#10B981' : '#EF4444',
                                }}
                              />
                            </TableCell>

                            <TableCell align="right" sx={{ pr: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                <Tooltip title="Edit Activity Template">
                                  <IconButton size="small" color="primary" onClick={() => handleOpenDetailsActEdit(act)}>
                                    <EditIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Toggle Status Chip">
                                  <IconButton size="small" color="secondary" onClick={() => handleToggleDetailsActStatus(act)}>
                                    <ToggleIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Activity">
                                  <IconButton size="small" color="error" onClick={() => handleDeleteDetailsActClick(act)}>
                                    <DeleteIcon sx={{ fontSize: 16 }} />
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
          </Card>
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════════════
          VIEW 3: GUIDED CREATION WIZARD (Manage Activities)
      ════════════════════════════════════════════════════════════════ */}
      {currentView === 'wizard' && wizardDept && (
        <Box>
          {/* Breadcrumb Header */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <WizardIcon color="primary" sx={{ fontSize: 28 }} />
              Manage Activities — {wizardDept.name} Department
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Guided Department Setup. Complete adding activity templates below before final save.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {/* Left Column: Activity Creator Form */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Card sx={{ p: 3.5, border: '1px solid', borderColor: 'divider', borderRadius: 4, height: '100%' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'primary.main', mb: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Add Activity Form
                </Typography>

                <Box component="form" onSubmit={handleWizActSave} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    required
                    fullWidth
                    label="Activity Name"
                    placeholder="e.g. Transformer Assembly"
                    value={wizActName}
                    onChange={(e) => {
                      setWizActName(e.target.value);
                      if (wizActErrors.name) setWizActErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    error={Boolean(wizActErrors.name)}
                    helperText={wizActErrors.name}
                    slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 700 } } }}
                  />

                  <TextField
                    required
                    fullWidth
                    label="Standard Man Minutes"
                    placeholder="e.g. 120"
                    type="number"
                    value={wizActMinutes}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setWizActMinutes(val);
                      if (wizActErrors.minutes) setWizActErrors((prev) => ({ ...prev, minutes: undefined }));
                    }}
                    error={Boolean(wizActErrors.minutes)}
                    helperText={wizActErrors.minutes}
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start"><TimerIcon sx={{ fontSize: 16 }} /></InputAdornment>,
                        sx: { borderRadius: 3, fontWeight: 700 }
                      }
                    }}
                  />

                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleWizActSave}
                    sx={{
                      borderRadius: 3,
                      fontWeight: 750,
                      py: 1.2,
                      textTransform: 'none',
                      background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
                      boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)',
                    }}
                  >
                    Add Activity
                  </Button>
                </Box>
              </Card>
            </Grid>

            {/* Right Column: Temporary Compilation List */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Card sx={{ p: 3.5, border: '1px solid', borderColor: 'divider', borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'primary.main', mb: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Temporary Activities List
                </Typography>

                {/* Table list */}
                <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden', flexGrow: 1, mb: 3 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.012)' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.8rem', color: 'text.secondary', py: 1.5 }}>Activity Name</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.8rem', color: 'text.secondary' }}>Standard Minutes</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.8rem', color: 'text.secondary', pr: 3 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {wizardActivities.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                              No activity templates configured yet. Add activities using the form on the left.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        wizardActivities.map((act) => (
                          <TableRow key={act.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                            <TableCell sx={{ py: 1.2, fontWeight: 800 }}>{act.name}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <TimerIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                  {act.standardMinutes} Minutes
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right" sx={{ pr: 1.5 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                <IconButton size="small" color="primary" onClick={() => handleOpenWizActEdit(act)}>
                                  <EditIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                                <IconButton size="small" color="error" onClick={() => handleDeleteWizAct(act.id)}>
                                  <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Wizard Submission Controls */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      if (wizardActivities.length > 0) {
                        setWizCancelOpen(true);
                      } else {
                        setCurrentView('listing');
                        setWizardDept(null);
                        setWizardActivities([]);
                      }
                    }}
                    sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: 'none', px: 3 }}
                  >
                    Skip / Cancel
                  </Button>

                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveWizardActivities}
                    sx={{
                      borderRadius: 2.5,
                      fontWeight: 750,
                      px: 4,
                      py: 1,
                      textTransform: 'none',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    Save Activities
                  </Button>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════════════
          MODALS & DIALOGS: DEPARTMENT MANAGEMENT
      ════════════════════════════════════════════════════════════════ */}
      {/* Department Add/Edit Info Dialog */}
      <Dialog
        open={deptFormOpen}
        onClose={() => setDeptFormOpen(false)}
        slotProps={{
          paper: { sx: { borderRadius: 4, px: 2, py: 1, maxWidth: 500, width: '100%' } }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          {deptFormMode === 'add' ? 'Add Corporate Department' : 'Edit Department Settings'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box component="form" onSubmit={handleSaveDept} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <TextField
              required
              fullWidth
              label="Department Name"
              placeholder="e.g. Production"
              value={deptName}
              onChange={(e) => {
                setDeptName(e.target.value);
                if (deptErrors.name) setDeptErrors((prev) => ({ ...prev, name: undefined }));
              }}
              error={Boolean(deptErrors.name)}
              helperText={deptErrors.name}
              disabled={deptFormMode === 'edit'}
              slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 700 } } }}
            />

            <TextField
              required
              fullWidth
              multiline
              rows={3}
              label="Description"
              placeholder="Describe the department's core responsibilities and workflows..."
              value={deptDesc}
              onChange={(e) => {
                setDeptDesc(e.target.value);
                if (deptErrors.desc) setDeptErrors((prev) => ({ ...prev, desc: undefined }));
              }}
              error={Boolean(deptErrors.desc)}
              helperText={deptErrors.desc}
              slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 550 } } }}
            />

            <TextField
              select
              fullWidth
              label="Status"
              value={deptStatus}
              onChange={(e) => setDeptStatus(e.target.value as 'Active' | 'Inactive')}
              slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 700 } } }}
            >
              <MenuItem value="Active" sx={{ fontWeight: 600 }}>Active</MenuItem>
              <MenuItem value="Inactive" sx={{ fontWeight: 600 }}>Inactive</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ pb: 3, px: 3, mt: 1, gap: 1 }}>
          <Button onClick={() => setDeptFormOpen(false)} sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveDept}
            variant="contained"
            sx={{
              fontWeight: 750,
              borderRadius: 2.5,
              px: 3.5,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
            }}
          >
            {deptFormMode === 'add' ? 'Save Department' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Department Delete Confirmation Dialog */}
      <Dialog
        open={deptDeleteOpen}
        onClose={() => setDeptDeleteOpen(false)}
        slotProps={{
          paper: { sx: { borderRadius: 4, px: 2, py: 1, maxWidth: 420 } }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ConfirmIcon sx={{ color: 'error.main' }} />
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, lineHeight: 1.6 }}>
            Are you sure you want to delete the department <strong>{deptToDelete?.name}</strong>?
          </Typography>
          <Typography variant="caption" color="error" sx={{ fontWeight: 700, display: 'block', mt: 1.5 }}>
            ⚠ Warning: This action is permanent and will purge all linked activity templates!
          </Typography>
        </DialogContent>
        <DialogActions sx={{ pb: 3, px: 3 }}>
          <Button onClick={() => setDeptDeleteOpen(false)} sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDeleteDept}
            variant="contained"
            color="error"
            sx={{
              fontWeight: 750,
              borderRadius: 2.5,
              px: 3,
              textTransform: 'none',
            }}
          >
            Confirm & Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════
          MODALS & DIALOGS: DIRECT / DETAILS ACTIONS
      ════════════════════════════════════════════════════════════════ */}
      {/* 1. Direct Add Activity Modal (Dropdown Department Selection) */}
      <Dialog
        open={directActOpen}
        onClose={() => setDirectActOpen(false)}
        slotProps={{
          paper: { sx: { borderRadius: 4, px: 2, py: 1, maxWidth: 460, width: '100%' } }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <RuleIcon color="primary" />
          Add Activity Template
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box component="form" onSubmit={handleSaveDirectAct} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <TextField
              select
              required
              fullWidth
              label="Select Department"
              value={directSelectedDept}
              onChange={(e) => {
                setDirectSelectedDept(e.target.value);
                if (directActErrors.dept) setDirectActErrors((prev) => ({ ...prev, dept: undefined }));
              }}
              error={Boolean(directActErrors.dept)}
              helperText={directActErrors.dept}
              slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 700 } } }}
            >
              {departments.map((d) => (
                <MenuItem key={d.name} value={d.name} sx={{ fontWeight: 600 }}>
                  {d.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              required
              fullWidth
              label="Activity Name"
              placeholder="e.g. Core Assembly"
              value={directActName}
              onChange={(e) => {
                setDirectActName(e.target.value);
                if (directActErrors.name) setDirectActErrors((prev) => ({ ...prev, name: undefined }));
              }}
              error={Boolean(directActErrors.name)}
              helperText={directActErrors.name}
              slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 700 } } }}
            />

            <TextField
              required
              fullWidth
              label="Standard Man Minutes"
              placeholder="e.g. 90"
              type="number"
              value={directActMinutes}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : Number(e.target.value);
                setDirectActMinutes(val);
                if (directActErrors.minutes) setDirectActErrors((prev) => ({ ...prev, minutes: undefined }));
              }}
              error={Boolean(directActErrors.minutes)}
              helperText={directActErrors.minutes}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><TimerIcon sx={{ fontSize: 16 }} /></InputAdornment>,
                  sx: { borderRadius: 3, fontWeight: 700 }
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ pb: 3, px: 3, mt: 1, gap: 1 }}>
          <Button onClick={() => setDirectActOpen(false)} sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveDirectAct}
            variant="contained"
            sx={{
              fontWeight: 750,
              borderRadius: 2.5,
              px: 3.5,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
            }}
          >
            Save Activity
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2. Department Details - Activity Add/Edit Modal */}
      <Dialog
        open={detailsActOpen}
        onClose={() => setDetailsActOpen(false)}
        slotProps={{
          paper: { sx: { borderRadius: 4, px: 2, py: 1, maxWidth: 460, width: '100%' } }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <RuleIcon color="primary" />
          {detailsActFormMode === 'add' ? 'Add Activity Template' : 'Edit Activity Template'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {activeDept && (
            <Box component="form" onSubmit={handleSaveDetailsAct} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              <TextField
                required
                fullWidth
                label="Activity Name"
                placeholder="e.g. Winding"
                value={detailsActName}
                onChange={(e) => {
                  setDetailsActName(e.target.value);
                  if (detailsActErrors.name) setDetailsActErrors((prev) => ({ ...prev, name: undefined }));
                }}
                error={Boolean(detailsActErrors.name)}
                helperText={detailsActErrors.name}
                slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 700 } } }}
              />

              <TextField
                required
                fullWidth
                label="Standard Man Minutes"
                placeholder="e.g. 60"
                type="number"
                value={detailsActMinutes}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  setDetailsActMinutes(val);
                  if (detailsActErrors.minutes) setDetailsActErrors((prev) => ({ ...prev, minutes: undefined }));
                }}
                error={Boolean(detailsActErrors.minutes)}
                helperText={detailsActErrors.minutes}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start"><TimerIcon sx={{ fontSize: 16 }} /></InputAdornment>,
                    sx: { borderRadius: 3, fontWeight: 700 }
                  }
                }}
              />

              <TextField
                select
                fullWidth
                label="Status"
                value={detailsActStatus}
                onChange={(e) => setDetailsActStatus(e.target.value as 'Active' | 'Inactive')}
                slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 700 } } }}
              >
                <MenuItem value="Active" sx={{ fontWeight: 600 }}>Active</MenuItem>
                <MenuItem value="Inactive" sx={{ fontWeight: 600 }}>Inactive</MenuItem>
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ pb: 3, px: 3, mt: 1, gap: 1 }}>
          <Button onClick={() => setDetailsActOpen(false)} sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveDetailsAct}
            variant="contained"
            sx={{
              fontWeight: 750,
              borderRadius: 2.5,
              px: 3.5,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
            }}
          >
            Save Activity
          </Button>
        </DialogActions>
      </Dialog>

      {/* 3. Details View - Activity Delete Confirmation */}
      <Dialog
        open={actDeleteOpen}
        onClose={() => setActDeleteOpen(false)}
        slotProps={{
          paper: { sx: { borderRadius: 4, px: 2, py: 1, maxWidth: 400 } }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ConfirmIcon sx={{ color: 'error.main' }} />
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, lineHeight: 1.6 }}>
            Are you sure you want to delete the activity template <strong>{actToDelete?.name}</strong> from this department?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ pb: 3, px: 3 }}>
          <Button onClick={() => setActDeleteOpen(false)} sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDeleteDetailsAct}
            variant="contained"
            color="error"
            sx={{
              fontWeight: 750,
              borderRadius: 2.5,
              px: 3,
              textTransform: 'none',
            }}
          >
            Confirm & Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════
          MODALS & DIALOGS: GUIDED WIZARD ACTIONS
      ════════════════════════════════════════════════════════════════ */}
      {/* Wizard Temporary Activity Add/Edit Modal */}
      <Dialog
        open={wizActFormOpen}
        onClose={() => setWizActFormOpen(false)}
        slotProps={{
          paper: { sx: { borderRadius: 4, px: 2, py: 1, maxWidth: 460, width: '100%' } }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <RuleIcon color="primary" />
          Edit Wizard Activity
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box component="form" onSubmit={handleWizActSave} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <TextField
              required
              fullWidth
              label="Activity Name"
              placeholder="e.g. Winding"
              value={wizActName}
              onChange={(e) => {
                setWizActName(e.target.value);
                if (wizActErrors.name) setWizActErrors((prev) => ({ ...prev, name: undefined }));
              }}
              error={Boolean(wizActErrors.name)}
              helperText={wizActErrors.name}
              slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 700 } } }}
            />

            <TextField
              required
              fullWidth
              label="Standard Man Minutes"
              placeholder="e.g. 60"
              type="number"
              value={wizActMinutes}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : Number(e.target.value);
                setWizActMinutes(val);
                if (wizActErrors.minutes) setWizActErrors((prev) => ({ ...prev, minutes: undefined }));
              }}
              error={Boolean(wizActErrors.minutes)}
              helperText={wizActErrors.minutes}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><TimerIcon sx={{ fontSize: 16 }} /></InputAdornment>,
                  sx: { borderRadius: 3, fontWeight: 700 }
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ pb: 3, px: 3, mt: 1, gap: 1 }}>
          <Button onClick={() => setWizActFormOpen(false)} sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleWizActSave}
            variant="contained"
            sx={{
              fontWeight: 750,
              borderRadius: 2.5,
              px: 3.5,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
            }}
          >
            Save Activity
          </Button>
        </DialogActions>
      </Dialog>

      {/* Wizard Cancel Confirmation Dialog */}
      <Dialog
        open={wizCancelOpen}
        onClose={() => setWizCancelOpen(false)}
        slotProps={{
          paper: { sx: { borderRadius: 4, px: 2, py: 1, maxWidth: 400 } }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ConfirmIcon sx={{ color: 'warning.main' }} />
          Discard Setup?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, lineHeight: 1.6 }}>
            You have added {wizardActivities.length} temporary activities. Skipping now will discard these template activities, but the department "{wizardDept?.name}" will still be created.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ pb: 3, px: 3, mt: 1, gap: 1 }}>
          <Button onClick={() => setWizCancelOpen(false)} sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'none' }}>
            Keep Editing
          </Button>
          <Button
            onClick={() => {
              setWizCancelOpen(false);
              setCurrentView('listing');
              setWizardDept(null);
              setWizardActivities([]);
              setSnackbar({
                open: true,
                message: `Guided activities configuration skipped.`,
                severity: 'success',
              });
            }}
            variant="contained"
            color="warning"
            sx={{
              fontWeight: 750,
              borderRadius: 2.5,
              px: 3,
              textTransform: 'none',
            }}
          >
            Discard
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

