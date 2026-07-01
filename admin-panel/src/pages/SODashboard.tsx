import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { SalesOrder, Department } from '../context/AppContext';
import {
  Grid,
  Card,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  InputAdornment,
  Divider,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  PictureAsPdf as PdfIcon,
  GridOn as ExcelIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  FileDownload as ExportIcon,
  CalendarToday as CalendarIcon,
  Business as BuildingIcon,
  Assignment as AssignIcon,
  SimCardDownload as IndividualReportIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Helpers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const today = new Date().toISOString().split('T')[0];

const formatDateToShow = (dateStr: string): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parts[2];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day}-${months[monthIdx] || parts[1]}-${year}`;
};

function getSoStatus(so: SalesOrder): string {
  if (so.isActive === false) return 'Inactive';
  const logs = (so as any)._logsCount || 0;
  const total = so.allowedActivities?.length || 0;
  if (total > 0 && logs >= total) return 'Completed';
  if (so.endDate && so.endDate < today) return 'Delayed';
  return 'Active';
}

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  Active:    { bg: 'rgba(16,185,129,0.10)',  color: '#10B981', border: 'rgba(16,185,129,0.30)' },
  Inactive:  { bg: 'rgba(107,114,128,0.10)', color: '#9CA3AF', border: 'rgba(107,114,128,0.25)' },
  Completed: { bg: 'rgba(37,99,235,0.10)',   color: '#2563EB', border: 'rgba(37,99,235,0.30)' },
  Delayed:   { bg: 'rgba(239,68,68,0.10)',   color: '#EF4444', border: 'rgba(239,68,68,0.30)' },
};

const isLogInPeriod = (logDateStr: string, period: string, startD: string, endD: string): boolean => {
  if (!logDateStr) return false;
  if (period === 'All') return true;

  const logDate = new Date(logDateStr);
  if (isNaN(logDate.getTime())) return false;

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  logDate.setHours(0, 0, 0, 0);

  if (period === 'Daily') {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    return logDateStr === todayStr;
  }
  
  if (period === 'Weekly') {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const startLimit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    startLimit.setHours(0, 0, 0, 0);
    return logDate >= startLimit && logDate <= now;
  }
  
  if (period === 'Monthly') {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const startLimit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    startLimit.setHours(0, 0, 0, 0);
    return logDate >= startLimit && logDate <= now;
  }
  
  if (period === 'Yearly') {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const startLimit = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    startLimit.setHours(0, 0, 0, 0);
    return logDate >= startLimit && logDate <= now;
  }
  
  if (period === 'Custom Range') {
    if (startD && logDateStr < startD) return false;
    if (endD && logDateStr > endD) return false;
    return true;
  }

  return true;
};


// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Main Component Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export const SODashboard: React.FC = () => {
  const { soNumber } = useParams<{ soNumber: string }>();
  const navigate = useNavigate();
  const { salesOrders, activityLogs, departments, themeMode, user } = useApp();

  // Resolve selected SO for Dept/Emp tabs
  let selectedSO = salesOrders.find(s => s.soNumber.toLowerCase() === (soNumber || '').toLowerCase());
  if (!selectedSO && salesOrders.length > 0) selectedSO = salesOrders[0];

  const [dashboardTab, setDashboardTab] = useState(() => {
    const stored = sessionStorage.getItem('so_dashboardTab');
    return stored !== null ? Number(stored) : 0;
  });

  React.useEffect(() => {
    sessionStorage.setItem('so_dashboardTab', String(dashboardTab));
  }, [dashboardTab]);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // Summary tab filters (local)
  const [summarySearch, setSummarySearch] = useState('');
  const [summaryStatus, setSummaryStatus] = useState('All');
  const [summaryPeriod, setSummaryPeriod] = useState('Monthly');
  const [summaryFromDate, setSummaryFromDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [summaryToDate, setSummaryToDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Applied Summary tab filters
  const [appliedSummarySearch, setAppliedSummarySearch] = useState('');
  const [appliedSummaryStatus, setAppliedSummaryStatus] = useState('All');
  const [appliedSummaryPeriod, setAppliedSummaryPeriod] = useState('Monthly');
  const [appliedSummaryFromDate, setAppliedSummaryFromDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [appliedSummaryToDate, setAppliedSummaryToDate] = useState(() => new Date().toISOString().split('T')[0]);

  const handleApplySummaryFilters = () => {
    setAppliedSummarySearch(summarySearch);
    setAppliedSummaryStatus(summaryStatus);
    setAppliedSummaryPeriod(summaryPeriod);
    setAppliedSummaryFromDate(summaryFromDate);
    setAppliedSummaryToDate(summaryToDate);
  };

  // Dept / Emp tab filters
  const [periodFilter, setPeriodFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  // Applied Dept / Emp tab filters
  const [appliedPeriodFilter, setAppliedPeriodFilter] = useState('All');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');
  const [appliedDeptFilter, setAppliedDeptFilter] = useState('All');

  const activeDepts = useMemo(() => {
    const names = new Set(departments.filter(d => d.status === 'Active').map(d => d.name));
    if (selectedSO && selectedSO.allowedDepartments) {
      selectedSO.allowedDepartments.forEach((d: string) => names.add(d));
    }
    return ['All', ...Array.from(names)];
  }, [departments, selectedSO]);

  const handleApplyFilters = () => {
    setAppliedPeriodFilter(periodFilter);
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    setAppliedDeptFilter(deptFilter);
  };

  const handleClearFilters = () => {
    setPeriodFilter('All');
    setFromDate('');
    setToDate('');
    setDeptFilter('All');
    setAppliedPeriodFilter('All');
    setAppliedFromDate('');
    setAppliedToDate('');
    setAppliedDeptFilter('All');
  };


  // â”€â”€â”€ SO-level computed metrics helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const getSOMetrics = (so: SalesOrder, allDepts: Department[], periodFilterVal?: string, startD?: string, endD?: string) => {
    let soLogs = activityLogs.filter((l: any) => {
      const logSO = l.soNumber || l.SalesOrder?.soNumber || '';
      return logSO === so.soNumber;
    });

    if (periodFilterVal && periodFilterVal !== 'All') {
      soLogs = soLogs.filter((l: any) => {
        const logDateStr = l.date || (l.createdAt ? l.createdAt.split('T')[0] : '');
        return isLogInPeriod(logDateStr, periodFilterVal, startD || '', endD || '');
      });
    }

    const allowedDepts = so.allowedDepartments || allDepts.filter(d => d.status === 'Active').map(d => d.name);
    const allowedActs = so.allowedActivities || [];
    const totalActivities = allowedActs.length;

    const completedActNames = new Set(soLogs.map((l: any) => l.activity?.activityName || l.activity || ''));
    const completedActivities = allowedActs.filter(a => completedActNames.has(a)).length;

    const actualHours = Math.round(soLogs.reduce((s: number, l: any) => s + (l.durationMinutes || 0), 0) / 60 * 10) / 10;

    // Ideal hours = sum of standard minutes for all allowed activities / 60
    const allDeptActs = allDepts.flatMap(d => (d.activities || []).map(a => ({ ...a, deptName: d.name })));
    const idealMinutes = allowedActs.reduce((sum, actName) => {
      const act = allDeptActs.find(a => a.name === actName);
      return sum + (act?.standardMinutes || 0);
    }, 0);
    const idealHours = Math.round(idealMinutes / 60 * 10) / 10;

    const productivity = idealHours > 0 && actualHours > 0
      ? Math.min(Math.round((idealHours / actualHours) * 100), 999)
      : 0;

    const uniqueEmps = new Set(soLogs.map((l: any) => l.userId || l.user?.id || '').filter(Boolean));

    const reworkCount = soLogs.filter((l: any) => (l.remarks || '').toLowerCase().includes('rework')).length;
    const status = getSoStatus(so);

    return {
      soLogs,
      allowedDepts,
      totalActivities,
      completedActivities,
      progressPct: totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0,
      actualHours,
      idealHours,
      productivity,
      totalEmployees: uniqueEmps.size,
      reworkCount,
      status,
    };
  };

  // â”€â”€â”€ Summary Table Data (ALL SOs) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const allSOMetrics = useMemo(() =>
    salesOrders.map(so => ({
      so,
      ...getSOMetrics(so, departments, appliedSummaryPeriod, appliedSummaryFromDate, appliedSummaryToDate)
    })),
    [salesOrders, activityLogs, departments, appliedSummaryPeriod, appliedSummaryFromDate, appliedSummaryToDate]
  );

  const filteredSOMetrics = useMemo(() => {
    return allSOMetrics.filter(m => {
      const matchSearch = !appliedSummarySearch.trim() ||
        m.so.soNumber.toLowerCase().includes(appliedSummarySearch.trim().toLowerCase()) ||
        m.so.customerName.toLowerCase().includes(appliedSummarySearch.trim().toLowerCase());
        
      const matchStatus = appliedSummaryStatus === 'All' || m.status === appliedSummaryStatus;
      
      return matchSearch && matchStatus;
    });
  }, [allSOMetrics, appliedSummarySearch, appliedSummaryStatus]);

  // Summary totals (based on filtered list)
  const summaryTotals = useMemo(() => {
    const filteredSoNumbers = new Set(filteredSOMetrics.map(m => m.so.soNumber));
    const uniqueFilteredUsers = new Set(
      activityLogs.filter((l: any) => {
        const logSO = l.soNumber || l.SalesOrder?.soNumber || '';
        const logDateStr = l.date || (l.createdAt ? l.createdAt.split('T')[0] : '');
        return filteredSoNumbers.has(logSO) &&
          isLogInPeriod(logDateStr, appliedSummaryPeriod, appliedSummaryFromDate, appliedSummaryToDate);
      }).map((l: any) => l.userId || '').filter(Boolean)
    );

    return {
      totalSOs: filteredSOMetrics.length,
      activeSOs: filteredSOMetrics.filter(m => m.status === 'Active').length,
      inactiveSOs: filteredSOMetrics.filter(m => m.status === 'Inactive').length,
      completedSOs: filteredSOMetrics.filter(m => m.status === 'Completed').length,
      delayedSOs: filteredSOMetrics.filter(m => m.status === 'Delayed').length,
      totalEmployees: uniqueFilteredUsers.size,
      totalActivities: filteredSOMetrics.reduce((s, m) => s + m.totalActivities, 0),
      totalActualHours: Math.round(filteredSOMetrics.reduce((s, m) => s + m.actualHours, 0) * 10) / 10,
      totalIdealHours: Math.round(filteredSOMetrics.reduce((s, m) => s + m.idealHours, 0) * 10) / 10,
      avgProductivity: filteredSOMetrics.length > 0
        ? Math.round(filteredSOMetrics.reduce((s, m) => s + m.productivity, 0) / filteredSOMetrics.length)
        : 0,
    };
  }, [filteredSOMetrics, activityLogs, appliedSummaryPeriod, appliedSummaryFromDate, appliedSummaryToDate]);

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Selected SO metrics for Dept / Emp tabs Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const selMetrics = useMemo(() =>
    selectedSO ? getSOMetrics(selectedSO, departments) : null,
    [selectedSO, activityLogs, departments]
  );

  // Dept breakdown for selected SO
  const filteredSoLogs = useMemo(() => {
    if (!selMetrics) return [];
    return selMetrics.soLogs.filter((l: any) => {
      const logDateStr = l.date || (l.createdAt ? l.createdAt.split('T')[0] : '');
      const dateMatch = isLogInPeriod(logDateStr, appliedPeriodFilter, appliedFromDate, appliedToDate);
      if (!dateMatch) return false;
      if (appliedDeptFilter !== 'All') {
        const logDept = l.department?.name || l.department || '';
        if (logDept.toLowerCase() !== appliedDeptFilter.toLowerCase()) return false;
      }
      return true;
    });
  }, [selMetrics, appliedPeriodFilter, appliedFromDate, appliedToDate, appliedDeptFilter]);

  const deptMetrics = useMemo(() => {
    if (!selectedSO || !selMetrics) return [];
    const activeDeptsList = departments.filter(d => d.status === 'Active');
    const targetDepts = appliedDeptFilter === 'All'
      ? activeDeptsList
      : activeDeptsList.filter(d => d.name.toLowerCase() === appliedDeptFilter.toLowerCase());

    return targetDepts.map(dept => {
      const deptLogs = filteredSoLogs.filter((l: any) => (l.department?.name || l.department || '') === dept.name);
      const deptActs = (dept.activities || []).filter(a => a.status === 'Active');
      const completedNames = new Set(deptLogs.map((l: any) => l.activity?.activityName || l.activity || ''));
      const completed = deptActs.filter(a => completedNames.has(a.name)).length;
      const hours = Math.round(deptLogs.reduce((s: number, l: any) => s + (l.durationMinutes || 0), 0) / 60 * 10) / 10;
      const idealMin = deptActs.reduce((s, a) => s + (a.standardMinutes || 0), 0);
      const idealH = Math.round(idealMin / 60 * 10) / 10;
      const rework = deptLogs.filter((l: any) => (l.remarks || '').toLowerCase().includes('rework')).length;
      const progress = deptActs.length > 0 ? Math.round((completed / deptActs.length) * 100) : 0;
      return { department: dept.name, totalActivities: deptActs.length, completedActivities: completed, progress, hours, idealHours: idealH, rework };
    });
  }, [selectedSO, selMetrics, filteredSoLogs, departments, appliedDeptFilter]);

  // Employee breakdown for selected SO
  type EmpRec = { employeeId: string; name: string; activities: number; actualHours: number; rework: number; depts: Set<string> };
  const employeeMetrics = useMemo(() => {
    if (!selMetrics) return [];
    const map = new Map<string, EmpRec>();
    filteredSoLogs.forEach((l: any) => {
      // Use employeeId from user if available, fallback to userId hash
      const employeeId = l.user?.employeeId || l.userId || 'Unknown';
      const name = l.user ? `${l.user.firstName || ''} ${l.user.lastName || ''}`.trim() : (l.workerName || employeeId);
      const dept = l.department?.name || l.department || '';
      if (!map.has(employeeId)) map.set(employeeId, { employeeId, name, activities: 0, actualHours: 0, rework: 0, depts: new Set() });
      const e = map.get(employeeId)!;
      e.activities += 1;
      e.actualHours += (l.durationMinutes || 0) / 60;
      if ((l.remarks || '').toLowerCase().includes('rework')) e.rework += 1;
      if (dept) e.depts.add(dept);
    });
    return Array.from(map.values()).map(e => ({ ...e, actualHours: Math.round(e.actualHours * 10) / 10, depts: Array.from(e.depts).join(', ') }));
  }, [selMetrics, filteredSoLogs]);

  // Map of activity standardMinutes by department and name
  const activityIdealMinutesMap = useMemo(() => {
    const map = new Map<string, number>();
    departments.forEach(d => {
      (d.activities || []).forEach(a => {
        map.set(`${d.name}::${a.name}`, a.standardMinutes || 0);
      });
    });
    return map;
  }, [departments]);

  // Helper to determine log ideal minutes
  const getLogIdealMinutes = (log: any) => {
    const deptName = log.department?.name || log.department || '';
    const actName = log.activity?.activityName || log.activity || '';
    if (log.standardManMinutes && log.standardManMinutes > 0) {
      return log.standardManMinutes;
    }
    return activityIdealMinutesMap.get(`${deptName}::${actName}`) || 0;
  };

  // â”€â”€â”€ Department-wise report detailed computation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const deptReportData = useMemo(() => {
    if (!selectedSO || !selMetrics) return { details: [], summary: [], overall: null };

    // Group logs by (department, activity)
    const detailMap = new Map<string, {
      department: string;
      activity: string;
      actualHours: number;
      idealHours: number;
      users: Set<string>;
      reworkCount: number;
      reworkHours: number;
    }>();

    filteredSoLogs.forEach((l: any) => {
      const deptName = l.department?.name || l.department || 'Unknown';
      const actName = l.activity?.activityName || l.activity || 'Unknown';
      const key = `${deptName}::${actName}`;

      const actualMins = l.durationMinutes || 0;
      const idealMins = getLogIdealMinutes(l);
      const isRework = (l.remarks || '').toLowerCase().includes('rework');
      const userId = l.userId || l.user?.id || l.workerName || 'Unknown';

      if (!detailMap.has(key)) {
        detailMap.set(key, {
          department: deptName,
          activity: actName,
          actualHours: 0,
          idealHours: 0,
          users: new Set<string>(),
          reworkCount: 0,
          reworkHours: 0,
        });
      }

      const item = detailMap.get(key)!;
      item.actualHours += actualMins / 60;
      item.idealHours += idealMins / 60;
      item.users.add(userId);
      if (isRework) {
        item.reworkCount += 1;
        item.reworkHours += actualMins / 60;
      }
    });

    const details = Array.from(detailMap.values()).map(d => {
      const actualHours = Math.round(d.actualHours * 10) / 10;
      const idealHours = Math.round(d.idealHours * 10) / 10;
      const reworkHours = Math.round(d.reworkHours * 10) / 10;
      const productivity = actualHours > 0 ? Math.round((idealHours / actualHours) * 100) : 0;
      return {
        department: d.department,
        activity: d.activity,
        actualHours,
        idealHours,
        usersWorked: d.users.size,
        reworkCount: d.reworkCount,
        reworkHours,
        productivity,
      };
    });

    // Group details by department to construct Department Summary
    const summaryMap = new Map<string, {
      department: string;
      totalActivities: number;
      totalUsers: number;
      actualHours: number;
      idealHours: number;
      reworkCount: number;
      reworkHours: number;
    }>();

    details.forEach(d => {
      const deptName = d.department;
      if (!summaryMap.has(deptName)) {
        summaryMap.set(deptName, {
          department: deptName,
          totalActivities: 0,
          totalUsers: 0,
          actualHours: 0,
          idealHours: 0,
          reworkCount: 0,
          reworkHours: 0,
        });
      }
      const item = summaryMap.get(deptName)!;
      item.totalActivities += 1;
      item.totalUsers += d.usersWorked;
      item.actualHours += d.actualHours;
      item.idealHours += d.idealHours;
      item.reworkCount += d.reworkCount;
      item.reworkHours += d.reworkHours;
    });

    const summary = Array.from(summaryMap.values()).map(s => {
      const actualHours = Math.round(s.actualHours * 10) / 10;
      const idealHours = Math.round(s.idealHours * 10) / 10;
      const reworkHours = Math.round(s.reworkHours * 10) / 10;
      const productivity = actualHours > 0 ? Math.round((idealHours / actualHours) * 100) : 0;
      return {
        department: s.department,
        totalActivities: s.totalActivities,
        totalUsers: s.totalUsers,
        actualHours,
        idealHours,
        reworkCount: s.reworkCount,
        reworkHours,
        productivity,
      };
    });

    // Overall SO Summary
    const overallTotalDeps = summary.length;
    const overallTotalActs = summary.reduce((sum, s) => sum + s.totalActivities, 0);
    const overallTotalUsers = summary.reduce((sum, s) => sum + s.totalUsers, 0);
    const overallActualHours = Math.round(summary.reduce((sum, s) => sum + s.actualHours, 0) * 10) / 10;
    const overallIdealHours = Math.round(summary.reduce((sum, s) => sum + s.idealHours, 0) * 10) / 10;
    const overallReworkCount = summary.reduce((sum, s) => sum + s.reworkCount, 0);
    const overallReworkHours = Math.round(summary.reduce((sum, s) => sum + s.reworkHours, 0) * 10) / 10;
    const overallProductivity = overallActualHours > 0 ? Math.round((overallIdealHours / overallActualHours) * 100) : 0;

    const overall = {
      totalDepartments: overallTotalDeps,
      totalActivities: overallTotalActs,
      totalUsers: overallTotalUsers,
      actualHours: overallActualHours,
      idealHours: overallIdealHours,
      reworkCount: overallReworkCount,
      reworkHours: overallReworkHours,
      productivity: overallProductivity,
    };

    return { details, summary, overall };
  }, [selectedSO, selMetrics, filteredSoLogs, activityIdealMinutesMap]);

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Employee-wise report detailed computation Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const empReportData = useMemo(() => {
    if (!selectedSO || !selMetrics) return { details: [], summary: [], overall: null };

    // Group logs by (employeeId, department, activity)
    const detailMap = new Map<string, {
      employeeId: string;
      name: string;
      department: string;
      activity: string;
      actualHours: number;
      idealHours: number;
    }>();

    selMetrics.soLogs.forEach((l: any) => {
      // Employee report detail generation using employeeId from user object
      const employeeId = l.user?.employeeId || l.userId || 'Unknown';
      const name = l.user ? `${l.user.firstName || ''} ${l.user.lastName || ''}`.trim() : (l.workerName || employeeId);
      const deptName = l.department?.name || l.department || 'Unknown';
      const actName = l.activity?.activityName || l.activity || 'Unknown';
      const key = `${employeeId}::${deptName}::${actName}`;

      const actualMins = l.durationMinutes || 0;
      // Get ideal minutes
      let idealMins = l.standardManMinutes || 0;
      if (idealMins <= 0) {
        idealMins = activityIdealMinutesMap.get(`${deptName}::${actName}`) || 0;
      }

      if (!detailMap.has(key)) {
        detailMap.set(key, {
          employeeId: employeeId,
          name,
          department: deptName,
          activity: actName,
          actualHours: 0,
          idealHours: 0,
        });
      }

      const item = detailMap.get(key)!;
      item.actualHours += actualMins / 60;
      item.idealHours += idealMins / 60;
    });

    const details = Array.from(detailMap.values()).map(d => {
      const actualHours = Math.round(d.actualHours * 10) / 10;
      const idealHours = Math.round(d.idealHours * 10) / 10;
      const productivity = actualHours > 0 ? Math.round((idealHours / actualHours) * 100) : 0;
      return {
        employeeId: d.employeeId,
        name: d.name,
        department: d.department,
        activity: d.activity,
        actualHours,
        idealHours,
        productivity,
      };
    });

    // Group logs by (employeeId, department) for Employee Summary
    const summaryMap = new Map<string, {
      employeeId: string;
      name: string;
      department: string;
      totalActivities: number;
      actualHours: number;
      idealHours: number;
    }>();

    filteredSoLogs.forEach((l: any) => {
      // Summary map using employeeId from user object
      const employeeId = l.user?.employeeId || l.userId || 'Unknown';
      const name = l.user ? `${l.user.firstName || ''} ${l.user.lastName || ''}`.trim() : (l.workerName || employeeId);
      const deptName = l.department?.name || l.department || 'Unknown';
      const actName = l.activity?.activityName || l.activity || 'Unknown';
      const key = `${employeeId}::${deptName}`;

      const actualMins = l.durationMinutes || 0;
      let idealMins = l.standardManMinutes || 0;
      if (idealMins <= 0) {
        idealMins = activityIdealMinutesMap.get(`${deptName}::${actName}`) || 0;
      }

      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          employeeId: employeeId,
          name,
          department: deptName,
          totalActivities: 0,
          actualHours: 0,
          idealHours: 0,
        });
      }

      const item = summaryMap.get(key)!;
      item.totalActivities += 1;
      item.actualHours += actualMins / 60;
      item.idealHours += idealMins / 60;
    });

    const summary = Array.from(summaryMap.values()).map(s => {
      const actualHours = Math.round(s.actualHours * 10) / 10;
      const idealHours = Math.round(s.idealHours * 10) / 10;
      const productivity = actualHours > 0 ? Math.round((idealHours / actualHours) * 100) : 0;
      return {
        employeeId: s.employeeId,
        name: s.name,
        department: s.department,
        totalActivities: s.totalActivities,
        actualHours,
        idealHours,
        productivity,
      };
    });

    // Overall SO Summary (Employee-wise)
    const uniqueEmployees = new Set(filteredSoLogs.map((l: any) => l.userId || l.user?.id || 'Unknown'));
    const overallTotalEmployees = uniqueEmployees.size;
    const overallTotalActivities = filteredSoLogs.length;
    const overallActualHours = Math.round(filteredSoLogs.reduce((sum: number, l: any) => sum + (l.durationMinutes || 0), 0) / 60 * 10) / 10;
    
    // Ideal hours sum
    const overallIdealMinutes = filteredSoLogs.reduce((sum: number, l: any) => {
      let idealMins = l.standardManMinutes || 0;
      if (idealMins <= 0) {
        const deptName = l.department?.name || l.department || 'Unknown';
        const actName = l.activity?.activityName || l.activity || 'Unknown';
        idealMins = activityIdealMinutesMap.get(`${deptName}::${actName}`) || 0;
      }
      return sum + idealMins;
    }, 0);
    const overallIdealHours = Math.round(overallIdealMinutes / 60 * 10) / 10;
    
    const overallProductivity = overallActualHours > 0 ? Math.round((overallIdealHours / overallActualHours) * 100) : 0;

    const overall = {
      totalEmployees: overallTotalEmployees,
      totalActivities: overallTotalActivities,
      actualHours: overallActualHours,
      idealHours: overallIdealHours,
      productivity: overallProductivity,
    };

    return { details, summary, overall };
  }, [selectedSO, selMetrics, filteredSoLogs, activityIdealMinutesMap]);

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Snackbar helper Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const notify = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Helper: download then open (for Excel & PDF) Ã¢â‚¬â€œ saves with proper name and attempts to open in new tab
  const triggerDownloadAndOpen = (blob: Blob, filename: string) => {
    // Trigger download with correct filename
    saveAs(blob, filename);
    // Open blob in new tab (PDF will display, Excel may prompt download)
    const url = URL.createObjectURL(blob);
    const newTab = window.open(url, '_blank');
    if (!newTab) {
      // PopÃ¢â‚¬â€˜up blocked Ã¢â‚¬â€œ download already triggered
    }
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬ PDF: output as blob URL and open in new tab Ã¢â‚¬â€ opens immediately in browser PDF viewer
  const savePDF = (doc: import('jspdf').jsPDF, filename: string) => {
    const blob = doc.output('blob');
    triggerDownloadAndOpen(blob, filename);
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ XLSX Export Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const saveXLSX = (wb: XLSX.WorkBook, filename: string) => {
    // Write workbook to binary array and create Blob
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    triggerDownloadAndOpen(blob, filename);
  };
  const handleSummaryXLSX = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      const now = new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const generatedBy = user?.name || 'Admin User';

      const rows: any[][] = [];

      // Row 1 (Index 0): Title & generated metadata
      rows.push(['WORKFORCE MANAGEMENT SYSTEM', '', '', '', '', '', '', '', '', '', '', `Generated On : ${now}`]);
      // Row 2 (Index 1): Subtitle, report name, generated by metadata
      rows.push(['Workforce Management System', '', '', '', 'SO SUMMARY REPORT', '', '', '', '', '', '', `Generated By : ${generatedBy}`]);
      // Row 3 (Index 2): Blank spacer
      rows.push([]);
      
      // Row 4 (Index 3): REPORT FILTERS and KPI blocks headers
      rows.push([
        '', // A
        'REPORT FILTERS', '', '', '', '', // B-F
        '', // G
        'TOTAL SOs', '', 'ACTIVE SOs', '', 'COMPLETED SOs', '', 'DELAYED SOs', '', 'AVG PRODUCTIVITY' // H-P
      ]);
      
      // Row 5 (Index 4): Filter items row 1 + KPI values
      rows.push([
        '', // A
        'Period', appliedSummaryPeriod, '', 'To Date', formatDateToShow(appliedSummaryToDate), // B-F
        '', // G
        summaryTotals.totalSOs, '', summaryTotals.activeSOs, '', summaryTotals.completedSOs, '', summaryTotals.delayedSOs, '', `${summaryTotals.avgProductivity}%` // H-P
      ]);
      
      // Row 6 (Index 5): Filter items row 2 + KPI percentages/subs
      rows.push([
        '', // A
        'Status', appliedSummaryStatus, '', 'Search', appliedSummarySearch || 'All', // B-F
        '', // G
        '100%', '',
        summaryTotals.totalSOs > 0 ? `${(summaryTotals.activeSOs / summaryTotals.totalSOs * 100).toFixed(2)}%` : '0%', '',
        summaryTotals.totalSOs > 0 ? `${(summaryTotals.completedSOs / summaryTotals.totalSOs * 100).toFixed(2)}%` : '0%', '',
        summaryTotals.totalSOs > 0 ? `${(summaryTotals.delayedSOs / summaryTotals.totalSOs * 100).toFixed(2)}%` : '0%', '',
        'Average' // H-P
      ]);
      
      // Row 7 (Index 6): Filter items row 3
      rows.push([
        '', // A
        'From Date', formatDateToShow(appliedSummaryFromDate), '', 'Report Type', 'SO Summary Report' // B-F
      ]);

      // Row 8 (Index 7): Blank spacer
      rows.push([]);
      
      // Row 9 (Index 8): Table section header
      rows.push(['SO SUMMARY DETAILS']);
      
      // Row 10 (Index 9): Main table headers
      rows.push(['#', 'SO Number', 'Customer Name', 'Start Date', 'End Date', 'Departments Involved', 'Employees Involved', 'Activities', 'Productivity %', 'Status', 'Remarks']);

      // Data rows starting from Row 11 (Index 10)
      filteredSOMetrics.forEach((m, idx) => {
        const remarks = m.status === 'Completed' ? 'Completed Successfully'
          : m.status === 'Delayed' ? 'Slight Delay'
          : m.status === 'Active' ? 'On Track'
          : 'In Progress';
          
        rows.push([
          idx + 1,
          m.so.soNumber,
          m.so.customerName,
          formatDateToShow(m.so.startDate),
          formatDateToShow(m.so.endDate),
          (m.so.allowedDepartments || []).length || departments.filter(d => d.status === 'Active').length,
          m.totalEmployees,
          m.totalActivities,
          `${m.productivity}%`,
          m.status,
          remarks
        ]);
      });

      // Overall Summary block
      rows.push([]);
      rows.push(['OVERALL SUMMARY (SELECTED PERIOD)']);
      rows.push([
        'Total SOs', 'Active SOs', 'Completed SOs', 'Delayed SOs', 'Average Productivity', 'Total Activities', 'Total Employees Involved'
      ]);
      rows.push([
        summaryTotals.totalSOs,
        summaryTotals.activeSOs,
        summaryTotals.completedSOs,
        summaryTotals.delayedSOs,
        `${summaryTotals.avgProductivity}%`,
        summaryTotals.totalActivities,
        summaryTotals.totalEmployees
      ]);
      
      // Notes
      rows.push([]);
      rows.push(['Note:']);
      rows.push(['1. Productivity is calculated based on (Actual Time / Standard Time) * 100']);
      rows.push(['2. Status: Completed (100%), In Progress (1-99%), Active (Not Started/On Track), Delayed (Behind Schedule)']);

      const ws = XLSX.utils.aoa_to_sheet(rows);

      // Apply Merges
      ws['!merges'] = [
        // B4:F4 - REPORT FILTERS header
        { s: { r: 3, c: 1 }, e: { r: 3, c: 5 } },
        
        // H4:I4 - TOTAL SOs
        { s: { r: 3, c: 7 }, e: { r: 3, c: 8 } },
        // J4:K4 - ACTIVE SOs
        { s: { r: 3, c: 9 }, e: { r: 3, c: 10 } },
        // L4:M4 - COMPLETED SOs
        { s: { r: 3, c: 11 }, e: { r: 3, c: 12 } },
        // N4:O4 - DELAYED SOs
        { s: { r: 3, c: 13 }, e: { r: 3, c: 14 } },
        // P4:Q4 - AVG PRODUCTIVITY
        { s: { r: 3, c: 15 }, e: { r: 3, c: 16 } },
        
        // Row 5 values merges
        { s: { r: 4, c: 7 }, e: { r: 4, c: 8 } },
        { s: { r: 4, c: 9 }, e: { r: 4, c: 10 } },
        { s: { r: 4, c: 11 }, e: { r: 4, c: 12 } },
        { s: { r: 4, c: 13 }, e: { r: 4, c: 14 } },
        { s: { r: 4, c: 15 }, e: { r: 4, c: 16 } },

        // Row 6 percentage/subtext merges
        { s: { r: 5, c: 7 }, e: { r: 5, c: 8 } },
        { s: { r: 5, c: 9 }, e: { r: 5, c: 10 } },
        { s: { r: 5, c: 11 }, e: { r: 5, c: 12 } },
        { s: { r: 5, c: 13 }, e: { r: 5, c: 14 } },
        { s: { r: 5, c: 15 }, e: { r: 5, c: 16 } },

        // SO SUMMARY DETAILS header
        { s: { r: 8, c: 0 }, e: { r: 8, c: 10 } },
      ];

      // Overall Summary header merge
      const summaryHeaderIdx = 9 + filteredSOMetrics.length + 1;
      ws['!merges'].push({ s: { r: summaryHeaderIdx, c: 0 }, e: { r: summaryHeaderIdx, c: 10 } });

      // Column widths
      ws['!cols'] = [
        { wch: 6 },  // #
        { wch: 16 }, // SO Number
        { wch: 26 }, // Customer Name
        { wch: 15 }, // Start Date
        { wch: 15 }, // End Date
        { wch: 22 }, // Departments Involved
        { wch: 20 }, // Employees Involved
        { wch: 14 }, // Activities
        { wch: 16 }, // Productivity %
        { wch: 14 }, // Status
        { wch: 24 }, // Remarks
        { wch: 28 }, // Generated On/By metadata col
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'SO Summary Report');
      saveXLSX(wb, `SO_Summary_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      notify('SO Summary Report (.xlsx) downloaded!');
    } catch (e) {
      notify(`Export failed: ${e}`, 'error');
    }
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ PDF Export Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const handleSummaryPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      const now = new Date().toLocaleString('en-IN');
      const generatedBy = user?.name || 'Admin';

      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 297, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text('WORKFORCE MANAGEMENT SYSTEM  Ã¢â‚¬â€  SO SUMMARY REPORT', 14, 13);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text(`Generated By: ${generatedBy}   |   Generated On: ${now}`, 14, 23);

      doc.setTextColor(30, 30, 30);
      autoTable(doc, {
        startY: 36,
        head: [['SO No', 'Customer Name', 'Start Date', 'End Date', 'Depts', 'Employees', 'Activities', 'Actual Hrs', 'Ideal Hrs', 'Productivity %', 'Status']],
        body: filteredSOMetrics.map(m => [
          m.so.soNumber,
          m.so.customerName,
          m.so.startDate,
          m.so.endDate,
          (m.so.allowedDepartments || []).length || departments.filter(d => d.status === 'Active').length,
          m.totalEmployees,
          m.totalActivities,
          m.actualHours,
          m.idealHours,
          `${m.productivity}%`,
          m.status,
        ]),
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [240, 246, 255] },
        styles: { fontSize: 8, cellPadding: 3 },
      });

      const lastY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('SUMMARY', 14, lastY);
      autoTable(doc, {
        startY: lastY + 4,
        head: [['Total SOs', 'Active SOs', 'Inactive SOs', 'Total Employees', 'Total Activities', 'Total Actual Hours', 'Total Ideal Hours', 'Avg Productivity']],
        body: [[
          summaryTotals.totalSOs, summaryTotals.activeSOs, summaryTotals.inactiveSOs,
          summaryTotals.totalEmployees, summaryTotals.totalActivities,
          summaryTotals.totalActualHours, summaryTotals.totalIdealHours, `${summaryTotals.avgProductivity}%`,
        ]],
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 9, cellPadding: 3 },
      });

      const pc = doc.getNumberOfPages();
      for (let i = 1; i <= pc; i++) {
        doc.setPage(i); doc.setFontSize(7); doc.setTextColor(150);
        doc.text(`Page ${i} of ${pc}  Ã¢â‚¬Â¢  SO Summary Report  Ã¢â‚¬Â¢  WORKFORCE MANAGEMENT SYSTEM`, 14, 205);
      }
      savePDF(doc, `SO_Summary_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      notify('SO Summary Report (.pdf) downloaded!');
    } catch (e) {
      notify(`PDF export failed: ${e}`, 'error');
    }
  };

  // Dept XLSX
  const handleDeptXLSX = () => {
    if (!selectedSO || !deptReportData.overall) return;
    try {
      const wb = XLSX.utils.book_new();

      const rows: any[][] = [
        ['WORKFORCE MANAGEMENT SYSTEM'],
        ['DEPARTMENT-WISE SO REPORT'],
        [],
        ['SO Number', selectedSO.soNumber],
        ['Customer', selectedSO.customerName],
        ['Start Date', selectedSO.startDate],
        ['End Date', selectedSO.endDate],
        ['Status', getSoStatus(selectedSO)],
        [],
        ['Department', 'Activity', 'Actual Hours', 'Ideal Hours', 'Users Worked', 'Rework Count', 'Rework Hours', 'Productivity %'],
        ...deptReportData.details.map(d => [
          d.department,
          d.activity,
          d.actualHours,
          d.idealHours,
          d.usersWorked,
          d.reworkCount,
          d.reworkHours,
          `${d.productivity}%`
        ]),
        [],
        ['DEPARTMENT SUMMARY'],
        ['Department', 'Total Activities', 'Total Users', 'Actual Hours', 'Ideal Hours', 'Rework Count', 'Rework Hours', 'Productivity %'],
        ...deptReportData.summary.map(s => [
          s.department,
          s.totalActivities,
          s.totalUsers,
          s.actualHours,
          s.idealHours,
          s.reworkCount,
          s.reworkHours,
          `${s.productivity}%`
        ]),
        [],
        ['OVERALL SO SUMMARY'],
        ['Total Departments', 'Total Activities', 'Total Users', 'Actual Hours', 'Ideal Hours', 'Total Rework Count', 'Total Rework Hours', 'Overall Productivity'],
        [
          deptReportData.overall.totalDepartments,
          deptReportData.overall.totalActivities,
          deptReportData.overall.totalUsers,
          deptReportData.overall.actualHours,
          deptReportData.overall.idealHours,
          deptReportData.overall.reworkCount,
          deptReportData.overall.reworkHours,
          `${deptReportData.overall.productivity}%`
        ]
      ];

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [
        { wch: 24 }, { wch: 24 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, 
        { wch: 15 }, { wch: 15 }, { wch: 18 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Department-wise SO Report');
      saveXLSX(wb, `Dept_Report_${selectedSO.soNumber}.xlsx`);
      notify('Department Report (.xlsx) downloaded!');
    } catch (e) {
      notify(`Export failed: ${e}`, 'error');
    }
  };

  // Dept PDF
  const handleDeptPDF = () => {
    if (!selectedSO || !deptReportData.overall) return;
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      const now = new Date().toLocaleString('en-IN');
      const generatedBy = user?.name || 'Admin';

      // Title header
      doc.setFillColor(8, 145, 178);
      doc.rect(0, 0, 297, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14); doc.setFont('helvetica', 'bold');
      doc.text('WORKFORCE MANAGEMENT SYSTEM  Ã¢â‚¬â€  DEPARTMENT-WISE SO REPORT', 14, 12);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text(`SO: ${selectedSO.soNumber}  |  Customer: ${selectedSO.customerName}  |  Generated By: ${generatedBy}  |  On: ${now}`, 14, 22);

      // Table 1: Activity-wise Details
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('Activity-wise Details', 14, 38);

      autoTable(doc, {
        startY: 42,
        head: [['Department', 'Activity', 'Actual Hours', 'Ideal Hours', 'Users Worked', 'Rework Count', 'Rework Hours', 'Productivity %']],
        body: deptReportData.details.map(d => [
          d.department, d.activity, `${d.actualHours}h`, `${d.idealHours}h`, d.usersWorked, d.reworkCount, `${d.reworkHours}h`, `${d.productivity}%`
        ]),
        headStyles: { fillColor: [8, 145, 178], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [240, 252, 252] },
        styles: { fontSize: 8, cellPadding: 3 },
      });

      // Table 2: Department Summary
      const y2 = (doc as any).lastAutoTable.finalY + 12;
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('Department Summary', 14, y2);

      autoTable(doc, {
        startY: y2 + 4,
        head: [['Department', 'Total Activities', 'Total Users', 'Actual Hours', 'Ideal Hours', 'Rework Count', 'Rework Hours', 'Productivity %']],
        body: deptReportData.summary.map(s => [
          s.department, s.totalActivities, s.totalUsers, `${s.actualHours}h`, `${s.idealHours}h`, s.reworkCount, `${s.reworkHours}h`, `${s.productivity}%`
        ]),
        headStyles: { fillColor: [8, 145, 178], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [240, 252, 252] },
        styles: { fontSize: 8, cellPadding: 3 },
      });

      // Table 3: Overall SO Summary
      const y3 = (doc as any).lastAutoTable.finalY + 12;
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('Overall SO Summary', 14, y3);

      autoTable(doc, {
        startY: y3 + 4,
        head: [['Total Departments', 'Total Activities', 'Total Users', 'Actual Hours', 'Ideal Hours', 'Total Rework Count', 'Total Rework Hours', 'Overall Productivity']],
        body: [[
          deptReportData.overall.totalDepartments,
          deptReportData.overall.totalActivities,
          deptReportData.overall.totalUsers,
          `${deptReportData.overall.actualHours}h`,
          `${deptReportData.overall.idealHours}h`,
          deptReportData.overall.reworkCount,
          `${deptReportData.overall.reworkHours}h`,
          `${deptReportData.overall.productivity}%`
        ]],
        headStyles: { fillColor: [8, 145, 178], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 8.5, cellPadding: 3 },
      });

      const pc = doc.getNumberOfPages();
      for (let i = 1; i <= pc; i++) {
        doc.setPage(i); doc.setFontSize(7); doc.setTextColor(150);
        doc.text(`Page ${i} of ${pc}  Ã¢â‚¬Â¢  Department-wise Report  Ã¢â‚¬Â¢  WORKFORCE MANAGEMENT SYSTEM`, 14, 205);
      }

      savePDF(doc, `Dept_Report_${selectedSO.soNumber}.pdf`);
      notify('Department Report (.pdf) downloaded!');
    } catch (e) {
      notify(`PDF failed: ${e}`, 'error');
    }
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Individual Employee XLSX Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  // Generates a per-employee Excel report with 5 sections matching the screenshot
  const handleIndividualEmpXLSX = (empId: string) => {
    if (!selMetrics) return;
    try {
      // Gather all logs for this employee across ALL SOs
      const empLogs = activityLogs.filter((l: any) => {
        const logEmpId = l.user?.employeeId || l.userId || 'Unknown';
        return logEmpId === empId;
      });

      if (empLogs.length === 0) {
        notify('No activity logs found for this employee.', 'error');
        return;
      }

      // Resolve basic employee info from logs
      const firstLog = empLogs[0] as any;
      const empName = firstLog.user
        ? `${firstLog.user.firstName || ''} ${firstLog.user.lastName || ''}`.trim()
        : (firstLog.workerName || empId);
      const empDept = firstLog.department?.name || firstLog.department || '';
      const empRole = firstLog.user?.role || '';
      const empStatus = firstLog.user?.status || 'Active';

      // Period label
      const now = new Date();
      const periodLabel = `Monthly - ${now.toLocaleString('en-IN', { month: 'long' })} ${now.getFullYear()}`;

      const wb = XLSX.utils.book_new();

      // Ã¢â€â‚¬Ã¢â€â‚¬ Build rows Ã¢â€â‚¬Ã¢â€â‚¬
      const rows: any[][] = [];

      // Title
      rows.push(['WORKFORCE MANAGEMENT SYSTEM']);
      rows.push(['INDIVIDUAL EMPLOYEE PERFORMANCE REPORT']);
      rows.push([]);
      rows.push(['Employee', empId]);
      rows.push(['Employee', empName]);
      rows.push(['Period', periodLabel]);
      rows.push([]);

      // Ã¢â€â‚¬Ã¢â€â‚¬ SECTION 1: Employee Information Ã¢â€â‚¬Ã¢â€â‚¬
      rows.push(['SECTION 1: EMPLOYEE INFORMATION']);
      rows.push(['Field', 'Value']);
      rows.push(['Employee ID', empId]);
      rows.push(['Employee Name', empName]);
      rows.push(['Department', empDept]);
      rows.push(['Role', empRole]);
      rows.push(['Status', empStatus]);
      rows.push([]);

      // Ã¢â€â‚¬Ã¢â€â‚¬ SECTION 2: Detailed Work History Ã¢â€â‚¬Ã¢â€â‚¬
      rows.push(['SECTION 2: DETAILED WORK HISTORY']);
      rows.push([
        'Date', 'SO Number', 'Department', 'Activity',
        'Start Time', 'End Time', 'Hours Worked', 'Ideal Hours',
        'Productivity %', 'Rework Count', 'Rework Duration (Hrs)',
      ]);

      let totalReworkCount = 0;
      let totalReworkMins = 0;
      const soSet = new Set<string>();
      const deptMap = new Map<string, { activities: number; actualMins: number; idealMins: number }>();
      const soMap = new Map<string, { activities: number; actualMins: number; idealMins: number }>();

      empLogs.forEach((l: any) => {
        const logDate = l.date || (l.createdAt ? l.createdAt.split('T')[0] : '');
        const soNum = l.soNumber || l.SalesOrder?.soNumber || '';
        const dept = l.department?.name || l.department || '';
        const act = l.activity?.activityName || l.activity || '';
        const startT = l.startTime || '';
        const endT = l.endTime || '';
        const actualMins = l.durationMinutes || 0;
        const idealMins = l.standardManMinutes || activityIdealMinutesMap.get(`${dept}::${act}`) || 0;
        const actualHrs = Math.round(actualMins / 60 * 10) / 10;
        const idealHrs = Math.round(idealMins / 60 * 10) / 10;
        const productivity = actualMins > 0 ? Math.round((idealMins / actualMins) * 100) : 0;
        const isRework = (l.remarks || '').toLowerCase().includes('rework');
        const reworkCount = isRework ? 1 : 0;
        const reworkDurationHrs = isRework ? actualHrs : 0;

        if (isRework) {
          totalReworkCount += 1;
          totalReworkMins += actualMins;
        }
        if (soNum) soSet.add(soNum);

        // dept contribution
        if (dept) {
          const d = deptMap.get(dept) || { activities: 0, actualMins: 0, idealMins: 0 };
          d.activities += 1;
          d.actualMins += actualMins;
          d.idealMins += idealMins;
          deptMap.set(dept, d);
        }

        // SO contribution
        if (soNum) {
          const s = soMap.get(soNum) || { activities: 0, actualMins: 0, idealMins: 0 };
          s.activities += 1;
          s.actualMins += actualMins;
          s.idealMins += idealMins;
          soMap.set(soNum, s);
        }

        rows.push([
          logDate, soNum, dept, act,
          startT, endT, actualHrs, idealHrs,
          `${productivity}%`, reworkCount, reworkDurationHrs,
        ]);
      });

      rows.push([]);

      // Ã¢â€â‚¬Ã¢â€â‚¬ SECTION 3: Performance Summary Ã¢â€â‚¬Ã¢â€â‚¬
      const totalActualMins = empLogs.reduce((s: number, l: any) => s + (l.durationMinutes || 0), 0);
      const totalIdealMins = empLogs.reduce((s: number, l: any) => {
        const dept = l.department?.name || l.department || '';
        const act = l.activity?.activityName || l.activity || '';
        return s + (l.standardManMinutes || activityIdealMinutesMap.get(`${dept}::${act}`) || 0);
      }, 0);
      const totalActualHrs = Math.round(totalActualMins / 60 * 10) / 10;
      const totalIdealHrs = Math.round(totalIdealMins / 60 * 10) / 10;
      const avgWorkHrs = empLogs.length > 0 ? Math.round(totalActualHrs / empLogs.length * 10) / 10 : 0;
      const utilization = totalIdealMins > 0 && totalActualMins > 0 ? Math.round((totalIdealMins / totalActualMins) * 100) : 0;
      const avgProductivity = utilization;
      const totalReworkHrs = Math.round(totalReworkMins / 60 * 10) / 10;

      rows.push(['SECTION 3: PERFORMANCE SUMMARY']);
      rows.push(['Metric', 'Value']);
      rows.push(['Total SOs Worked', soSet.size]);
      rows.push(['Total Activities', empLogs.length]);
      rows.push(['Total Work Hours', `${totalActualHrs} Hours`]);
      rows.push(['Average Work Hours', `${avgWorkHrs} Hours`]);
      rows.push(['Expected Hours (Ideal)', `${totalIdealHrs} Hours`]);
      rows.push(['Utilization %', `${utilization}%`]);
      rows.push(['Average Productivity %', `${avgProductivity}%`]);
      rows.push(['Total Rework Count', totalReworkCount]);
      rows.push(['Total Rework Hours', `${totalReworkHrs} Hours`]);
      rows.push([]);

      // Ã¢â€â‚¬Ã¢â€â‚¬ SECTION 4: Department-wise Contribution Ã¢â€â‚¬Ã¢â€â‚¬
      rows.push(['SECTION 4: DEPARTMENT-WISE CONTRIBUTION']);
      rows.push(['Department', 'Activities', 'Hours Worked', 'Productivity %']);
      deptMap.forEach((v, dept) => {
        const hrs = Math.round(v.actualMins / 60 * 10) / 10;
        const prod = v.actualMins > 0 ? Math.round((v.idealMins / v.actualMins) * 100) : 0;
        rows.push([dept, v.activities, `${hrs}`, `${prod}%`]);
      });
      rows.push([]);

      // Ã¢â€â‚¬Ã¢â€â‚¬ SECTION 5: SO-wise Contribution Ã¢â€â‚¬Ã¢â€â‚¬
      rows.push(['SECTION 5: SO-WISE CONTRIBUTION']);
      rows.push(['SO Number', 'Activities', 'Hours Worked', 'Productivity %']);
      soMap.forEach((v, soNum) => {
        const hrs = Math.round(v.actualMins / 60 * 10) / 10;
        const prod = v.actualMins > 0 ? Math.round((v.idealMins / v.actualMins) * 100) : 0;
        rows.push([soNum, v.activities, `${hrs}`, `${prod}%`]);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [
        { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 24 },
        { wch: 13 }, { wch: 13 }, { wch: 14 }, { wch: 13 },
        { wch: 15 }, { wch: 14 }, { wch: 20 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Individual Employee Report');
      saveXLSX(wb, `Individual_Employee_Report_${empId}_${new Date().toISOString().split('T')[0]}.xlsx`);
      notify(`Individual Report for ${empId} downloaded!`);
    } catch (e) {
      notify(`Export failed: ${e}`, 'error');
    }
  };

  // Emp XLSX
  const handleEmpXLSX = () => {
    if (!selectedSO || !empReportData.overall) return;
    try {
      const wb = XLSX.utils.book_new();

      const rows: any[][] = [
        ['WORKFORCE MANAGEMENT SYSTEM'],
        ['EMPLOYEE-WISE SO REPORT'],
        [],
        ['SO Number', selectedSO.soNumber],
        ['Customer Name', selectedSO.customerName],
        ['Start Date', selectedSO.startDate],
        ['End Date', selectedSO.endDate],
        ['Status', getSoStatus(selectedSO)],
        [],
        ['Employee ID', 'Employee Name', 'Department', 'Activity', 'Hours Worked', 'Ideal Hours', 'Productivity %'],
        ...empReportData.details.map(e => [
          e.employeeId,
          e.name,
          e.department,
          e.activity,
          e.actualHours,
          e.idealHours,
          `${e.productivity}%`
        ]),
        [],
        ['EMPLOYEE SUMMARY'],
        ['Employee ID', 'Employee Name', 'Department', 'Total Activities', 'Total Hours Worked', 'Ideal Hours', 'Productivity %'],
        ...empReportData.summary.map(s => [
          s.employeeId,
          s.name,
          s.department,
          s.totalActivities,
          s.actualHours,
          s.idealHours,
          `${s.productivity}%`
        ]),
        [],
        ['OVERALL SO SUMMARY'],
        ['Total Employees', 'Total Activities', 'Total Hours Worked', 'Total Ideal Hours', 'Average Productivity'],
        [
          empReportData.overall.totalEmployees,
          empReportData.overall.totalActivities,
          empReportData.overall.actualHours,
          empReportData.overall.idealHours,
          `${empReportData.overall.productivity}%`
        ]
      ];

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [
        { wch: 16 }, { wch: 24 }, { wch: 20 }, { wch: 24 }, { wch: 15 }, 
        { wch: 15 }, { wch: 18 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Employee-wise SO Report');
      saveXLSX(wb, `Emp_Report_${selectedSO.soNumber}.xlsx`);
      notify('Employee Report (.xlsx) downloaded!');
    } catch (e) {
      notify(`Export failed: ${e}`, 'error');
    }
  };

  // Emp PDF
  const handleEmpPDF = () => {
    if (!selectedSO || !empReportData.overall) return;
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      const now = new Date().toLocaleString('en-IN');
      const generatedBy = user?.name || 'Admin';

      // Title header
      doc.setFillColor(139, 92, 246);
      doc.rect(0, 0, 297, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14); doc.setFont('helvetica', 'bold');
      doc.text('WORKFORCE MANAGEMENT SYSTEM  Ã¢â‚¬â€  EMPLOYEE-WISE SO REPORT', 14, 12);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text(`SO: ${selectedSO.soNumber}  |  Customer: ${selectedSO.customerName}  |  Generated By: ${generatedBy}  |  On: ${now}`, 14, 22);

      // Table 1: Employee Activity-wise Details
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('Employee Activity-wise Details', 14, 38);

      autoTable(doc, {
        startY: 42,
        head: [['Emp ID', 'Employee Name', 'Department', 'Activity', 'Hours Worked', 'Ideal Hours', 'Productivity %']],
        body: empReportData.details.map(e => [
          e.employeeId, e.name, e.department, e.activity, `${e.actualHours}h`, `${e.idealHours}h`, `${e.productivity}%`
        ]),
        headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [250, 245, 255] },
        styles: { fontSize: 8, cellPadding: 3 },
      });

      // Table 2: Employee Summary
      const y2 = (doc as any).lastAutoTable.finalY + 12;
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('Employee Summary', 14, y2);

      autoTable(doc, {
        startY: y2 + 4,
        head: [['Emp ID', 'Employee Name', 'Department', 'Total Activities', 'Total Hours Worked', 'Ideal Hours', 'Productivity %']],
        body: empReportData.summary.map(s => [
          s.employeeId, s.name, s.department, s.totalActivities, `${s.actualHours}h`, `${s.idealHours}h`, `${s.productivity}%`
        ]),
        headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [250, 245, 255] },
        styles: { fontSize: 8, cellPadding: 3 },
      });

      // Table 3: Overall SO Summary
      const y3 = (doc as any).lastAutoTable.finalY + 12;
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('Overall SO Summary', 14, y3);

      autoTable(doc, {
        startY: y3 + 4,
        head: [['Total Employees', 'Total Activities', 'Total Hours Worked', 'Total Ideal Hours', 'Average Productivity']],
        body: [[
          empReportData.overall.totalEmployees,
          empReportData.overall.totalActivities,
          `${empReportData.overall.actualHours}h`,
          `${empReportData.overall.idealHours}h`,
          `${empReportData.overall.productivity}%`
        ]],
        headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 8.5, cellPadding: 3 },
      });

      const pc = doc.getNumberOfPages();
      for (let i = 1; i <= pc; i++) {
        doc.setPage(i); doc.setFontSize(7); doc.setTextColor(150);
        doc.text(`Page ${i} of ${pc}  Ã¢â‚¬Â¢  Employee-wise Report  Ã¢â‚¬Â¢  WORKFORCE MANAGEMENT SYSTEM`, 14, 205);
      }

      savePDF(doc, `Emp_Report_${selectedSO.soNumber}.pdf`);
      notify('Employee Report (.pdf) downloaded!');
    } catch (e) {
      notify(`PDF failed: ${e}`, 'error');
    }
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Filter / Export Bar Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const FilterExportBar = ({ tab }: { tab: number }) => (
    <Box sx={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      flexWrap: 'wrap', gap: 2, mb: 3, p: 2, borderRadius: 3,
      border: '1px solid', borderColor: 'divider',
      bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.012)',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <FilterIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Filters</Typography>
        </Box>
        {tab === 0 ? (
          <TextField select size="small" label="Status" value={summaryStatus}
            onChange={e => setSummaryStatus(e.target.value)} sx={{ minWidth: 130 }}
            slotProps={{ input: { sx: { borderRadius: 2, fontSize: '0.85rem' } } }}>
            {['All', 'Active', 'Inactive', 'Completed', 'Delayed'].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
          </TextField>
        ) : (
          <>
            <TextField select size="small" label="Period" value={periodFilter}
              onChange={e => setPeriodFilter(e.target.value)} sx={{ minWidth: 130 }}
              slotProps={{ input: { sx: { borderRadius: 2, fontSize: '0.85rem' } } }}>
              {['All', 'Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom Range'].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </TextField>
            {tab === 1 && (
              <TextField select size="small" label="Department" value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)} sx={{ minWidth: 150 }}
                slotProps={{ input: { sx: { borderRadius: 2, fontSize: '0.85rem' } } }}>
                {activeDepts.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </TextField>
            )}
            <TextField type="date" size="small" label="From Date" value={fromDate}
              disabled={periodFilter !== 'Custom Range'}
              onChange={e => setFromDate(e.target.value)} sx={{ minWidth: 155 }}
              slotProps={{ inputLabel: { shrink: true }, input: { sx: { borderRadius: 2, fontSize: '0.85rem' }, startAdornment: <InputAdornment position="start"><CalendarIcon sx={{ fontSize: 15, color: 'text.secondary' }} /></InputAdornment> } }} />
            <TextField type="date" size="small" label="To Date" value={toDate}
              disabled={periodFilter !== 'Custom Range'}
              onChange={e => setToDate(e.target.value)} sx={{ minWidth: 155 }}
              slotProps={{ inputLabel: { shrink: true }, input: { sx: { borderRadius: 2, fontSize: '0.85rem' }, startAdornment: <InputAdornment position="start"><CalendarIcon sx={{ fontSize: 15, color: 'text.secondary' }} /></InputAdornment> } }} />
            <Button size="small" variant="contained" onClick={handleApplyFilters}
              sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', px: 2, py: 1, height: 40, bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}>
              Apply
            </Button>
            <Button size="small" variant="outlined" onClick={handleClearFilters}
              sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', px: 2, py: 1, height: 40, color: 'text.secondary', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}>
              Clear
            </Button>
          </>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <ExportIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Export</Typography>
        </Box>
        <Button size="small" variant="outlined" startIcon={<ExcelIcon sx={{ color: '#10B981', fontSize: '1rem' }} />}
          onClick={tab === 0 ? handleSummaryXLSX : tab === 1 ? handleDeptXLSX : handleEmpXLSX}
          sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', fontSize: '0.8rem', borderColor: 'rgba(16,185,129,0.4)', color: '#10B981', '&:hover': { borderColor: '#10B981', bgcolor: 'rgba(16,185,129,0.06)' } }}>
          Download Excel (.xlsx)
        </Button>
        <Button size="small" variant="outlined" startIcon={<PdfIcon sx={{ color: '#EF4444', fontSize: '1rem' }} />}
          onClick={tab === 0 ? handleSummaryPDF : tab === 1 ? handleDeptPDF : handleEmpPDF}
          sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', fontSize: '0.8rem', borderColor: 'rgba(239,68,68,0.4)', color: '#EF4444', '&:hover': { borderColor: '#EF4444', bgcolor: 'rgba(239,68,68,0.06)' } }}>
          Download PDF (.pdf)
        </Button>
      </Box>
    </Box>
  );

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Chart styles Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const gridStroke = themeMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const tooltipStyle = { backgroundColor: themeMode === 'dark' ? '#1F2937' : '#fff', borderRadius: 8, border: '1px solid rgba(139,92,246,0.15)', fontSize: 12 };

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Selected SO info for tabs 2/3 Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const soStatus = selectedSO ? getSoStatus(selectedSO) : 'Active';
  const sc = STATUS_COLORS[soStatus] || STATUS_COLORS.Active;
  const isOverdue = selectedSO?.endDate && selectedSO.endDate < today;

  return (
    <Box>
      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: 3, fontWeight: 700 }}>{snackbar.message}</Alert>
      </Snackbar>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Page Header Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/so-management')}
          sx={{ fontWeight: 700, textTransform: 'none', color: 'text.secondary', borderRadius: 2.5, '&:hover': { color: 'primary.main', bgcolor: 'action.hover' } }}>
          Back to Registry
        </Button>
        {/* SO Selector â€” relevant for dept/emp tabs */}
        {salesOrders.length > 0 && dashboardTab !== 0 && (
          <TextField select size="small" label="Select SO for Report" value={selectedSO?.soNumber || ''}
            onChange={e => navigate(`/so-reports/${e.target.value}`)}
            sx={{ minWidth: 280 }}
            slotProps={{ input: { sx: { borderRadius: 2.5 }, startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: 'text.secondary' }} /></InputAdornment> } }}>
            {salesOrders.map(s => (
              <MenuItem key={s.soNumber} value={s.soNumber}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'ui-monospace, monospace' }}>{s.soNumber}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{s.customerName}</Typography>
                </Box>
              </MenuItem>
            ))}
          </TextField>
        )}
      </Box>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Selected SO compact info bar Ã¢â‚¬â€ only for dept/emp tabs Ã¢â€â‚¬Ã¢â€â‚¬ */}
      {selectedSO && dashboardTab !== 0 && (
        <Card sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography sx={{ fontWeight: 900, fontFamily: 'ui-monospace, monospace', fontSize: '1rem' }}>{selectedSO.soNumber}</Typography>
              <Chip label={soStatus} size="small" sx={{ fontWeight: 800, fontSize: '0.7rem', bgcolor: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }} />
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Customer</Typography>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedSO.customerName}</Typography>
            </Box>
            {selectedSO.projectName && <><Divider orientation="vertical" flexItem /><Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Project</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedSO.projectName}</Typography>
            </Box></>}
            <Divider orientation="vertical" flexItem />
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Start</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedSO.startDate}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>End</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: isOverdue ? 'error.main' : 'inherit' }}>{selectedSO.endDate}</Typography>
              </Box>
            </Box>
            {selMetrics && (
              <>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LinearProgress variant="determinate" value={selMetrics.progressPct} sx={{
                    width: 100, height: 5, borderRadius: 3,
                    bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #8B5CF6, #06B6D4)', borderRadius: 3 }
                  }} />
                  <Typography variant="caption" sx={{ fontWeight: 800 }}>{selMetrics.progressPct}%</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{selMetrics.completedActivities}/{selMetrics.totalActivities} acts</Typography>
                </Box>
              </>
            )}
          </Box>
        </Card>
      )}

      {/* â”€â”€ Main Report Card â”€â”€ */}
      <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tabs value={dashboardTab} onChange={(_, v) => setDashboardTab(v)}
            sx={{ '& .MuiTab-root': { fontWeight: 700, fontSize: '0.88rem', textTransform: 'none', px: 3, py: 2 } }}>
            <Tab label="SO Summary Report" />
            <Tab label="Department-wise Report" />
            <Tab label="Employee-wise Report" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {dashboardTab === 0 && (
            <>
              {/* Header Block */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                  SO Summary Report
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  View summary of all Sales Orders with overall productivity and status overview.
                </Typography>
              </Box>

              {/* Report Filters Panel */}
              <Card variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 3, borderColor: 'divider', bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.01)' : '#fff' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>
                  Report Filters
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2.5 }}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.75, color: 'text.secondary' }}>
                      Search
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search by SO Number or Customer"
                      value={summarySearch}
                      onChange={e => setSummarySearch(e.target.value)}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                            </InputAdornment>
                          ),
                          sx: { borderRadius: 2 }
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 2.25 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.75, color: 'text.secondary' }}>
                      Status
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={summaryStatus}
                      onChange={e => setSummaryStatus(e.target.value)}
                      slotProps={{ input: { sx: { borderRadius: 2 } } }}
                    >
                      {['All', 'Active', 'In Progress', 'Completed', 'Delayed'].map(o => (
                        <MenuItem key={o} value={o}>{o}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 2.25 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.75, color: 'text.secondary' }}>
                      Period
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={summaryPeriod}
                      onChange={e => setSummaryPeriod(e.target.value)}
                      slotProps={{ input: { sx: { borderRadius: 2 } } }}
                    >
                      {['All', 'Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom Range'].map(o => (
                        <MenuItem key={o} value={o}>{o}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 2.25 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.75, color: 'text.secondary' }}>
                      From Date
                    </Typography>
                    <TextField
                      type="date"
                      fullWidth
                      size="small"
                      value={summaryFromDate}
                      disabled={summaryPeriod !== 'Custom Range'}
                      onChange={e => setSummaryFromDate(e.target.value)}
                      slotProps={{ inputLabel: { shrink: true }, input: { sx: { borderRadius: 2 } } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 2.25 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.75, color: 'text.secondary' }}>
                      To Date
                    </Typography>
                    <TextField
                      type="date"
                      fullWidth
                      size="small"
                      value={summaryToDate}
                      disabled={summaryPeriod !== 'Custom Range'}
                      onChange={e => setSummaryToDate(e.target.value)}
                      slotProps={{ inputLabel: { shrink: true }, input: { sx: { borderRadius: 2 } } }}
                    />
                  </Grid>
                </Grid>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: 2,
                      color: 'text.secondary',
                      borderColor: 'divider',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    + More Filters
                  </Button>
                  
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<SearchIcon sx={{ fontSize: 16 }} />}
                      onClick={handleApplySummaryFilters}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        borderRadius: 2,
                        px: 3,
                        py: 1,
                        bgcolor: '#5B21B6',
                        '&:hover': { bgcolor: '#4C1D95' }
                      }}
                    >
                      Preview Report
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ExcelIcon sx={{ fontSize: 16 }} />}
                      onClick={handleSummaryXLSX}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        borderRadius: 2,
                        px: 2.5,
                        py: 1,
                        borderColor: '#10B981',
                        color: '#10B981',
                        '&:hover': { bgcolor: 'rgba(16,185,129,0.06)', borderColor: '#059669' }
                      }}
                    >
                      Download Excel
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PdfIcon sx={{ fontSize: 16 }} />}
                      onClick={handleSummaryPDF}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        borderRadius: 2,
                        px: 2.5,
                        py: 1,
                        borderColor: '#EF4444',
                        color: '#EF4444',
                        '&:hover': { bgcolor: 'rgba(239,68,68,0.06)', borderColor: '#DC2626' }
                      }}
                    >
                      Download PDF
                    </Button>
                  </Box>
                </Box>
              </Card>

              {/* KPI summary metrics row */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Active SOs */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: 3.5,
                      borderColor: 'rgba(37, 99, 235, 0.15)',
                      bgcolor: themeMode === 'dark' ? 'rgba(37, 99, 235, 0.02)' : 'rgba(37, 99, 235, 0.01)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2.5,
                      height: '100%'
                    }}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: 'rgba(37, 99, 235, 0.08)',
                        color: '#2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <AssignIcon sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 850, color: 'text.secondary', display: 'block', mb: 0.25 }}>
                        Active SOs
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#2563EB', lineHeight: 1.1, mb: 0.5 }}>
                        {summaryTotals.activeSOs}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 650 }}>
                        {summaryTotals.totalSOs > 0
                          ? `${(summaryTotals.activeSOs / summaryTotals.totalSOs * 100).toFixed(2)}% of total`
                          : '0.00% of total'}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                {/* Completed SOs */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: 3.5,
                      borderColor: 'rgba(16, 185, 129, 0.15)',
                      bgcolor: themeMode === 'dark' ? 'rgba(16, 185, 129, 0.02)' : 'rgba(16, 185, 129, 0.01)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2.5,
                      height: '100%'
                    }}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: 'rgba(16, 185, 129, 0.08)',
                        color: '#10B981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <CheckCircleIcon sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 850, color: 'text.secondary', display: 'block', mb: 0.25 }}>
                        Completed SOs
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#10B981', lineHeight: 1.1, mb: 0.5 }}>
                        {summaryTotals.completedSOs}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 650 }}>
                        {summaryTotals.totalSOs > 0
                          ? `${(summaryTotals.completedSOs / summaryTotals.totalSOs * 100).toFixed(2)}% of total`
                          : '0.00% of total'}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                {/* Delayed SOs */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: 3.5,
                      borderColor: 'rgba(245, 158, 11, 0.15)',
                      bgcolor: themeMode === 'dark' ? 'rgba(245, 158, 11, 0.02)' : 'rgba(245, 158, 11, 0.01)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2.5,
                      height: '100%'
                    }}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: 'rgba(245, 158, 11, 0.08)',
                        color: '#F59E0B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <AccessTimeIcon sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 850, color: 'text.secondary', display: 'block', mb: 0.25 }}>
                        Delayed SOs
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#F59E0B', lineHeight: 1.1, mb: 0.5 }}>
                        {summaryTotals.delayedSOs}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 650 }}>
                        {summaryTotals.totalSOs > 0
                          ? `${(summaryTotals.delayedSOs / summaryTotals.totalSOs * 100).toFixed(2)}% of total`
                          : '0.00% of total'}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                {/* Overall Productivity */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: 3.5,
                      borderColor: 'rgba(139, 92, 246, 0.15)',
                      bgcolor: themeMode === 'dark' ? 'rgba(139, 92, 246, 0.02)' : 'rgba(139, 92, 246, 0.01)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2.5,
                      height: '100%'
                    }}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: 'rgba(139, 92, 246, 0.08)',
                        color: '#8B5CF6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <TrendingUpIcon sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 850, color: 'text.secondary', display: 'block', mb: 0.25 }}>
                        Overall Productivity
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#8B5CF6', lineHeight: 1.1, mb: 0.5 }}>
                        {summaryTotals.avgProductivity}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 650 }}>
                        Average productivity
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              {/* SO Summary Header */}
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  SO Summary
                </Typography>
              </Box>

              {/* SO Table */}
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider', overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                    <TableRow>
                      {['SO Number', 'Customer Name', 'Start Date', 'End Date', 'Departments', 'Employees', 'Activities', 'Productivity %', 'Status', ''].map((h, index) => (
                        <TableCell key={index} sx={{ fontWeight: 800, fontSize: '0.78rem', py: 1.5, whiteSpace: 'nowrap' }} align={h === '' ? 'right' : 'left'}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredSOMetrics.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                            No Sales Orders match the selected filter.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSOMetrics.map((m, i) => {
                        const s = STATUS_COLORS[m.status] || STATUS_COLORS.Active;
                        return (
                          <TableRow key={i} sx={{ '&:hover': { bgcolor: 'action.hover' }, transition: 'background-color 0.15s' }}>
                            <TableCell sx={{ fontFamily: 'ui-monospace, monospace', fontWeight: 800, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                              <Button
                                onClick={() => navigate(`/so-reports/${m.so.soNumber}`)}
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
                                {m.so.soNumber}
                              </Button>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                              {m.so.customerName}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 650, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                              {formatDateToShow(m.so.startDate)}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 650, color: m.status === 'Delayed' ? 'error.main' : 'text.secondary', whiteSpace: 'nowrap' }}>
                              {formatDateToShow(m.so.endDate)}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', pl: 3.5 }}>
                              {(m.so.allowedDepartments || []).length || departments.filter(d => d.status === 'Active').length}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', pl: 3.5 }}>
                              {m.totalEmployees}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', pl: 3.5 }}>
                              {m.totalActivities}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 800, minWidth: 35, color: m.productivity >= 90 ? '#10B981' : m.productivity >= 70 ? '#F59E0B' : '#EF4444' }}>
                                  {m.productivity}%
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(m.productivity, 100)}
                                  sx={{
                                    width: 60,
                                    height: 6,
                                    borderRadius: 3,
                                    bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                    '& .MuiLinearProgress-bar': {
                                      bgcolor: m.productivity >= 90 ? '#10B981' : m.productivity >= 70 ? '#F59E0B' : '#EF4444',
                                      borderRadius: 3,
                                    }
                                  }}
                                />
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={m.status}
                                size="small"
                                sx={{
                                  fontWeight: 800,
                                  fontSize: '0.72rem',
                                  bgcolor: s.bg,
                                  color: s.color,
                                  border: `1px solid ${s.border}`
                                }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton size="small" onClick={() => navigate(`/so-reports/${m.so.soNumber}`)}>
                                <MoreVertIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Overall Summary Row */}
              <Box sx={{ mt: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden', bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)' }}>
                <Box sx={{ p: 2, bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    Overall Summary (Selected Period)
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', p: 2.5, gap: 2 }}>
                  {[
                    { label: 'Total SOs', value: summaryTotals.totalSOs },
                    { label: 'Active SOs', value: summaryTotals.activeSOs },
                    { label: 'Completed SOs', value: summaryTotals.completedSOs },
                    { label: 'Delayed SOs', value: summaryTotals.delayedSOs },
                    { label: 'Average Productivity', value: `${summaryTotals.avgProductivity}%` },
                    { label: 'Total Activities', value: summaryTotals.totalActivities.toLocaleString() },
                    { label: 'Total Employees Involved', value: summaryTotals.totalEmployees.toLocaleString() },
                  ].map((item, index) => (
                    <Box key={index} sx={{ textAlign: 'center', px: 2, flex: 1, minWidth: 120, borderRight: index < 6 ? '1px solid' : 'none', borderColor: 'divider' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                        {item.label}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary' }}>
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </>
          )}

          {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
          {/* TAB 1: DEPARTMENT-WISE REPORT                             */}
          {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
          {dashboardTab === 1 && (
            <>
              <FilterExportBar tab={1} />
              {!selectedSO || deptReportData.details.length === 0 ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <BuildingIcon sx={{ fontSize: 52, color: 'text.disabled', mb: 1.5 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary' }}>No Department Data Available</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 600 }}>No activity logs have been recorded for this Sales Order yet.</Typography>
                </Box>
              ) : (
                <>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: 'divider', bgcolor: 'transparent', mb: 4 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>Department Progress</Typography>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={deptMetrics} margin={{ top: 0, right: 16, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="department" tick={{ fontSize: 11, fontWeight: 600 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <ChartTooltip contentStyle={tooltipStyle} />
                        <Legend />
                        <Bar dataKey="completedActivities" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="totalActivities" name="Total" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>

                  {/* Section 1: Detailed Table */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BuildingIcon color="primary" sx={{ fontSize: 20 }} />
                      Activity-wise Details
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(8,145,178,0.04)' }}>
                          <TableRow>
                            {['Department', 'Activity', 'Actual Hours', 'Ideal Hours', 'Users Worked', 'Rework Count', 'Rework Hours', 'Productivity %'].map(h => (
                              <TableCell key={h} sx={{ fontWeight: 800, fontSize: '0.75rem', py: 1.5 }}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {deptReportData.details.map((d, i) => (
                            <TableRow key={i} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                              <TableCell sx={{ fontWeight: 700 }}>{d.department}</TableCell>
                              <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{d.activity}</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{d.actualHours}h</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{d.idealHours}h</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{d.usersWorked}</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{d.reworkCount}</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{d.reworkHours}h</TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>
                                <Chip label={`${d.productivity}%`} size="small" sx={{
                                  fontWeight: 800, fontSize: '0.75rem',
                                  bgcolor: d.productivity >= 90 ? 'rgba(16,185,129,0.12)' : d.productivity >= 70 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                                  color: d.productivity >= 90 ? '#10B981' : d.productivity >= 70 ? '#F59E0B' : '#EF4444',
                                }} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  {/* Section 2: Department Summary */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BuildingIcon color="secondary" sx={{ fontSize: 20 }} />
                      Department Summary
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(139,92,246,0.04)' }}>
                          <TableRow>
                            {['Department', 'Total Activities', 'Total Users', 'Actual Hours', 'Ideal Hours', 'Rework Count', 'Rework Hours', 'Productivity %'].map(h => (
                              <TableCell key={h} sx={{ fontWeight: 800, fontSize: '0.75rem', py: 1.5 }}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {deptReportData.summary.map((s, i) => (
                            <TableRow key={i} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                              <TableCell sx={{ fontWeight: 700 }}>{s.department}</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{s.totalActivities}</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{s.totalUsers}</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{s.actualHours}h</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{s.idealHours}h</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{s.reworkCount}</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{s.reworkHours}h</TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>
                                <Chip label={`${s.productivity}%`} size="small" sx={{
                                  fontWeight: 800, fontSize: '0.75rem',
                                  bgcolor: s.productivity >= 90 ? 'rgba(16,185,129,0.12)' : s.productivity >= 70 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                                  color: s.productivity >= 90 ? '#10B981' : s.productivity >= 70 ? '#F59E0B' : '#EF4444',
                                }} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  {/* Section 3: Overall SO Summary */}
                  {deptReportData.overall && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AssignIcon color="primary" sx={{ fontSize: 20 }} />
                        Overall SO Summary
                      </Typography>
                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
                            <TableRow>
                              {['Total Departments', 'Total Activities', 'Total Users', 'Actual Hours', 'Ideal Hours', 'Total Rework Count', 'Total Rework Hours', 'Overall Productivity'].map(h => (
                                <TableCell key={h} sx={{ fontWeight: 800, fontSize: '0.75rem', py: 1.5 }}>{h}</TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)' }}>
                              <TableCell sx={{ fontWeight: 800, fontSize: '0.9rem' }}>{deptReportData.overall.totalDepartments}</TableCell>
                              <TableCell sx={{ fontWeight: 800, fontSize: '0.9rem', textAlign: 'center' }}>{deptReportData.overall.totalActivities}</TableCell>
                              <TableCell sx={{ fontWeight: 800, fontSize: '0.9rem', textAlign: 'center' }}>{deptReportData.overall.totalUsers}</TableCell>
                              <TableCell sx={{ fontWeight: 800, fontSize: '0.9rem', textAlign: 'center', color: 'primary.main' }}>{deptReportData.overall.actualHours}h</TableCell>
                              <TableCell sx={{ fontWeight: 800, fontSize: '0.9rem', textAlign: 'center' }}>{deptReportData.overall.idealHours}h</TableCell>
                              <TableCell sx={{ fontWeight: 800, fontSize: '0.9rem', textAlign: 'center' }}>{deptReportData.overall.reworkCount}</TableCell>
                              <TableCell sx={{ fontWeight: 800, fontSize: '0.9rem', textAlign: 'center' }}>{deptReportData.overall.reworkHours}h</TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>
                                <Chip label={`${deptReportData.overall.productivity}%`} size="medium" sx={{
                                  fontWeight: 900, fontSize: '0.85rem',
                                  bgcolor: deptReportData.overall.productivity >= 90 ? 'rgba(16,185,129,0.15)' : deptReportData.overall.productivity >= 70 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                  color: deptReportData.overall.productivity >= 90 ? '#10B981' : deptReportData.overall.productivity >= 70 ? '#F59E0B' : '#EF4444',
                                  px: 1
                                }} />
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </>
              )}
            </>
          )}

          {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
          {/* TAB 2: EMPLOYEE-WISE REPORT                               */}
          {/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */}
          {dashboardTab === 2 && (
            <>
              <FilterExportBar tab={2} />
              {!selectedSO || empReportData.details.length === 0 ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <AssignIcon sx={{ fontSize: 52, color: 'text.disabled', mb: 1.5 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary' }}>No Employee Data Available</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 600 }}>No activity logs have been recorded for this Sales Order yet.</Typography>
                </Box>
              ) : (
                <>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: 'divider', bgcolor: 'transparent', mb: 4 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>Employee Contribution (Top 10)</Typography>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={employeeMetrics.slice(0, 10).map(e => ({ name: e.name.split(' ')[0], activities: e.activities, hours: e.actualHours }))}
                        margin={{ top: 0, right: 16, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <ChartTooltip contentStyle={tooltipStyle} />
                        <Legend />
                        <Bar dataKey="activities" name="Activities" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="hours" name="Hours" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>

                  {/* Section 1: Detailed Table */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AssignIcon color="primary" sx={{ fontSize: 20 }} />
                      Employee Activity-wise Details
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(139,92,246,0.04)' }}>
                          <TableRow>
                            {['Employee ID', 'Employee Name', 'Department', 'Activity', 'Hours Worked', 'Ideal Hours', 'Productivity %', 'Individual Report'].map(h => (
                              <TableCell key={h} sx={{ fontWeight: 800, fontSize: '0.75rem', py: 1.5 }}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {empReportData.details.map((e, i) => (
                            <TableRow key={i} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                              <TableCell sx={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, fontSize: '0.8rem', color: 'primary.main' }}>{e.employeeId}</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>{e.name}</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>{e.department}</TableCell>
                              <TableCell sx={{ fontWeight: 700, color: 'secondary.main' }}>{e.activity}</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{e.actualHours}h</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{e.idealHours}h</TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>
                                <Chip label={`${e.productivity}%`} size="small" sx={{
                                  fontWeight: 800, fontSize: '0.75rem',
                                  bgcolor: e.productivity >= 90 ? 'rgba(16,185,129,0.12)' : e.productivity >= 70 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                                  color: e.productivity >= 90 ? '#10B981' : e.productivity >= 70 ? '#F59E0B' : '#EF4444',
                                }} />
                              </TableCell>
                               <TableCell sx={{ textAlign: 'center' }}>
                                 <Button
                                   size="small"
                                   variant="outlined"
                                   startIcon={<IndividualReportIcon sx={{ fontSize: '0.9rem' }} />}
                                   onClick={() => handleIndividualEmpXLSX(e.employeeId)}
                                   sx={{
                                     borderRadius: 2, fontWeight: 700, textTransform: 'none',
                                     fontSize: '0.72rem', py: 0.4, px: 1,
                                     borderColor: 'rgba(16,185,129,0.4)', color: '#10B981',
                                     '&:hover': { borderColor: '#10B981', bgcolor: 'rgba(16,185,129,0.06)' },
                                   }}
                                 >
                                   Excel
                                 </Button>
                               </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  {/* Section 2: Employee Summary */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AssignIcon color="secondary" sx={{ fontSize: 20 }} />
                      Employee Summary
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(8,145,178,0.04)' }}>
                          <TableRow>
                            {['Employee ID', 'Employee Name', 'Department', 'Total Activities', 'Total Hours Worked', 'Ideal Hours', 'Productivity %'].map(h => (
                              <TableCell key={h} sx={{ fontWeight: 800, fontSize: '0.75rem', py: 1.5 }}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {empReportData.summary.map((s, i) => (
                            <TableRow key={i} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                              <TableCell sx={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, fontSize: '0.8rem', color: 'primary.main' }}>{s.employeeId}</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>{s.name}</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>{s.department}</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{s.totalActivities}</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{s.actualHours}h</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{s.idealHours}h</TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>
                                <Chip label={`${s.productivity}%`} size="small" sx={{
                                  fontWeight: 800, fontSize: '0.75rem',
                                  bgcolor: s.productivity >= 90 ? 'rgba(16,185,129,0.12)' : s.productivity >= 70 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                                  color: s.productivity >= 90 ? '#10B981' : s.productivity >= 70 ? '#F59E0B' : '#EF4444',
                                }} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  {/* Section 3: Overall SO Summary */}
                  {empReportData.overall && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AssignIcon color="primary" sx={{ fontSize: 20 }} />
                        Overall SO Summary
                      </Typography>
                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
                            <TableRow>
                              {['Total Employees', 'Total Activities', 'Total Hours Worked', 'Total Ideal Hours', 'Average Productivity'].map(h => (
                                <TableCell key={h} sx={{ fontWeight: 800, fontSize: '0.75rem', py: 1.5 }}>{h}</TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)' }}>
                              <TableCell sx={{ fontWeight: 800, fontSize: '0.9rem' }}>{empReportData.overall.totalEmployees}</TableCell>
                              <TableCell sx={{ fontWeight: 800, fontSize: '0.9rem', textAlign: 'center' }}>{empReportData.overall.totalActivities}</TableCell>
                              <TableCell sx={{ fontWeight: 800, fontSize: '0.9rem', textAlign: 'center', color: 'primary.main' }}>{empReportData.overall.actualHours}h</TableCell>
                              <TableCell sx={{ fontWeight: 800, fontSize: '0.9rem', textAlign: 'center' }}>{empReportData.overall.idealHours}h</TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>
                                <Chip label={`${empReportData.overall.productivity}%`} size="medium" sx={{
                                  fontWeight: 900, fontSize: '0.85rem',
                                  bgcolor: empReportData.overall.productivity >= 90 ? 'rgba(16,185,129,0.15)' : empReportData.overall.productivity >= 70 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                  color: empReportData.overall.productivity >= 90 ? '#10B981' : empReportData.overall.productivity >= 70 ? '#F59E0B' : '#EF4444',
                                  px: 1
                                }} />
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </>
              )}
            </>
          )}

        </Box>
      </Card>
    </Box>
  );
};
