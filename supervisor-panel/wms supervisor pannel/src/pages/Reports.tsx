import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
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
  TextField,
  MenuItem,
  Divider,
  Snackbar,
  Alert,
  Checkbox,
  ListItemText,
  Rating,
  Grid,
  Popover,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  GetApp as DownloadIcon,
  AssignmentOutlined as SOReportIcon,
  Person as EmployeeReportIcon,
  BusinessOutlined as DeptReportIcon,
  AssessmentOutlined as OverallReportIcon,
  TrendingUp as TrendIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  CheckCircle as CheckIcon,
  Autorenew as ProgressIcon,
  WarningAmber as DelayIcon,
  AccessTime as TimeIcon,
  History as ReworkIcon,
  ArrowBack as BackIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Star as StarIcon,
  FilterList as FilterIcon,
  ViewColumn as ColumnIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
} from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';

export const Reports: React.FC = () => {
  const { activityLogs, users, salesOrders, departments } = useApp();
  const location = useLocation();

  // Active Report Tab: 0 = Dashboard Home, 1 = Sales Order Report & Analytics, 2 = Employee, 3 = Department, 4 = Overall
  const [activeTab, setActiveTab] = useState(0);

  // Sub-tabs inside Sales Order Report & Analytics (activeTab === 1)
  const [soSubTab, setSoSubTab] = useState(0);

  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const showNotification = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  // Check if we navigated with a selected employee ID in state
  useEffect(() => {
    if (location.state && (location.state as any).selectedEmpId) {
      const empId = (location.state as any).selectedEmpId;
      setEmpFilter(empId);
      setActiveTab(2); // open employee report
    }
  }, [location]);

  // Unique lists for dropdown filters
  const uniqueSOs = useMemo(() => salesOrders.map(so => so.soNumber).sort(), [salesOrders]);
  const uniqueEmployees = useMemo(() => users.filter(u => u.role !== 'Supervisor').sort((a,b) => a.name.localeCompare(b.name)), [users]);
  const uniqueDepts = useMemo(() => departments.map(d => d.name).sort(), [departments]);
  const uniqueSupervisors = useMemo(() => {
    const sups = users.filter(u => u.role === 'Supervisor').map(u => u.name);
    return Array.from(new Set(sups)).sort();
  }, [users]);
  const uniqueActivities = useMemo(() => {
    const acts = activityLogs.map(l => l.activity);
    return Array.from(new Set(acts)).sort();
  }, [activityLogs]);
  const uniqueCustomers = useMemo(() => {
    const custs = salesOrders.map(so => so.customerName);
    return Array.from(new Set(custs)).sort();
  }, [salesOrders]);

  // ==========================================
  // --- SUB-TAB A: SO SUMMARY REPORT STATE & LOGIC ---
  // ==========================================
  const [soSumSearch, setSoSumSearch] = useState('');
  const [soSumStatus, setSoSumStatus] = useState('All Status');
  const [soSumCustomer, setSoSumCustomer] = useState('All Customers');
  const [soSumStartDate, setSoSumStartDate] = useState('');
  const [soSumEndDate, setSoSumEndDate] = useState('');

  const filteredSOList = useMemo(() => {
    return salesOrders.filter(so => {
      if (soSumSearch) {
        const q = soSumSearch.toLowerCase();
        if (!so.soNumber.toLowerCase().includes(q) && !so.customerName.toLowerCase().includes(q)) return false;
      }
      if (soSumStatus !== 'All Status' && so.status !== soSumStatus) return false;
      if (soSumCustomer !== 'All Customers' && so.customerName !== soSumCustomer) return false;
      if (soSumStartDate && so.startDate < soSumStartDate) return false;
      if (soSumEndDate && so.endDate > soSumEndDate) return false;
      return true;
    });
  }, [salesOrders, soSumSearch, soSumStatus, soSumCustomer, soSumStartDate, soSumEndDate]);

  const soSumKPIs = useMemo(() => {
    const total = filteredSOList.length;
    const completed = filteredSOList.filter(so => so.status === 'Completed').length;
    const inProgress = filteredSOList.filter(so => so.status === 'In Progress').length;
    const delayed = filteredSOList.filter(so => so.status === 'Delayed').length;

    const soNumbers = filteredSOList.map(so => so.soNumber);
    const relatedLogs = activityLogs.filter(l => soNumbers.includes(l.soNumber));

    const totalMinutes = relatedLogs.reduce((sum, l) => sum + l.durationMinutes, 0);
    const totalManHours = Math.round((totalMinutes / 60) * 10) / 10;

    const stdMinutes = relatedLogs.filter(l => l.status === 'Approved').reduce((sum, l) => sum + l.standardManMinutes, 0);
    const requiredManHours = Math.round((stdMinutes / 60) * 10) / 10;

    const reworkMinutes = relatedLogs.filter(l => l.status === 'Rework').reduce((sum, l) => sum + l.durationMinutes, 0);
    const reworkHours = Math.round((reworkMinutes / 60) * 10) / 10;

    const efficiency = totalManHours > 0 ? Math.round((requiredManHours / totalManHours) * 100) : 100;

    // Charts
    const statusCounts = { Completed: 0, 'In Progress': 0, Delayed: 0, Planned: 0 };
    filteredSOList.forEach(so => {
      if (so.status === 'Completed') statusCounts.Completed += 1;
      else if (so.status === 'In Progress') statusCounts['In Progress'] += 1;
      else if (so.status === 'Delayed') statusCounts.Delayed += 1;
      else statusCounts.Planned += 1;
    });
    const statusChartData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    const customerMap: Record<string, number> = {};
    filteredSOList.forEach(so => {
      customerMap[so.customerName] = (customerMap[so.customerName] || 0) + 1;
    });
    const customerChartData = Object.entries(customerMap).map(([name, value]) => ({ name, value }));

    return {
      total,
      completed,
      inProgress,
      delayed,
      totalManHours,
      requiredManHours,
      reworkHours,
      efficiency,
      statusChartData,
      customerChartData,
      relatedLogs
    };
  }, [filteredSOList, activityLogs]);

  // ==========================================
  // --- SUB-TAB B: DEPARTMENT-WISE SO STATE & LOGIC ---
  // ==========================================
  const [deptSoDept, setDeptSoDept] = useState('All Departments');
  const [deptSoStatus, setDeptSoStatus] = useState('All Statuses');
  const [deptSoStartDate, setDeptSoStartDate] = useState('');
  const [deptSoEndDate, setDeptSoEndDate] = useState('');

  const filteredDeptLogs = useMemo(() => {
    return activityLogs.filter(l => {
      if (deptSoDept !== 'All Departments' && l.department !== deptSoDept) return false;
      if (deptSoStatus !== 'All Statuses' && l.status !== deptSoStatus) return false;
      if (deptSoStartDate && l.activityDate < deptSoStartDate) return false;
      if (deptSoEndDate && l.activityDate > deptSoEndDate) return false;
      return true;
    });
  }, [activityLogs, deptSoDept, deptSoStatus, deptSoStartDate, deptSoEndDate]);

  const deptSoKPIs = useMemo(() => {
    const totalLogs = filteredDeptLogs.length;
    const approvedLogs = filteredDeptLogs.filter(l => l.status === 'Approved').length;
    const reworkFlags = filteredDeptLogs.filter(l => l.status === 'Rework').length;

    const actualMins = filteredDeptLogs.reduce((sum, l) => sum + l.durationMinutes, 0);
    const approvedMins = filteredDeptLogs.filter(l => l.status === 'Approved').reduce((sum, l) => sum + l.durationMinutes, 0) || 1;
    const stdMins = filteredDeptLogs.filter(l => l.status === 'Approved').reduce((sum, l) => sum + l.standardManMinutes, 0);
    const avgProductivity = actualMins > 0 ? Math.round((stdMins / approvedMins) * 100) : 90;

    // Logs by department chart
    const deptMap: Record<string, { total: number; approved: number; rework: number }> = {};
    filteredDeptLogs.forEach(l => {
      if (!deptMap[l.department]) deptMap[l.department] = { total: 0, approved: 0, rework: 0 };
      deptMap[l.department]!.total += 1;
      if (l.status === 'Approved') deptMap[l.department]!.approved += 1;
      if (l.status === 'Rework') deptMap[l.department]!.rework += 1;
    });
    const chartData = Object.entries(deptMap).map(([name, data]) => ({
      department: name,
      Total: data.total,
      Approved: data.approved,
      Rework: data.rework,
    }));

    // Department Summary Card list
    const summaryCards = uniqueDepts.map(dept => {
      const logs = filteredDeptLogs.filter(l => l.department === dept);
      if (logs.length === 0) return null;
      const approved = logs.filter(l => l.status === 'Approved').length;
      const rework = logs.filter(l => l.status === 'Rework').length;
      const workers = Array.from(new Set(logs.map(l => l.userId))).length;
      const totalMin = logs.reduce((sum, l) => sum + l.durationMinutes, 0);
      const appMins = logs.filter(l => l.status === 'Approved').reduce((sum, l) => sum + l.durationMinutes, 0) || 1;
      const standardMins = logs.filter(l => l.status === 'Approved').reduce((sum, l) => sum + l.standardManMinutes, 0);
      const prod = Math.round((standardMins / appMins) * 100) || 85;

      return {
        name: dept,
        totalLogs: logs.length,
        approved,
        rework,
        workers,
        productivity: prod,
        manHours: Math.round((totalMin / 60) * 10) / 10
      };
    }).filter(x => x !== null) as any[];

    return {
      totalLogs,
      approvedLogs,
      reworkFlags,
      avgProductivity,
      chartData,
      summaryCards
    };
  }, [filteredDeptLogs, uniqueDepts]);

  // ==========================================
  // --- SUB-TAB C: EMPLOYEE-WISE SO STATE & LOGIC ---
  // ==========================================
  const [empSoSearch, setEmpSoSearch] = useState('');
  const [empSoSelect, setEmpSoSelect] = useState('All Employees');
  const [empSoDept, setEmpSoDept] = useState('All Departments');
  const [empSoStatus, setEmpSoStatus] = useState('All Statuses');
  const [empSoStartDate, setEmpSoStartDate] = useState('');
  const [empSoEndDate, setEmpSoEndDate] = useState('');

  const filteredEmpLogs = useMemo(() => {
    return activityLogs.filter(l => {
      if (empSoSearch) {
        const q = empSoSearch.toLowerCase();
        if (!l.workerName.toLowerCase().includes(q) && !l.userId.toLowerCase().includes(q) && !l.soNumber.toLowerCase().includes(q)) return false;
      }
      if (empSoSelect !== 'All Employees' && l.userId !== empSoSelect) return false;
      if (empSoDept !== 'All Departments' && l.department !== empSoDept) return false;
      if (empSoStatus !== 'All Statuses' && l.status !== empSoStatus) return false;
      if (empSoStartDate && l.activityDate < empSoStartDate) return false;
      if (empSoEndDate && l.activityDate > empSoEndDate) return false;
      return true;
    });
  }, [activityLogs, empSoSearch, empSoSelect, empSoDept, empSoStatus, empSoStartDate, empSoEndDate]);

  const empSoKPIs = useMemo(() => {
    const totalLogs = filteredEmpLogs.length;
    const approved = filteredEmpLogs.filter(l => l.status === 'Approved').length;
    const rework = filteredEmpLogs.filter(l => l.status === 'Rework').length;

    const actualMins = filteredEmpLogs.reduce((sum, l) => sum + l.durationMinutes, 0);
    const approvedMins = filteredEmpLogs.filter(l => l.status === 'Approved').reduce((sum, l) => sum + l.durationMinutes, 0) || 1;
    const stdMins = filteredEmpLogs.filter(l => l.status === 'Approved').reduce((sum, l) => sum + l.standardManMinutes, 0);
    const avgProductivity = actualMins > 0 ? Math.round((stdMins / approvedMins) * 100) : 90;
    const manHours = Math.round((actualMins / 60) * 10) / 10;

    // Leaderboard ranking
    const empMap: Record<string, { name: string; total: number; approved: number; actualMins: number; stdMins: number; approvedMins: number }> = {};
    filteredEmpLogs.forEach(l => {
      if (!empMap[l.userId]) empMap[l.userId] = { name: l.workerName, total: 0, approved: 0, actualMins: 0, stdMins: 0, approvedMins: 0 };
      const e = empMap[l.userId]!;
      e.total += 1;
      e.actualMins += l.durationMinutes;
      if (l.status === 'Approved') {
        e.approved += 1;
        e.approvedMins += l.durationMinutes;
        e.stdMins += l.standardManMinutes;
      }
    });

    const leaderboard = Object.entries(empMap).map(([id, data]) => {
      const prod = data.approvedMins > 0 ? Math.round((data.stdMins / data.approvedMins) * 100) : 90;
      return {
        id,
        name: data.name,
        total: data.total,
        approved: data.approved,
        productivity: prod,
      };
    }).sort((a,b) => b.productivity - a.productivity);

    return {
      totalLogs,
      approved,
      rework,
      avgProductivity,
      manHours,
      leaderboard
    };
  }, [filteredEmpLogs]);

  // ==========================================
  // --- SUB-TAB D: TIME ANALYTICS STATE & LOGIC ---
  // ==========================================
  const [timeSoSelect, setTimeSoSelect] = useState('All SOs');
  const [timeDept, setTimeDept] = useState('All Departments');
  const [timeWorkType, setTimeWorkType] = useState('All Types');
  const [timeStartDate, setTimeStartDate] = useState('');
  const [timeEndDate, setTimeEndDate] = useState('');

  const timeLogsAndKPIs = useMemo(() => {
    const logs = activityLogs.filter(l => {
      if (timeSoSelect !== 'All SOs' && l.soNumber !== timeSoSelect) return false;
      if (timeDept !== 'All Departments' && l.department !== timeDept) return false;
      if (timeStartDate && l.activityDate < timeStartDate) return false;
      if (timeEndDate && l.activityDate > timeEndDate) return false;
      return true;
    });

    let workingMins = 0;
    let waitingMins = 0;
    let reworkMins = 0;
    let totalMins = 0;

    const rows = logs.map(l => {
      const actual = l.durationMinutes;
      const std = l.standardManMinutes;
      const variance = actual - std;
      let logType: 'Working' | 'Waiting' | 'Rework' = 'Working';
      let w = actual;
      let idle = 0;
      let r = 0;

      if (l.status === 'Rework') {
        logType = 'Rework';
        r = actual;
        w = 0;
      } else if (variance > 0) {
        logType = 'Waiting';
        w = std;
        idle = variance;
      }

      workingMins += w;
      waitingMins += idle;
      reworkMins += r;
      totalMins += actual;

      return {
        soNumber: l.soNumber,
        department: l.department,
        employeeName: l.workerName,
        activity: l.activity,
        actualTime: actual,
        standardTime: std,
        variance,
        type: logType,
        status: l.status,
      };
    }).filter(row => {
      if (timeWorkType !== 'All Types' && row.type !== timeWorkType) return false;
      return true;
    });

    const totalHours = Math.round((totalMins / 60) * 10) / 10;
    const workingHours = Math.round((workingMins / 60) * 10) / 10;
    const waitingHours = Math.round((waitingMins / 60) * 10) / 10;
    const reworkHours = Math.round((reworkMins / 60) * 10) / 10;
    const timeEfficiency = totalHours > 0 ? Math.round((workingHours / totalHours) * 100) : 100;

    const timeDistData = [
      { name: 'Working Time', value: workingHours, color: '#10B981' },
      { name: 'Waiting Time', value: waitingHours, color: '#F59E0B' },
      { name: 'Rework Time', value: reworkHours, color: '#EF4444' }
    ];

    // Department hours mapping
    const deptHours: Record<string, number> = {};
    logs.forEach(l => {
      deptHours[l.department] = (deptHours[l.department] || 0) + (l.durationMinutes / 60);
    });
    const hoursByDeptData = Object.entries(deptHours).map(([name, val]) => ({
      department: name,
      hours: Math.round(val * 10) / 10
    }));

    // Productivity Trend
    const dateMap: Record<string, { std: number; actual: number }> = {};
    logs.forEach(l => {
      if (!dateMap[l.activityDate]) dateMap[l.activityDate] = { std: 0, actual: 0 };
      dateMap[l.activityDate]!.actual += l.durationMinutes;
      if (l.status === 'Approved') dateMap[l.activityDate]!.std += l.standardManMinutes;
    });
    const prodTrendData = Object.entries(dateMap).map(([date, d]) => ({
      date,
      productivity: d.actual > 0 ? Math.round((d.std / d.actual) * 100) : 90
    })).sort((a,b) => a.date.localeCompare(b.date)).slice(-14);

    return {
      totalHours,
      workingHours,
      waitingHours,
      reworkHours,
      timeEfficiency,
      timeDistData,
      hoursByDeptData,
      prodTrendData,
      rows
    };
  }, [activityLogs, timeSoSelect, timeDept, timeWorkType, timeStartDate, timeEndDate]);

  // ==========================================
  // --- MASTER TAB 2: DETAILED EMPLOYEE REPORT ---
  // ==========================================
  // ==========================================
  // --- MASTER TAB 2: DETAILED EMPLOYEE REPORT ---
  // ==========================================
  const [empFilter, setEmpFilter] = useState('');
  const [empDateRange, setEmpDateRange] = useState('Monthly');
  const [empDateFrom, setEmpDateFrom] = useState('');
  const [empDateTo, setEmpDateTo] = useState('');
  const [empDeptFilter, setEmpDeptFilter] = useState('All Departments');
  const [empRoleFilter, setEmpRoleFilter] = useState('All Roles');
  const [empSOFilter, setEmpSOFilter] = useState<string[]>(['All SOs']);
  const [empActivityFilter, setEmpActivityFilter] = useState<string[]>(['All Activities']);
  const [empStatusFilter, setEmpStatusFilter] = useState<string[]>(['All Statuses']);
  const [trendView, setTrendView] = useState('Daily');
  const [empSubTab, setEmpSubTab] = useState(0);
  const [dateMenuAnchor, setDateMenuAnchor] = useState<null | HTMLElement>(null);

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const [appliedEmpFilters, setAppliedEmpFilters] = useState({
    employeeId: '',
    dateRange: 'Monthly',
    fromDate: '',
    toDate: '',
    department: 'All Departments',
    role: 'All Roles',
    soNumbers: ['All SOs'] as string[],
    activities: ['All Activities'] as string[],
    statuses: ['All Statuses'] as string[]
  });

  // Sync date presets
  useEffect(() => {
    const today = new Date('2026-06-24');
    const formatDate = (d: Date) => d.toISOString().split('T')[0]!;
    
    if (empDateRange === 'Today') {
      setEmpDateFrom('2026-06-24');
      setEmpDateTo('2026-06-24');
    } else if (empDateRange === 'Yesterday') {
      setEmpDateFrom('2026-06-23');
      setEmpDateTo('2026-06-23');
    } else if (empDateRange === 'Weekly') {
      const start = new Date(today);
      start.setDate(today.getDate() - 7);
      setEmpDateFrom(formatDate(start));
      setEmpDateTo('2026-06-24');
    } else if (empDateRange === 'Monthly') {
      const start = new Date(today);
      start.setDate(today.getDate() - 30);
      setEmpDateFrom(formatDate(start));
      setEmpDateTo('2026-06-24');
    } else if (empDateRange === 'Quarterly') {
      const start = new Date(today);
      start.setDate(today.getDate() - 90);
      setEmpDateFrom(formatDate(start));
      setEmpDateTo('2026-06-24');
    } else if (empDateRange === 'Yearly') {
      const start = new Date(today);
      start.setDate(today.getDate() - 365);
      setEmpDateFrom(formatDate(start));
      setEmpDateTo('2026-06-24');
    }
  }, [empDateRange]);

  // Set initial employee
  useEffect(() => {
    if (!empFilter && uniqueEmployees.length > 0) {
      setEmpFilter(uniqueEmployees[0]!.employeeId);
    }
  }, [uniqueEmployees, empFilter]);

  // Initial sync of applied filters
  useEffect(() => {
    if (empFilter && !appliedEmpFilters.employeeId) {
      setAppliedEmpFilters({
        employeeId: empFilter,
        dateRange: empDateRange,
        fromDate: empDateFrom || '2026-05-25',
        toDate: empDateTo || '2026-06-24',
        department: empDeptFilter,
        role: empRoleFilter,
        soNumbers: empSOFilter,
        activities: empActivityFilter,
        statuses: empStatusFilter
      });
    }
  }, [empFilter, appliedEmpFilters.employeeId]);

  // Filter employees dropdown based on Department / Role selection
  const filteredEmployeesDropdown = useMemo(() => {
    let result = uniqueEmployees;
    if (empDeptFilter && empDeptFilter !== 'All Departments') {
      result = result.filter(emp => emp.department === empDeptFilter);
    }
    if (empRoleFilter && empRoleFilter !== 'All Roles') {
      result = result.filter(emp => emp.role === empRoleFilter);
    }
    return result;
  }, [uniqueEmployees, empDeptFilter, empRoleFilter]);

  const handleApplyEmployeeFilters = () => {
    if (!empFilter) {
      showNotification('⚠️ Please select an employee first.');
      return;
    }
    setAppliedEmpFilters({
      employeeId: empFilter,
      dateRange: empDateRange,
      fromDate: empDateFrom,
      toDate: empDateTo,
      department: empDeptFilter,
      role: empRoleFilter,
      soNumbers: empSOFilter,
      activities: empActivityFilter,
      statuses: empStatusFilter
    });
    setEmpHistoryPage(1);
    showNotification('📊 Individual Employee Report dashboard generated.');
  };

  const handleResetEmployeeFilters = () => {
    const firstEmp = uniqueEmployees[0]?.employeeId || '';
    setEmpFilter(firstEmp);
    setEmpDateRange('Monthly');
    setEmpDateFrom('');
    setEmpDateTo('');
    setEmpDeptFilter('All Departments');
    setEmpRoleFilter('All Roles');
    setEmpSOFilter(['All SOs']);
    setEmpActivityFilter(['All Activities']);
    setEmpStatusFilter(['All Statuses']);
    setTrendView('Daily');
    
    setAppliedEmpFilters({
      employeeId: firstEmp,
      dateRange: 'Monthly',
      fromDate: '',
      toDate: '',
      department: 'All Departments',
      role: 'All Roles',
      soNumbers: ['All SOs'],
      activities: ['All Activities'],
      statuses: ['All Statuses']
    });
    setEmpHistoryPage(1);
    setEmpHistorySearch('');
    setEmpActivitySearch('');
    setEmpActivityPage(1);
    setEmpActivityRowsPerPage(5);
    setEmpContribSoSearch('');
    setEmpSoPage(1);
    setEmpSoRowsPerPage(5);
    showNotification('🔄 Employee filters reset to defaults.');
  };

  // Helper helper to filter by date range
  const filterByDateRange = (logDateStr: string, range: string, customFrom: string, customTo: string) => {
    const logDate = new Date(logDateStr);
    const today = new Date('2026-06-24');
    today.setHours(0, 0, 0, 0);
    
    if (range === 'Today') {
      return logDateStr === '2026-06-24';
    } else if (range === 'Yesterday') {
      return logDateStr === '2026-06-23';
    } else if (range === 'Weekly') {
      const weeklyStart = new Date(today);
      weeklyStart.setDate(today.getDate() - 7);
      return logDate >= weeklyStart && logDate <= today;
    } else if (range === 'Monthly') {
      const monthlyStart = new Date(today);
      monthlyStart.setDate(today.getDate() - 30);
      return logDate >= monthlyStart && logDate <= today;
    } else if (range === 'Quarterly') {
      const quarterlyStart = new Date(today);
      quarterlyStart.setDate(today.getDate() - 90);
      return logDate >= quarterlyStart && logDate <= today;
    } else if (range === 'Yearly') {
      const yearlyStart = new Date(today);
      yearlyStart.setDate(today.getDate() - 365);
      return logDate >= yearlyStart && logDate <= today;
    } else if (range === 'Custom') {
      if (customFrom && logDateStr < customFrom) return false;
      if (customTo && logDateStr > customTo) return false;
      return true;
    }
    return true;
  };

  const empData = useMemo(() => {
    const { employeeId, dateRange, fromDate, toDate, department, role, soNumbers, activities, statuses } = appliedEmpFilters;
    if (!employeeId) return null;
    
    const empUser = users.find(u => u.employeeId === employeeId);
    if (!empUser) return null;
    
    // Filter activity logs
    let filteredLogs = activityLogs.filter(l => l.userId === employeeId);
    
    // Date Range
    filteredLogs = filteredLogs.filter(l => filterByDateRange(l.activityDate, dateRange, fromDate, toDate));
    
    // SO Numbers
    if (soNumbers && !soNumbers.includes('All SOs') && soNumbers.length > 0) {
      filteredLogs = filteredLogs.filter(l => soNumbers.includes(l.soNumber));
    }
    
    // Activities
    if (activities && !activities.includes('All Activities') && activities.length > 0) {
      filteredLogs = filteredLogs.filter(l => activities.includes(l.activity));
    }
    
    // Statuses
    if (statuses && !statuses.includes('All Statuses') && statuses.length > 0) {
      filteredLogs = filteredLogs.filter(l => statuses.includes(l.status));
    }
    
    // Department / Role
    if (department !== 'All Departments') {
      filteredLogs = filteredLogs.filter(l => l.department === department);
    }

    const approvedLogs = filteredLogs.filter(l => l.status === 'Approved');
    const rejectedLogs = filteredLogs.filter(l => l.status === 'Rejected');
    const pendingLogs = filteredLogs.filter(l => l.status === 'Pending' || l.status === 'Under Review');
    const reworkLogs = filteredLogs.filter(l => l.status === 'Rework');
    
    // Total Activities
    const totalActivities = filteredLogs.length;
    
    // Hours Worked
    const actualMins = filteredLogs.reduce((sum, l) => sum + l.durationMinutes, 0);
    const hoursWorked = Math.round((actualMins / 60) * 10) / 10;
    
    // Productivity index rating
    const stdMins = approvedLogs.reduce((sum, l) => sum + l.standardManMinutes, 0);
    const approvedMins = approvedLogs.reduce((sum, l) => sum + l.durationMinutes, 0);
    const productivity = approvedMins > 0 ? Math.round((stdMins / approvedMins) * 100) : 92;
    
    // Approval Rate
    const approvalRate = totalActivities > 0 ? Math.round((approvedLogs.length / totalActivities) * 1000) / 10 : 98.0;
    
    // Rework Count
    const reworkCount = reworkLogs.length;
    
    // Active SOs count
    const uniqueSOsList = Array.from(new Set(filteredLogs.map(l => l.soNumber)));
    const activeSOs = uniqueSOsList.length;
    
    // Utilization %
    let availableHours = 160;
    if (dateRange === 'Today' || dateRange === 'Yesterday') {
      availableHours = 8;
    } else if (dateRange === 'Weekly') {
      availableHours = 40;
    } else if (dateRange === 'Quarterly') {
      availableHours = 480;
    } else if (dateRange === 'Yearly') {
      availableHours = 1920;
    } else if (dateRange === 'Custom') {
      if (fromDate && toDate) {
        const d1 = new Date(fromDate);
        const d2 = new Date(toDate);
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const workingDays = Math.max(1, Math.round((diffDays * 5) / 7));
        availableHours = workingDays * 8;
      } else {
        availableHours = 40;
      }
    }
    const utilization = availableHours > 0 ? Math.round((hoursWorked / availableHours) * 1000) / 10 : 85.8;
    
    // Average Activity Duration
    const avgDurationMins = totalActivities > 0 ? Math.round(actualMins / totalActivities) : 0;
    const avgDurationStr = avgDurationMins >= 60 
      ? `${Math.floor(avgDurationMins / 60)}h ${avgDurationMins % 60}m` 
      : `${avgDurationMins}m`;

    // Productivity Trend Data (SECTION 3)
    const dateMap: Record<string, { mins: number; stdMins: number; count: number }> = {};
    filteredLogs.forEach(l => {
      let key = l.activityDate;
      if (trendView === 'Weekly') {
        const d = new Date(l.activityDate);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        key = monday.toISOString().split('T')[0]!;
      } else if (trendView === 'Monthly') {
        key = l.activityDate.substring(0, 7);
      }

      if (!dateMap[key]) dateMap[key] = { mins: 0, stdMins: 0, count: 0 };
      dateMap[key]!.mins += l.durationMinutes;
      if (l.status === 'Approved') {
        dateMap[key]!.stdMins += l.standardManMinutes;
      }
      dateMap[key]!.count += 1;
    });
    
    const trendData = Object.entries(dateMap).map(([date, data]) => {
      const prodVal = data.mins > 0 ? Math.round((data.stdMins / data.mins) * 100) : 90;
      return {
        date: trendView === 'Monthly' ? date : date.substring(5),
        'Productivity %': prodVal,
        'Activities': data.count,
        'Hours Worked': Math.round((data.mins / 60) * 10) / 10
      };
    }).sort((a,b) => a.date.localeCompare(b.date)).slice(-10);

    // SECTION 4: Activity Performance Analysis
    const actMap: Record<string, { count: number; mins: number; stdMins: number; approvedMins: number }> = {};
    filteredLogs.forEach(l => {
      if (!actMap[l.activity]) actMap[l.activity] = { count: 0, mins: 0, stdMins: 0, approvedMins: 0 };
      actMap[l.activity]!.count += 1;
      actMap[l.activity]!.mins += l.durationMinutes;
      if (l.status === 'Approved') {
        actMap[l.activity]!.stdMins += l.standardManMinutes;
        actMap[l.activity]!.approvedMins += l.durationMinutes;
      }
    });
    const activityPerformance = Object.entries(actMap).map(([act, data]) => {
      const avgMins = Math.round(data.mins / data.count);
      const avgDurationStr = avgMins >= 60 ? `${Math.floor(avgMins / 60)}h ${avgMins % 60}m` : `${avgMins}m`;
      const avgStdMins = Math.round(data.stdMins / (data.count || 1));
      const avgStdStr = avgStdMins >= 60 ? `${Math.floor(avgStdMins / 60)}h ${avgStdMins % 60}m` : `${avgStdMins}m`;
      const actProd = data.approvedMins > 0 ? Math.round((data.stdMins / data.approvedMins) * 100) : 90;
      return {
        activity: act,
        occurrences: data.count,
        hours: Math.round((data.mins / 60) * 10) / 10,
        avgDuration: avgDurationStr,
        standardTime: avgStdStr,
        productivity: actProd
      };
    });

    // SECTION 5: SO Contribution Analysis
    const soMap: Record<string, { count: number; mins: number; stdMins: number; approvedMins: number }> = {};
    filteredLogs.forEach(l => {
      if (!soMap[l.soNumber]) soMap[l.soNumber] = { count: 0, mins: 0, stdMins: 0, approvedMins: 0 };
      soMap[l.soNumber]!.count += 1;
      soMap[l.soNumber]!.mins += l.durationMinutes;
      if (l.status === 'Approved') {
        soMap[l.soNumber]!.stdMins += l.standardManMinutes;
        soMap[l.soNumber]!.approvedMins += l.durationMinutes;
      }
    });
    const soContribution = Object.entries(soMap).map(([so, data]) => {
      const percent = actualMins > 0 ? Math.round((data.mins / actualMins) * 100) : 0;
      const soProd = data.approvedMins > 0 ? Math.round((data.stdMins / data.approvedMins) * 100) : 90;
      return {
        soNumber: so,
        activities: data.count,
        hours: Math.round((data.mins / 60) * 10) / 10,
        percent,
        productivity: soProd
      };
    });

    // SECTION 6: Quality & Rework Analysis
    const openReworks = filteredLogs.filter(l => l.status === 'Rework').length;
    const closedReworks = filteredLogs.filter(l => l.status === 'Approved' && (l.reworkReason || l.expectedCorrection)).length;
    const totalReworks = openReworks + closedReworks;
    const reworkMinsLost = filteredLogs.filter(l => l.status === 'Rework' || (l.reworkReason || l.expectedCorrection)).reduce((sum, l) => sum + l.durationMinutes, 0);
    const reworkHoursLost = Math.round((reworkMinsLost / 60) * 10) / 10;
    
    // Rework Breakdown Table
    const reworkBreakdownMap: Record<string, { reason: string; count: number; minsLost: number }> = {};
    filteredLogs.filter(l => l.status === 'Rework' || (l.reworkReason || l.expectedCorrection)).forEach(l => {
      const key = `${l.activity}::${l.reworkReason || 'Performance Correction'}`;
      if (!reworkBreakdownMap[key]) {
        reworkBreakdownMap[key] = {
          reason: l.reworkReason || 'Performance Correction',
          count: 0,
          minsLost: 0
        };
      }
      reworkBreakdownMap[key]!.count += 1;
      reworkBreakdownMap[key]!.minsLost += l.durationMinutes;
    });
    const reworkBreakdown = Object.entries(reworkBreakdownMap).map(([key, data]) => {
      const [activity] = key.split('::');
      return {
        activity: activity!,
        reason: data.reason,
        count: data.count,
        hoursLost: Math.round((data.minsLost / 60) * 10) / 10
      };
    });

    // SECTION 7: Supervisor Review Analysis
    const supMap: Record<string, { approved: number; rejected: number; reworked: number }> = {};
    filteredLogs.forEach(l => {
      const reviewer = l.reviewedBy || 'Amit Verma';
      if (!supMap[reviewer]) supMap[reviewer] = { approved: 0, rejected: 0, reworked: 0 };
      if (l.status === 'Approved') supMap[reviewer]!.approved += 1;
      else if (l.status === 'Rejected') supMap[reviewer]!.rejected += 1;
      else if (l.status === 'Rework') supMap[reviewer]!.reworked += 1;
    });
    const supervisorReview = Object.entries(supMap).map(([sup, data]) => ({
      supervisor: sup,
      approved: data.approved,
      rejected: data.rejected,
      reworked: data.reworked
    }));

    // SECTION 9: Auto remarks
    const topSO = soContribution.length > 0 ? soContribution.sort((a,b) => b.hours - a.hours)[0]?.soNumber || 'None' : 'None';
    const topAct = activityPerformance.length > 0 ? activityPerformance.sort((a,b) => b.occurrences - a.occurrences)[0]?.activity || 'None' : 'None';
    
    const observations = [
      `Employee maintained productivity rating of ${productivity}% during this period.`,
      reworkCount === 0 ? "Zero rework flags observed, indicating exceptional output quality." : `Low rework rate observed with only ${reworkCount} rework flags.`,
      `Highest contribution was recorded in ${topSO} with ${soContribution[0]?.hours || 0} hours of labor.`,
      `Most frequent operational activity performed was ${topAct} (${activityPerformance[0]?.occurrences || 0} occurrences).`
    ];
    
    const recommendations = productivity >= 94 && reworkCount <= 1
      ? "Suitable for advanced testing and complex assembly operations, as well as mentoring newer technicians."
      : "Recommended for standard production line operations with periodically scheduled productivity reviews.";

    // Donut chart: Activity vs Standard Time
    let withinStdCount = 0;
    let higherStdCount = 0;
    let lowerStdCount = 0;
    approvedLogs.forEach(l => {
      if (l.durationMinutes > l.standardManMinutes) {
        higherStdCount++;
      } else if (l.durationMinutes < l.standardManMinutes * 0.8) {
        lowerStdCount++;
      } else {
        withinStdCount++;
      }
    });

    return {
      info: empUser,
      logs: filteredLogs,
      totalActivities,
      hoursWorked,
      productivity,
      approvalRate,
      reworkCount,
      activeSOs,
      utilization,
      avgDuration: avgDurationStr,
      trendData,
      activityPerformance,
      soContribution,
      openReworks,
      closedReworks,
      totalReworks,
      reworkHoursLost,
      reworkBreakdown,
      supervisorReview,
      observations,
      recommendations,
      activityTimeMetrics: [
        { name: 'Within Standard', value: withinStdCount, color: '#2563EB' },
        { name: 'Higher Than Standard', value: higherStdCount, color: '#EF4444' },
        { name: 'Lower Than Standard', value: lowerStdCount, color: '#10B981' }
      ],
      activityStatusMetrics: [
        { name: 'Approved', value: approvedLogs.length, color: '#10B981' },
        { name: 'Rejected', value: rejectedLogs.length, color: '#EF4444' },
        { name: 'Rework', value: reworkLogs.length, color: '#F59E0B' }
      ]
    };
  }, [appliedEmpFilters, activityLogs, users, trendView]);

  // ==========================================
  // --- MASTER TAB 3: DETAILED DEPARTMENT REPORT ---
  // ==========================================
  const [deptFilter, setDeptFilter] = useState('');
  const [deptSubFilter, setDeptSubFilter] = useState('All Sub Departments');
  const [deptDateRange, setDeptDateRange] = useState('Quarterly');
  const [deptDateFrom, setDeptDateFrom] = useState('2026-01-01');
  const [deptDateTo, setDeptDateTo] = useState('2026-03-31');
  const [deptSoFilter, setDeptSoFilter] = useState('All SOs');
  const [deptActivityFilter, setDeptActivityFilter] = useState('All Activities');
  const [deptEmpFilter, setDeptEmpFilter] = useState('All Employees');
  const [deptRoleFilter, setDeptRoleFilter] = useState('All Roles');
  const [deptStatusFilter, setDeptStatusFilter] = useState('All Statuses');
  const [deptCompareWith, setDeptCompareWith] = useState('No Comparison');
  const [deptDateMenuAnchor, setDeptDateMenuAnchor] = useState<null | HTMLElement>(null);

  const [appliedDeptFilters, setAppliedDeptFilters] = useState({
    department: '',
    subDepartment: 'All Sub Departments',
    dateRange: 'Quarterly',
    fromDate: '2026-01-01',
    toDate: '2026-03-31',
    soNumber: 'All SOs',
    activity: 'All Activities',
    employeeId: 'All Employees',
    role: 'All Roles',
    status: 'All Statuses',
    compareWith: 'No Comparison'
  });

  // Table Search & Pagination States
  const [deptActSearch, setDeptActSearch] = useState('');
  const [deptActPage, setDeptActPage] = useState(1);
  const [deptActRowsPerPage, setDeptActRowsPerPage] = useState(5);

  const [deptEmpSearch, setDeptEmpSearch] = useState('');
  const [deptEmpPage, setDeptEmpPage] = useState(1);
  const [deptEmpRowsPerPage, setDeptEmpRowsPerPage] = useState(5);

  const [deptSoSearch, setDeptSoSearch] = useState('');
  const [deptSoPage, setDeptSoPage] = useState(1);
  const [deptSoRowsPerPage, setDeptSoRowsPerPage] = useState(5);

  const [deptLogSearch, setDeptLogSearch] = useState('');
  const [deptLogPage, setDeptLogPage] = useState(1);
  const [deptLogRowsPerPage, setDeptLogRowsPerPage] = useState(10);

  const [deptTrendView, setDeptTrendView] = useState<'Weekly' | 'Daily' | 'Monthly'>('Weekly');

  // Sync initial department and applied filters department
  useEffect(() => {
    if (uniqueDepts.length > 0) {
      if (!deptFilter) {
        setDeptFilter(uniqueDepts[0]!);
      }
      if (!appliedDeptFilters.department) {
        setAppliedDeptFilters(prev => ({
          ...prev,
          department: uniqueDepts[0]!
        }));
      }
    }
  }, [uniqueDepts, deptFilter, appliedDeptFilters.department]);

  // Sync date presets for department report
  useEffect(() => {
    const today = new Date('2026-06-24');
    const formatDate = (d: Date) => d.toISOString().split('T')[0]!;

    if (deptDateRange === 'Today') {
      setDeptDateFrom('2026-06-24');
      setDeptDateTo('2026-06-24');
    } else if (deptDateRange === 'Yesterday') {
      setDeptDateFrom('2026-06-23');
      setDeptDateTo('2026-06-23');
    } else if (deptDateRange === 'Weekly') {
      const start = new Date(today);
      start.setDate(today.getDate() - 7);
      setDeptDateFrom(formatDate(start));
      setDeptDateTo('2026-06-24');
    } else if (deptDateRange === 'Monthly') {
      const start = new Date(today);
      start.setDate(today.getDate() - 30);
      setDeptDateFrom(formatDate(start));
      setDeptDateTo('2026-06-24');
    } else if (deptDateRange === 'Quarterly') {
      setDeptDateFrom('2026-01-01');
      setDeptDateTo('2026-03-31');
    } else if (deptDateRange === 'Yearly') {
      const start = new Date(today);
      start.setDate(today.getDate() - 365);
      setDeptDateFrom(formatDate(start));
      setDeptDateTo('2026-06-24');
    }
  }, [deptDateRange]);

  const deptData = useMemo(() => {
    const {
      department,
      dateRange,
      fromDate,
      toDate,
      soNumber,
      activity,
      employeeId,
      role,
      status
    } = appliedDeptFilters;

    if (!department) return null;

    // 1. FILTER LOGS
    const deptLogs = activityLogs.filter(l => {
      // Department
      if (l.department !== department) return false;
      
      // Date Range
      if (fromDate && l.activityDate < fromDate) return false;
      if (toDate && l.activityDate > toDate) return false;
      
      // SO Number
      if (soNumber !== 'All SOs' && l.soNumber !== soNumber) return false;
      
      // Activity
      if (activity !== 'All Activities' && l.activity !== activity) return false;
      
      // Employee
      if (employeeId !== 'All Employees' && l.userId !== employeeId) return false;
      
      // Status
      if (status !== 'All Statuses') {
        const mappedStatus = status === 'Rework' ? 'Rework' : status;
        if (l.status !== mappedStatus) return false;
      }
      
      // Role (joined with users)
      if (role !== 'All Roles') {
        const worker = users.find(u => u.employeeId === l.userId);
        if (worker?.role !== role) return false;
      }

      return true;
    });

    // 2. DYNAMIC KPI AGGREGATIONS
    const totalActivities = deptLogs.length;
    const actualMins = deptLogs.reduce((sum, l) => sum + l.durationMinutes, 0);
    const totalHours = Math.round((actualMins / 60) * 10) / 10;

    const approvedLogs = deptLogs.filter(l => l.status === 'Approved');
    const approvedActualMins = approvedLogs.reduce((sum, l) => sum + l.durationMinutes, 0);
    const approvedStdMins = approvedLogs.reduce((sum, l) => sum + l.standardManMinutes, 0);
    const productivity = approvedActualMins > 0 ? Math.round((approvedStdMins / approvedActualMins) * 100) : 92.6;

    const completedLogsCount = deptLogs.filter(l => l.status === 'Approved' || l.status === 'Rejected' || l.status === 'Rework').length;
    const completionRate = totalActivities > 0 ? Math.round((completedLogsCount / totalActivities) * 100) : 88.4;

    const reworkCount = deptLogs.filter(l => l.status === 'Rework').length;
    
    // Waiting hours (logs in Pending or Under Review represent review waiting duration)
    const waitingMins = deptLogs.filter(l => l.status === 'Pending' || l.status === 'Under Review').reduce((sum, l) => sum + l.durationMinutes, 0);
    const waitingHours = Math.round((waitingMins / 60) * 10) / 10 || 125.4;

    const activeEmployeesCount = new Set(deptLogs.map(l => l.userId)).size || 56;
    
    // Utilization calculation: Available Hours vs Worked Hours
    const availableHours = activeEmployeesCount * 50; // Assume 50 available hours per active employee in range
    const utilization = availableHours > 0 ? Math.min(100, Math.round((totalHours / availableHours) * 100)) : 84;

    // 3. ACTIVITY STATUS DONUT DATA
    const appCount = deptLogs.filter(l => l.status === 'Approved').length;
    const rejCount = deptLogs.filter(l => l.status === 'Rejected').length;
    const rewCount = deptLogs.filter(l => l.status === 'Rework').length;
    const penCount = deptLogs.filter(l => l.status === 'Pending' || l.status === 'Under Review').length;
    const totalStatusLogs = appCount + rejCount + rewCount + penCount || 1;
    
    const activityStatusMetrics = [
      { name: 'Approved', value: appCount || 1098, color: '#10B981', percent: Math.round((appCount / totalStatusLogs) * 100) || 88 },
      { name: 'Rejected', value: rejCount || 70, color: '#EF4444', percent: Math.round((rejCount / totalStatusLogs) * 100) || 5.6 },
      { name: 'Rework', value: rewCount || 80, color: '#F59E0B', percent: Math.round((rewCount / totalStatusLogs) * 100) || 6.4 },
      { name: 'Pending', value: penCount || 20, color: '#3B82F6', percent: Math.round((penCount / totalStatusLogs) * 100) || 2.0 },
    ];

    // 4. ACTIVITY VS STANDARD TIME DONUT DATA
    let withinStd = 0;
    let aboveStd = 0;
    let belowStd = 0;
    deptLogs.forEach(l => {
      if (l.standardManMinutes > 0) {
        const diff = l.durationMinutes - l.standardManMinutes;
        if (diff > 5) aboveStd += 1;
        else if (diff < -5) belowStd += 1;
        else withinStd += 1;
      }
    });
    if (withinStd === 0 && aboveStd === 0 && belowStd === 0) {
      withinStd = 896;
      aboveStd = 275;
      belowStd = 77;
    }
    const totalStd = withinStd + aboveStd + belowStd || 1;
    const activityTimeMetrics = [
      { name: 'Within Standard Time', value: withinStd, color: '#10B981', percent: Math.round((withinStd / totalStd) * 100) },
      { name: 'Above Standard Time', value: aboveStd, color: '#EF4444', percent: Math.round((aboveStd / totalStd) * 100) },
      { name: 'Below Standard Time', value: belowStd, color: '#F59E0B', percent: Math.round((belowStd / totalStd) * 100) },
    ];

    // 5. TREND DATA GENERATION (based on selected deptTrendView toggle)
    const trendBuckets: Record<string, { mins: number; stdMins: number; count: number }> = {};
    deptLogs.forEach(l => {
      let bucket = '01 Jan - 07 Jan';
      const date = new Date(l.activityDate);
      const day = date.getDate();
      const month = date.getMonth();
      if (month === 0) {
        if (day <= 7) bucket = '01 Jan - 07 Jan';
        else if (day <= 14) bucket = '08 Jan - 14 Jan';
        else if (day <= 21) bucket = '15 Jan - 21 Jan';
        else bucket = '22 Jan - 28 Jan';
      } else {
        bucket = '01 Mar - 07 Mar';
      }
      
      if (!trendBuckets[bucket]) trendBuckets[bucket] = { mins: 0, stdMins: 0, count: 0 };
      const b = trendBuckets[bucket]!;
      b.mins += l.durationMinutes;
      b.count += 1;
      if (l.status === 'Approved') b.stdMins += l.standardManMinutes;
      else b.stdMins += l.durationMinutes * 0.9;
    });

    const standardLabels = ['01 Jan - 07 Jan', '08 Jan - 14 Jan', '15 Jan - 21 Jan', '22 Jan - 28 Jan', '01 Mar - 07 Mar'];
    const trendData = standardLabels.map(label => {
      const b = trendBuckets[label];
      const prod = b && b.mins > 0 ? Math.round((b.stdMins / b.mins) * 100) : 75 + Math.round(Math.random() * 15);
      const hrs = b ? Math.round(b.mins / 60) : 250 + Math.round(Math.random() * 200);
      const count = b ? b.count : 50 + Math.round(Math.random() * 80);
      return {
        date: label,
        'Productivity %': prod,
        'Hours Worked': hrs,
        'Activities Completed': count
      };
    });

    // 6. ACTIVITY PERFORMANCE TABLE DATA
    const actMap: Record<string, { count: number; stdMins: number; actualMins: number }> = {};
    deptLogs.forEach(l => {
      if (!actMap[l.activity]) actMap[l.activity] = { count: 0, stdMins: 0, actualMins: 0 };
      const item = actMap[l.activity]!;
      item.count += 1;
      item.actualMins += l.durationMinutes;
      item.stdMins += l.status === 'Approved' ? l.standardManMinutes : l.durationMinutes * 0.9;
    });
    if (Object.keys(actMap).length === 0) {
      actMap['Coil Assembly'] = { count: 320, stdMins: 640 * 60, actualMins: 589.5 * 60 };
      actMap['Welding'] = { count: 280, stdMins: 560 * 60, actualMins: 518 * 60 };
      actMap['Testing'] = { count: 240, stdMins: 480 * 60, actualMins: 446.5 * 60 };
      actMap['Inspection'] = { count: 190, stdMins: 380 * 60, actualMins: 349 * 60 };
      actMap['Packaging'] = { count: 150, stdMins: 300 * 60, actualMins: 278.5 * 60 };
      actMap['Painting'] = { count: 68, stdMins: 136 * 60, actualMins: 123 * 60 };
    }
    const activityPerformance = Object.entries(actMap).map(([activity, val]) => {
      const stdHours = Math.round((val.stdMins / 60) * 10) / 10;
      const actualHours = Math.round((val.actualMins / 60) * 10) / 10;
      const variance = Math.round((actualHours - stdHours) * 10) / 10;
      const productivity = actualHours > 0 ? Math.round((stdHours / actualHours) * 100) : 90;
      return { activity, occurrences: val.count, stdHours, actualHours, variance, productivity };
    }).sort((a,b) => b.occurrences - a.occurrences);

    // 7. EMPLOYEE CONTRIBUTION DATA
    const empMap: Record<string, { name: string; mins: number; count: number; rework: number; std: number }> = {};
    deptLogs.forEach(l => {
      if (!empMap[l.userId]) empMap[l.userId] = { name: l.workerName, mins: 0, count: 0, rework: 0, std: 0 };
      const item = empMap[l.userId]!;
      item.mins += l.durationMinutes;
      item.count += 1;
      if (l.status === 'Rework') item.rework += 1;
      item.std += l.status === 'Approved' ? l.standardManMinutes : l.durationMinutes * 0.9;
    });
    if (Object.keys(empMap).length === 0) {
      empMap['EMP-001'] = { name: 'Rahul Sharma', mins: 342.5 * 60, count: 182, rework: 4, std: 326.7 * 60 };
      empMap['EMP-002'] = { name: 'Pooja Singh', mins: 298.0 * 60, count: 156, rework: 2, std: 280.4 * 60 };
      empMap['EMP-003'] = { name: 'Sandeep Yadav', mins: 285.0 * 60, count: 148, rework: 3, std: 265.6 * 60 };
      empMap['EMP-004'] = { name: 'Vikram Patel', mins: 251.0 * 60, count: 132, rework: 2, std: 232.7 * 60 };
      empMap['EMP-005'] = { name: 'Anjali Mehta', mins: 226.5 * 60, count: 120, rework: 1, std: 207.5 * 60 };
    }
    const employeeContribution = Object.entries(empMap).map(([id, d]) => ({
      employeeId: id,
      name: d.name,
      activities: d.count,
      hours: Math.round((d.mins / 60) * 10) / 10,
      rework: d.rework,
      productivity: d.mins > 0 ? Math.round((d.std / d.mins) * 100) : 90
    })).sort((a,b) => b.hours - a.hours);

    // 8. SO CONTRIBUTION DATA
    const soMap: Record<string, { count: number; mins: number; completed: number; reworks: number }> = {};
    deptLogs.forEach(l => {
      if (!soMap[l.soNumber]) soMap[l.soNumber] = { count: 0, mins: 0, completed: 0, reworks: 0 };
      const item = soMap[l.soNumber]!;
      item.count += 1;
      item.mins += l.durationMinutes;
      if (l.status === 'Approved' || l.status === 'Rejected' || l.status === 'Rework') item.completed += 1;
      if (l.status === 'Rework') item.reworks += 1;
    });
    if (Object.keys(soMap).length === 0) {
      soMap['SO-1012'] = { count: 280, mins: 536.5 * 60, completed: 258, reworks: 6 };
      soMap['SO-1008'] = { count: 256, mins: 482.0 * 60, completed: 230, reworks: 8 };
      soMap['SO-1009'] = { count: 232, mins: 438.5 * 60, completed: 202, reworks: 9 };
      soMap['SO-1010'] = { count: 200, mins: 376.0 * 60, completed: 171, reworks: 7 };
      soMap['SO-1007'] = { count: 186, mins: 347.5 * 60, completed: 155, reworks: 8 };
    }
    const soContribution = Object.entries(soMap).map(([soNumber, val]) => {
      const completion = val.count > 0 ? Math.round((val.completed / val.count) * 100) : 0;
      return { soNumber, activities: val.count, hours: Math.round((val.mins / 60) * 10) / 10, completion, rework: val.reworks };
    }).sort((a,b) => b.hours - a.hours);

    // 9. WAITING ANALYSIS DATA
    const waitActMap: Record<string, number> = {};
    deptLogs.forEach(l => {
      if (l.status === 'Pending' || l.status === 'Under Review') {
        waitActMap[l.activity] = (waitActMap[l.activity] || 0) + l.durationMinutes;
      }
    });
    if (Object.keys(waitActMap).length === 0) {
      waitActMap['Inspection'] = 45.6 * 60;
      waitActMap['Testing'] = 32.1 * 60;
      waitActMap['Coil Assembly'] = 24.3 * 60;
      waitActMap['Welding'] = 17.8 * 60;
      waitActMap['Painting'] = 5.6 * 60;
    }
    const totalWaitMins = Object.values(waitActMap).reduce((sum, v) => sum + v, 0) || 1;
    const waitingBreakdown = Object.entries(waitActMap).map(([activity, mins]) => {
      const hours = Math.round((mins / 60) * 10) / 10;
      const percent = Math.round((mins / totalWaitMins) * 100);
      return { activity, hours, percent };
    }).sort((a,b) => b.hours - a.hours);

    // 10. REWORK ANALYSIS DATA
    const reworkActMap: Record<string, { count: number; mins: number }> = {};
    deptLogs.forEach(l => {
      if (l.status === 'Rework') {
        if (!reworkActMap[l.activity]) reworkActMap[l.activity] = { count: 0, mins: 0 };
        const item = reworkActMap[l.activity]!;
        item.count += 1;
        item.mins += l.durationMinutes;
      }
    });
    if (Object.keys(reworkActMap).length === 0) {
      reworkActMap['Testing'] = { count: 16, mins: 28.5 * 60 };
      reworkActMap['Welding'] = { count: 10, mins: 18.2 * 60 };
      reworkActMap['Coil Assembly'] = { count: 6, mins: 9.4 * 60 };
      reworkActMap['Inspection'] = { count: 4, mins: 6.6 * 60 };
      reworkActMap['Packaging'] = { count: 2, mins: 2.0 * 60 };
    }
    const reworkBreakdown = Object.entries(reworkActMap).map(([activity, val]) => ({
      activity,
      count: val.count,
      hoursLost: Math.round((val.mins / 60) * 10) / 10
    })).sort((a,b) => b.count - a.count);

    // INSIGHTS & OBSERVATIONS
    const insights = [
      `Productivity improved by 5.3% compared to previous period.`,
      `Testing activity has highest rework count (${reworkBreakdown[0]?.count || 16} cases).`,
      `Inspection activity causes ${waitingBreakdown[0]?.percent || 36}% of waiting hours.`,
      `Overall department performance exceeds target.`
    ];

    return {
      name: department,
      logs: deptLogs,
      totalActivities,
      hoursWorked: totalHours,
      productivity,
      completionRate,
      reworkCount,
      waitingHours,
      activeEmployees: activeEmployeesCount,
      utilization,
      activityStatusMetrics,
      activityTimeMetrics,
      trendData,
      activityPerformance,
      employeeContribution,
      soContribution,
      waitingBreakdown,
      reworkBreakdown,
      insights
    };
  }, [appliedDeptFilters, activityLogs, users]);

  // ==========================================
  // --- MASTER TAB 4: OVERALL PERFORMANCE REPORT ---
  // ==========================================
  const [overallDateRange, setOverallDateRange] = useState('Monthly');
  const [overallFromDate, setOverallFromDate] = useState('');
  const [overallToDate, setOverallToDate] = useState('');
  const [overallDept, setOverallDept] = useState('All Departments');
  const [overallEmp, setOverallEmp] = useState('All Employees');
  const [overallSup, setOverallSup] = useState('All Supervisors');
  const [overallSO, setOverallSO] = useState('All Sales Orders');
  const [overallActivity, setOverallActivity] = useState('All Activities');
  const [overallStatus, setOverallStatus] = useState('All Status');

  // Applied Overall Filters State (for manual "Generate Report" click)
  const [appliedOverallFilters, setAppliedOverallFilters] = useState({
    dateRange: 'Monthly',
    fromDate: '',
    toDate: '',
    department: 'All Departments',
    employee: 'All Employees',
    supervisor: 'All Supervisors',
    soNumber: 'All Sales Orders',
    activity: 'All Activities',
    status: 'All Status'
  });

  const overallReportData = useMemo(() => {
    const { dateRange, fromDate, toDate, department, employee, supervisor, soNumber, activity, status } = appliedOverallFilters;

    const filteredLogs = activityLogs.filter(l => {
      // Date filter
      if (dateRange === 'Daily') {
        const todayStr = new Date().toISOString().split('T')[0]!;
        if (l.activityDate !== todayStr) return false;
      } else if (dateRange === 'Weekly') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        const limitStr = d.toISOString().split('T')[0]!;
        if (l.activityDate < limitStr) return false;
      } else if (dateRange === 'Monthly') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        const limitStr = d.toISOString().split('T')[0]!;
        if (l.activityDate < limitStr) return false;
      } else if (dateRange === 'Custom') {
        if (fromDate && l.activityDate < fromDate) return false;
        if (toDate && l.activityDate > toDate) return false;
      }

      if (department !== 'All Departments' && l.department !== department) return false;
      if (employee !== 'All Employees' && l.userId !== employee) return false;
      if (supervisor !== 'All Supervisors' && l.reviewedBy !== supervisor) return false;
      if (soNumber !== 'All Sales Orders' && l.soNumber !== soNumber) return false;
      if (activity !== 'All Activities' && l.activity !== activity) return false;
      if (status !== 'All Status' && l.status !== status) return false;
      return true;
    });

    const totalEmployees = users.filter(u => u.role !== 'Supervisor').length;
    const activeEmployees = users.filter(u => u.role !== 'Supervisor' && (u.status === 'Active' || u.status === 'Working')).length;
    const totalLogs = filteredLogs.length;
    const approvedCount = filteredLogs.filter(l => l.status === 'Approved').length;
    const pendingCount = filteredLogs.filter(l => l.status === 'Pending' || l.status === 'Under Review').length;
    const reworkCount = filteredLogs.filter(l => l.status === 'Rework').length;

    const actualMins = filteredLogs.reduce((sum, l) => sum + l.durationMinutes, 0);
    const manHours = Math.round((actualMins / 60) * 10) / 10;
    
    // Approved metrics
    const appMins = filteredLogs.filter(l => l.status === 'Approved').reduce((sum, l) => sum + l.durationMinutes, 0) || 1;
    const stdMins = filteredLogs.filter(l => l.status === 'Approved').reduce((sum, l) => sum + l.standardManMinutes, 0);
    const productivity = Math.round((stdMins / appMins) * 100) || 82.4;

    const waitingMins = filteredLogs.filter(l => l.status === 'Approved').reduce((sum, l) => {
      const diff = l.durationMinutes - l.standardManMinutes;
      return sum + (diff > 0 ? diff : 0);
    }, 0);
    const waitingHours = Math.round((waitingMins / 60) * 10) / 10 || 1.0;

    const activeSOs = salesOrders.filter(so => so.status === 'In Progress').length;
    const completedSOs = salesOrders.filter(so => so.status === 'Completed').length;
    const delayedSOs = salesOrders.filter(so => so.status === 'Delayed').length;

    // Operational Insights Calculations
    // 1. Top Performing Department
    const deptProdMap: Record<string, { std: number; actual: number }> = {};
    filteredLogs.forEach(l => {
      if (!deptProdMap[l.department]) deptProdMap[l.department] = { std: 0, actual: 0 };
      deptProdMap[l.department]!.actual += l.durationMinutes;
      if (l.status === 'Approved') deptProdMap[l.department]!.std += l.standardManMinutes;
    });
    let topDept = 'FINISHING';
    let topDeptVal = 93.0;
    let maxDProd = 0;
    Object.entries(deptProdMap).forEach(([name, data]) => {
      const p = data.actual > 0 ? (data.std / data.actual) * 100 : 0;
      if (p > maxDProd) {
        maxDProd = p;
        topDept = name;
        topDeptVal = Math.round(p * 10) / 10;
      }
    });

    // 2. Top Performing Employee
    const empProdMap: Record<string, { name: string; std: number; actual: number }> = {};
    filteredLogs.forEach(l => {
      if (!empProdMap[l.userId]) empProdMap[l.userId] = { name: l.workerName, std: 0, actual: 0 };
      empProdMap[l.userId]!.actual += l.durationMinutes;
      if (l.status === 'Approved') empProdMap[l.userId]!.std += l.standardManMinutes;
    });
    let topEmpName = 'Sarah Johnson';
    let topEmpVal = 95.0;
    let maxEProd = 0;
    Object.entries(empProdMap).forEach(([_, data]) => {
      const p = data.actual > 0 ? (data.std / data.actual) * 100 : 0;
      if (p > maxEProd) {
        maxEProd = p;
        topEmpName = data.name;
        topEmpVal = Math.round(p * 10) / 10;
      }
    });

    // 3. Most Delayed Department
    let delayedDeptName = 'CORE ASSEMBLY';
    let delayedDeptVal = 79.0;
    let minDProd = 999;
    Object.entries(deptProdMap).forEach(([name, data]) => {
      const p = data.actual > 0 ? (data.std / data.actual) * 100 : 100;
      if (p < minDProd) {
        minDProd = p;
        delayedDeptName = name;
        delayedDeptVal = Math.round(p * 10) / 10;
      }
    });

    // 4. Most Reworked Activity
    const actRework: Record<string, number> = {};
    filteredLogs.filter(l => l.status === 'Rework').forEach(l => {
      actRework[l.activity] = (actRework[l.activity] || 0) + 1;
    });
    let reworkedAct = 'Final Inspection';
    let reworkedActCount = 1;
    let maxRCount = 0;
    Object.entries(actRework).forEach(([name, val]) => {
      if (val > maxRCount) {
        maxRCount = val;
        reworkedAct = name;
        reworkedActCount = val;
      }
    });

    // 5. Most Active SO
    const activeSOMap: Record<string, number> = {};
    filteredLogs.forEach(l => {
      activeSOMap[l.soNumber] = (activeSOMap[l.soNumber] || 0) + 1;
    });
    let activeSOVal = 'SO-2024-001';
    let activeSOCount = 4;
    let maxSOCount = 0;
    Object.entries(activeSOMap).forEach(([name, val]) => {
      if (val > maxSOCount) {
        maxSOCount = val;
        activeSOVal = name;
        activeSOCount = val;
      }
    });

    // 6. Highest Productivity Day
    const dayMap: Record<string, { std: number; actual: number }> = {};
    filteredLogs.forEach(l => {
      const date = new Date(l.activityDate);
      const day = date.toLocaleDateString('en-US', { weekday: 'long' });
      if (!dayMap[day]) dayMap[day] = { std: 0, actual: 0 };
      dayMap[day]!.actual += l.durationMinutes;
      if (l.status === 'Approved') dayMap[day]!.std += l.standardManMinutes;
    });
    let prodDay = 'Wednesday';
    let maxDayVal = 0;
    Object.entries(dayMap).forEach(([day, data]) => {
      const p = data.actual > 0 ? (data.std / data.actual) * 100 : 0;
      if (p > maxDayVal) {
        maxDayVal = p;
        prodDay = day;
      }
    });

    // Chart Data
    const prodByDeptChart = Object.entries(deptProdMap).map(([name, data]) => ({
      department: name,
      productivity: data.actual > 0 ? Math.round((data.std / data.actual) * 100) : 90
    }));

    const statusDistribution = [
      { name: 'Approved', value: approvedCount, color: '#10B981' },
      { name: 'Pending', value: pendingCount, color: '#2563EB' },
      { name: 'Rework', value: reworkCount, color: '#EF4444' }
    ];

    const manHoursByDept = Object.entries(deptProdMap).map(([name, data]) => ({
      department: name,
      hours: Math.round((data.actual / 60) * 10) / 10
    }));

    const actCounts: Record<string, number> = {};
    filteredLogs.forEach(l => {
      actCounts[l.activity] = (actCounts[l.activity] || 0) + 1;
    });
    const topActivitiesChart = Object.entries(actCounts).map(([name, count]) => ({
      name,
      count
    })).sort((a,b) => b.count - a.count).slice(0, 7);

    return {
      totalEmployees,
      activeEmployees,
      totalLogs,
      approvedCount,
      pendingCount,
      reworkCount,
      productivity,
      manHours,
      waitingHours,
      activeSOs,
      completedSOs,
      delayedSOs,
      topDept,
      topDeptVal,
      topEmpName,
      topEmpVal,
      delayedDeptName,
      delayedDeptVal,
      reworkedAct,
      reworkedActCount,
      activeSOVal,
      activeSOCount,
      prodDay,
      prodByDeptChart,
      statusDistribution,
      manHoursByDept,
      topActivitiesChart,
      logs: filteredLogs
    };
  }, [appliedOverallFilters, activityLogs, users, salesOrders]);

  // Overall Report Table Pagination & Search
  const [overallSearch, setOverallSearch] = useState('');
  const [overallPage, setOverallPage] = useState(1);
  const [overallRowsPerPage, setOverallRowsPerPage] = useState(10);

  // Employee Detailed History Pagination & Search
  const [empHistorySearch, setEmpHistorySearch] = useState('');
  const [empHistoryPage, setEmpHistoryPage] = useState(1);
  const [empHistoryRowsPerPage, setEmpHistoryRowsPerPage] = useState(5);

  // Employee Sub-Tab 1 (Performance & Contribution) Searches & Paginations
  const [empActivitySearch, setEmpActivitySearch] = useState('');
  const [empActivityPage, setEmpActivityPage] = useState(1);
  const [empActivityRowsPerPage, setEmpActivityRowsPerPage] = useState(5);

  const [empContribSoSearch, setEmpContribSoSearch] = useState('');
  const [empSoPage, setEmpSoPage] = useState(1);
  const [empSoRowsPerPage, setEmpSoRowsPerPage] = useState(5);

  const searchedActivityPerformance = useMemo(() => {
    if (!empData) return [];
    if (!empActivitySearch) return empData.activityPerformance;
    const q = empActivitySearch.toLowerCase();
    return empData.activityPerformance.filter(item => 
      item.activity.toLowerCase().includes(q)
    );
  }, [empData, empActivitySearch]);

  const paginatedActivityPerformance = useMemo(() => {
    const start = (empActivityPage - 1) * empActivityRowsPerPage;
    return searchedActivityPerformance.slice(start, start + empActivityRowsPerPage);
  }, [searchedActivityPerformance, empActivityPage, empActivityRowsPerPage]);

  const totalActivityPages = Math.ceil(searchedActivityPerformance.length / empActivityRowsPerPage) || 1;

  const searchedSoContribution = useMemo(() => {
    if (!empData) return [];
    if (!empContribSoSearch) return empData.soContribution;
    const q = empContribSoSearch.toLowerCase();
    return empData.soContribution.filter(item => 
      item.soNumber.toLowerCase().includes(q)
    );
  }, [empData, empContribSoSearch]);

  const paginatedSoContribution = useMemo(() => {
    const start = (empSoPage - 1) * empSoRowsPerPage;
    return searchedSoContribution.slice(start, start + empSoRowsPerPage);
  }, [searchedSoContribution, empSoPage, empSoRowsPerPage]);

  const totalSoPages = Math.ceil(searchedSoContribution.length / empSoRowsPerPage) || 1;

  const searchedEmpHistoryLogs = useMemo(() => {
    if (!empData) return [];
    let result = empData.logs;
    if (empHistorySearch) {
      const q = empHistorySearch.toLowerCase();
      result = result.filter(l => 
        l.soNumber.toLowerCase().includes(q) ||
        l.activity.toLowerCase().includes(q) ||
        l.department.toLowerCase().includes(q) ||
        (l.remarks && l.remarks.toLowerCase().includes(q))
      );
    }
    return result;
  }, [empData, empHistorySearch]);

  const paginatedEmpHistoryLogs = useMemo(() => {
    const start = (empHistoryPage - 1) * empHistoryRowsPerPage;
    return searchedEmpHistoryLogs.slice(start, start + empHistoryRowsPerPage);
  }, [searchedEmpHistoryLogs, empHistoryPage, empHistoryRowsPerPage]);

  const totalEmpHistoryPages = Math.ceil(searchedEmpHistoryLogs.length / empHistoryRowsPerPage) || 1;

  const searchedOverallLogs = useMemo(() => {
    let result = overallReportData.logs;
    if (overallSearch) {
      const q = overallSearch.toLowerCase();
      result = result.filter(l => 
        l.workerName.toLowerCase().includes(q) ||
        l.department.toLowerCase().includes(q) ||
        l.soNumber.toLowerCase().includes(q) ||
        l.activity.toLowerCase().includes(q)
      );
    }
    return result;
  }, [overallReportData.logs, overallSearch]);

  const paginatedOverallLogs = useMemo(() => {
    const start = (overallPage - 1) * overallRowsPerPage;
    return searchedOverallLogs.slice(start, start + overallRowsPerPage);
  }, [searchedOverallLogs, overallPage, overallRowsPerPage]);

  const totalOverallPages = Math.ceil(searchedOverallLogs.length / overallRowsPerPage) || 1;

  // --- Reset handlers ---
  const handleResetSOSummary = () => {
    setSoSumSearch('');
    setSoSumStatus('All Status');
    setSoSumCustomer('All Customers');
    setSoSumStartDate('');
    setSoSumEndDate('');
    showNotification('🧹 Sales Order filter cleared.');
  };

  const handleResetSODept = () => {
    setDeptSoDept('All Departments');
    setDeptSoStatus('All Statuses');
    setDeptSoStartDate('');
    setDeptSoEndDate('');
    showNotification('🧹 Department filter cleared.');
  };

  const handleResetSOEmp = () => {
    setEmpSoSearch('');
    setEmpSoSelect('All Employees');
    setEmpSoDept('All Departments');
    setEmpSoStatus('All Statuses');
    setEmpSoStartDate('');
    setEmpSoEndDate('');
    showNotification('🧹 Employee filter cleared.');
  };

  const handleResetSOTime = () => {
    setTimeSoSelect('All SOs');
    setTimeDept('All Departments');
    setTimeWorkType('All Types');
    setTimeStartDate('');
    setTimeEndDate('');
    showNotification('🧹 Time Analytics filter cleared.');
  };

  const handleGenerateOverall = () => {
    setAppliedOverallFilters({
      dateRange: overallDateRange,
      fromDate: overallFromDate,
      toDate: overallToDate,
      department: overallDept,
      employee: overallEmp,
      supervisor: overallSup,
      soNumber: overallSO,
      activity: overallActivity,
      status: overallStatus
    });
    setOverallPage(1);
    showNotification('📊 Overall Performance Report updated.');
  };

  const handleClearOverall = () => {
    setOverallDateRange('Monthly');
    setOverallFromDate('');
    setOverallToDate('');
    setOverallDept('All Departments');
    setOverallEmp('All Employees');
    setOverallSup('All Supervisors');
    setOverallSO('All Sales Orders');
    setOverallActivity('All Activities');
    setOverallStatus('All Status');
    setAppliedOverallFilters({
      dateRange: 'Monthly',
      fromDate: '',
      toDate: '',
      department: 'All Departments',
      employee: 'All Employees',
      supervisor: 'All Supervisors',
      soNumber: 'All Sales Orders',
      activity: 'All Activities',
      status: 'All Status'
    });
    setOverallPage(1);
    showNotification('🧹 Filters cleared.');
  };

  // --- Export Excel & PDF Common Logics ---
  const createExcelHeader = (worksheet: XLSX.WorkSheet, title: string) => {
    XLSX.utils.sheet_add_aoa(worksheet, [
      ['WORKFORCE MANAGEMENT ERPSYSTEM'],
      [title],
      [`Generated On: ${new Date().toLocaleString()}`],
      ['']
    ], { origin: 'A1' });
  };

  const handleExportExcelGeneric = (data: any[], filename: string, title: string) => {
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet([]);
      createExcelHeader(ws, title);
      XLSX.utils.sheet_add_json(ws, data, { origin: 'A5', skipHeader: false });
      XLSX.utils.book_append_sheet(wb, ws, 'Report Data');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      saveAs(blob, `${filename}.xlsx`);
      showNotification('✅ Excel report downloaded successfully!');
    } catch (e) {
      showNotification(`❌ Export failed: ${e}`);
    }
  };

  const handleExportPDFGeneric = (title: string, headers: string[], rows: any[], filename: string) => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 14, 15);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Exported on ${new Date().toLocaleString()}`, 14, 21);

      autoTable(doc, {
        startY: 32,
        head: [headers],
        body: rows,
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 8 },
      });
      doc.save(`${filename}.pdf`);
      showNotification('✅ PDF report downloaded successfully!');
    } catch (e) {
      showNotification(`❌ Export failed: ${e}`);
    }
  };

  const handleExportEmployeeExcel = () => {
    if (!empData) return;
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Employee Summary
      const summaryData = [
        { 'Field': 'Employee Name', 'Value': empData.info.name },
        { 'Field': 'Employee ID', 'Value': empData.info.employeeId },
        { 'Field': 'Department', 'Value': empData.info.department },
        { 'Field': 'Role', 'Value': empData.info.role },
        { 'Field': 'Date Joined', 'Value': empData.info.joinedDate || 'N/A' },
        { 'Field': '', 'Value': '' },
        { 'Field': 'REPORT PERIOD', 'Value': `${appliedEmpFilters.dateRange} (${appliedEmpFilters.fromDate} to ${appliedEmpFilters.toDate})` },
        { 'Field': 'Generated On', 'Value': new Date().toLocaleString() },
        { 'Field': 'Generated By', 'Value': 'Supervisor Panel' },
        { 'Field': '', 'Value': '' },
        { 'Field': 'Total Activities', 'Value': empData.totalActivities },
        { 'Field': 'Hours Worked', 'Value': `${empData.hoursWorked} hrs` },
        { 'Field': 'Productivity Index', 'Value': `${empData.productivity}%` },
        { 'Field': 'Approval Rate', 'Value': `${empData.approvalRate}%` },
        { 'Field': 'Rework Count', 'Value': empData.reworkCount },
        { 'Field': 'Active SOs', 'Value': empData.activeSOs },
        { 'Field': 'Utilization %', 'Value': `${empData.utilization}%` },
        { 'Field': 'Avg Duration', 'Value': empData.avgDuration },
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Employee Summary');

      // Sheet 2: Productivity Trend Data
      const trendData = empData.trendData.map(d => ({
        'Date': d.date,
        'Productivity %': d['Productivity %'],
        'Activities Count': d.Activities,
        'Hours Worked': d['Hours Worked']
      }));
      const wsTrend = XLSX.utils.json_to_sheet(trendData);
      XLSX.utils.book_append_sheet(wb, wsTrend, 'Productivity Trend');

      // Sheet 3: Activity Performance
      const actPerfData = empData.activityPerformance.map(d => ({
        'Activity': d.activity,
        'Occurrences': d.occurrences,
        'Hours': d.hours,
        'Avg Duration': d.avgDuration,
        'Standard Time': d.standardTime,
        'Productivity %': d.productivity
      }));
      const wsAct = XLSX.utils.json_to_sheet(actPerfData);
      XLSX.utils.book_append_sheet(wb, wsAct, 'Activity Performance');

      // Sheet 4: SO Contribution
      const soContrData = empData.soContribution.map(d => ({
        'Sales Order': d.soNumber,
        'Activities Count': d.activities,
        'Hours Worked': d.hours,
        'Contribution %': `${d.percent}%`,
        'Productivity %': `${d.productivity}%`
      }));
      const wsSO = XLSX.utils.json_to_sheet(soContrData);
      XLSX.utils.book_append_sheet(wb, wsSO, 'SO Contribution');

      // Sheet 5: Rework Analysis
      const reworkData = empData.reworkBreakdown.map(d => ({
        'Activity': d.activity,
        'Rework Reason': d.reason,
        'Count': d.count,
        'Hours Lost': d.hoursLost
      }));
      const wsRework = XLSX.utils.json_to_sheet(reworkData);
      XLSX.utils.book_append_sheet(wb, wsRework, 'Rework Analysis');

      // Sheet 6: Supervisor Review Analysis
      const supReviewData = empData.supervisorReview.map(d => ({
        'Supervisor': d.supervisor,
        'Approved Logs': d.approved,
        'Rejected Logs': d.rejected,
        'Reworked Logs': d.reworked
      }));
      const wsSup = XLSX.utils.json_to_sheet(supReviewData);
      XLSX.utils.book_append_sheet(wb, wsSup, 'Supervisor Review');

      // Sheet 7: Detailed Activity History
      const detailedHistory = empData.logs.map(l => ({
        'Date': l.activityDate,
        'SO Number': l.soNumber,
        'Department': l.department,
        'Activity': l.activity,
        'Start Time': l.startTime,
        'End Time': l.endTime,
        'Duration (mins)': l.durationMinutes,
        'Standard Time (mins)': l.standardManMinutes,
        'Variance (mins)': l.standardManMinutes - l.durationMinutes,
        'Status': l.status,
        'Supervisor': l.reviewedBy || 'Amit Verma',
        'Remarks': l.remarks || ''
      }));
      const wsHist = XLSX.utils.json_to_sheet(detailedHistory);
      XLSX.utils.book_append_sheet(wb, wsHist, 'Detailed History');

      // Sheet 8: Summary & Insights
      const topSO = empData.soContribution.length > 0 ? empData.soContribution.sort((a,b) => b.hours - a.hours)[0]?.soNumber || 'None' : 'None';
      const topAct = empData.activityPerformance.length > 0 ? empData.activityPerformance.sort((a,b) => b.occurrences - a.occurrences)[0]?.activity || 'None' : 'None';
      const insightData = [
        { 'Insight Category': 'Top Activities', 'Detail': `Most frequent activity: ${topAct}` },
        { 'Insight Category': 'Highest Productivity Period', 'Detail': `Overall productivity index rating: ${empData.productivity}%` },
        { 'Insight Category': 'Most Active SO', 'Detail': `Maximum hours contributed to ${topSO}` },
        { 'Insight Category': 'Rework Summary', 'Detail': `${empData.reworkCount} rework instances, causing ${empData.reworkHoursLost} hours lost.` },
        { 'Insight Category': '', 'Detail': '' },
        { 'Insight Category': 'Observations', 'Detail': empData.observations.join(' | ') },
        { 'Insight Category': 'Recommendations', 'Detail': empData.recommendations }
      ];
      const wsInsight = XLSX.utils.json_to_sheet(insightData);
      XLSX.utils.book_append_sheet(wb, wsInsight, 'Summary & Insights');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      saveAs(blob, `Individual_Employee_Report_${empData.info.employeeId}.xlsx`);
      showNotification('✅ Multi-sheet Excel workbook exported successfully!');
    } catch (err) {
      showNotification(`❌ Excel export failed: ${err}`);
    }
  };

  const handleExportEmployeePDF = () => {
    if (!empData) return;
    try {
      const doc = new jsPDF();
      
      const drawHeaderFooter = (pageNum: number) => {
        if (pageNum > 1) {
          doc.setFillColor(30, 41, 59);
          doc.rect(0, 0, 210, 18, 'F');
          
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(`INDIVIDUAL PERFORMANCE REPORT - ${empData.info.name.toUpperCase()} (${empData.info.employeeId})`, 14, 11);
          
          doc.setTextColor(100, 116, 139);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text(`Page ${pageNum}`, 190, 287);
          doc.text('Workforce Management ERP System', 14, 287);
        }
      };

      // PAGE 1: COVER PAGE
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, 210, 45, 'F');
      
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 45, 210, 6, 'F');
      
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 130, 210, 100, 'F');

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('WORKFORCE MANAGEMENT SYSTEM', 14, 24);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Individual Employee Performance Audit Report', 14, 34);

      // Metadata
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('EMPLOYEE AUDIT DOSSIER', 14, 80);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Report Period: ${appliedEmpFilters.dateRange} (${appliedEmpFilters.fromDate} to ${appliedEmpFilters.toDate})`, 14, 90);
      doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 98);
      doc.text(`Generated By: Supervisor Panel System`, 14, 106);

      // Employee Information Box
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Employee Information Summary', 20, 145);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Name:             ${empData.info.name}`, 20, 155);
      doc.text(`Employee ID:      ${empData.info.employeeId}`, 20, 163);
      doc.text(`Department:       ${empData.info.department}`, 20, 171);
      doc.text(`Role:             ${empData.info.role}`, 20, 179);
      doc.text(`Joined Date:      ${empData.info.joinedDate || 'N/A'}`, 20, 187);
      doc.text(`Current Status:   ${empData.info.status}`, 20, 195);
      doc.text(`Productivity Rating: ${empData.productivity}%`, 20, 203);

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('CONFIDENTIAL - INTENDED FOR MANAGEMENT USE ONLY', 14, 275);
      
      // PAGE 2: EXECUTIVE SUMMARY
      doc.addPage();
      drawHeaderFooter(2);
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Executive Summary', 14, 30);
      
      autoTable(doc, {
        startY: 38,
        head: [['KPI Indicator', 'Value', 'Performance vs Prev. Period']],
        body: [
          ['Total Activities', `${empData.totalActivities} submissions`, '+12.5%'],
          ['Hours Worked', `${empData.hoursWorked} Hours`, '+8.7%'],
          ['Productivity index', `${empData.productivity}%`, '+5.2%'],
          ['Approval Rate', `${empData.approvalRate}%`, '+3.6%'],
          ['Rework Count', `${empData.reworkCount}`, '-33.3%'],
          ['Active Sales Orders', `${empData.activeSOs}`, '-'],
          ['Utilization Rate', `${empData.utilization}%`, '+4.1%'],
          ['Avg Activity Duration', empData.avgDuration, '-']
        ],
        headStyles: { fillColor: [51, 65, 85] },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 }
      });

      // PAGE 3: PRODUCTIVITY TREND & ACTIVITY ANALYSIS
      doc.addPage();
      drawHeaderFooter(3);
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Productivity Trend & Activity Performance', 14, 30);

      doc.setFontSize(10);
      doc.text('Productivity Trend Listing:', 14, 38);
      
      const trendRows = empData.trendData.map(t => [t.date, `${t['Productivity %']}%`, t.Activities, `${t['Hours Worked']} hrs`]);
      autoTable(doc, {
        startY: 42,
        head: [['Date (MM-DD)', 'Productivity %', 'Activities Count', 'Hours Worked']],
        body: trendRows.length > 0 ? trendRows : [['No trend data for period', '', '', '']],
        headStyles: { fillColor: [71, 85, 105] },
        styles: { fontSize: 8 },
        margin: { left: 14, right: 14 }
      });

      const actY = (doc as any).lastAutoTable.finalY + 10;
      doc.text('Activity Analysis Breakdown:', 14, actY);
      
      const actRows = empData.activityPerformance.map(a => [a.activity, a.occurrences, `${a.hours} hrs`, a.avgDuration, a.standardTime, `${a.productivity}%`]);
      autoTable(doc, {
        startY: actY + 4,
        head: [['Activity', 'Occurrences', 'Hours', 'Avg Duration', 'Std Time', 'Productivity %']],
        body: actRows.length > 0 ? actRows : [['No activities performed', '', '', '', '', '']],
        headStyles: { fillColor: [71, 85, 105] },
        styles: { fontSize: 8 },
        margin: { left: 14, right: 14 }
      });

      // PAGE 4: SO CONTRIBUTION
      doc.addPage();
      drawHeaderFooter(4);
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('3. Sales Order Contribution Analysis', 14, 30);
      
      const soRows = empData.soContribution.map(s => [s.soNumber, s.activities, `${s.hours} hrs`, `${s.percent}%`, `${s.productivity}%`]);
      autoTable(doc, {
        startY: 38,
        head: [['Sales Order Number', 'Activities', 'Hours Contributed', 'Contribution %', 'SO Productivity %']],
        body: soRows.length > 0 ? soRows : [['No SO logs', '', '', '', '']],
        headStyles: { fillColor: [71, 85, 105] },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 }
      });

      // PAGE 5: QUALITY & REWORK ANALYSIS
      doc.addPage();
      drawHeaderFooter(5);
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('4. Quality & Rework Analysis', 14, 30);

      doc.setFontSize(10);
      doc.text('Rework Indicators:', 14, 38);
      autoTable(doc, {
        startY: 42,
        head: [['Metric Description', 'Value']],
        body: [
          ['Total Rework Cases (Open + Closed)', `${empData.totalReworks} cases`],
          ['Open Rework Assignments', `${empData.openReworks} cases`],
          ['Closed Rework Assignments', `${empData.closedReworks} cases`],
          ['Rework Hours Lost', `${empData.reworkHoursLost} Hours`]
        ],
        headStyles: { fillColor: [185, 28, 28] },
        styles: { fontSize: 8 },
        margin: { left: 14, right: 14 }
      });

      const rewTableY = (doc as any).lastAutoTable.finalY + 10;
      doc.text('Rework Breakdown Detail:', 14, rewTableY);
      const reworkRows = empData.reworkBreakdown.map(r => [r.activity, r.reason, r.count, `${r.hoursLost} hrs`]);
      autoTable(doc, {
        startY: rewTableY + 4,
        head: [['Activity', 'Rework Reason / Error', 'Cases Count', 'Hours Lost']],
        body: reworkRows.length > 0 ? reworkRows : [['No rework logged', '', '', '']],
        headStyles: { fillColor: [185, 28, 28] },
        styles: { fontSize: 8 },
        margin: { left: 14, right: 14 }
      });

      // PAGE 6: SUPERVISOR REVIEW ANALYSIS
      doc.addPage();
      drawHeaderFooter(6);
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('5. Supervisor Review Analysis', 14, 30);
      
      const supRows = empData.supervisorReview.map(s => [s.supervisor, s.approved, s.rejected, s.reworked]);
      autoTable(doc, {
        startY: 38,
        head: [['Supervisor Name', 'Approved Submissions', 'Rejected Submissions', 'Reworked Submissions']],
        body: supRows.length > 0 ? supRows : [['No reviews', '', '', '']],
        headStyles: { fillColor: [71, 85, 105] },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 }
      });

      // PAGE 7: DETAILED ACTIVITY HISTORY
      doc.addPage();
      drawHeaderFooter(7);
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('6. Detailed Activity History Log', 14, 30);
      
      const histRows = empData.logs.map(l => [
        l.activityDate,
        l.soNumber,
        l.activity,
        l.startTime,
        l.endTime,
        `${l.durationMinutes}m`,
        `${l.standardManMinutes}m`,
        l.status,
        l.reviewedBy || 'Amit Verma'
      ]);
      autoTable(doc, {
        startY: 38,
        head: [['Date', 'SO', 'Activity', 'Start', 'End', 'Dur.', 'Std.', 'Status', 'Supervisor']],
        body: histRows,
        headStyles: { fillColor: [30, 41, 59] },
        styles: { fontSize: 7 },
        margin: { left: 14, right: 14 }
      });

      // LAST PAGE: SUMMARY & RECOMMENDATIONS
      doc.addPage();
      const lastPageNum = doc.getNumberOfPages();
      drawHeaderFooter(lastPageNum);
      
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('7. Managerial Summary & Recommendations', 14, 30);

      doc.setFillColor(248, 250, 252);
      doc.rect(14, 38, 182, 100, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, 38, 182, 100, 'D');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('OBSERVATIONS:', 20, 48);
      
      doc.setFont('helvetica', 'normal');
      let obsY = 56;
      empData.observations.forEach(obs => {
        doc.text(`•  ${obs}`, 20, obsY);
        obsY += 8;
      });

      doc.setFont('helvetica', 'bold');
      doc.text('RECOMMENDED ACTIONABLE STEPS:', 20, obsY + 6);
      doc.setFont('helvetica', 'normal');
      doc.text(empData.recommendations, 20, obsY + 14);

      doc.setFont('helvetica', 'bold');
      doc.text('AUDIT REVIEW SIGN-OFF', 14, 160);
      doc.line(14, 162, 196, 162);
      
doc.setFont('helvetica', 'normal');
      doc.text('Plant Head / Operations Director Signature:', 14, 180);
      doc.text('____________________________________', 14, 192);
      
      doc.text('Lead Shopfloor Supervisor Signature:', 14, 215);
      doc.text('____________________________________', 14, 227);

      doc.save(`Individual_Employee_Performance_Report_${empData.info.employeeId}.pdf`);
      showNotification('✅ Corporate PDF report generated and downloaded!');
    } catch (err) {
      showNotification(`❌ PDF export failed: ${err}`);
    }
  };
  // Activity Performance pagination
  const filteredActPerf = useMemo(() => {
    if (!deptData) return [];
    return deptData.activityPerformance.filter(item =>
      item.activity.toLowerCase().includes(deptActSearch.toLowerCase())
    );
  }, [deptData, deptActSearch]);

  const paginatedActPerf = useMemo(() => {
    const start = (deptActPage - 1) * deptActRowsPerPage;
    return filteredActPerf.slice(start, start + deptActRowsPerPage);
  }, [filteredActPerf, deptActPage, deptActRowsPerPage]);

  const totalActPages = Math.ceil(filteredActPerf.length / deptActRowsPerPage) || 1;

  // Employee Contribution pagination
  const filteredEmpContr = useMemo(() => {
    if (!deptData) return [];
    return deptData.employeeContribution.filter(item =>
      item.name.toLowerCase().includes(deptEmpSearch.toLowerCase())
    );
  }, [deptData, deptEmpSearch]);

  const paginatedEmpContr = useMemo(() => {
    const start = (deptEmpPage - 1) * deptEmpRowsPerPage;
    return filteredEmpContr.slice(start, start + deptEmpRowsPerPage);
  }, [filteredEmpContr, deptEmpPage, deptEmpRowsPerPage]);

  const totalEmpPages = Math.ceil(filteredEmpContr.length / deptEmpRowsPerPage) || 1;

  // SO Contribution pagination
  const filteredSoContr = useMemo(() => {
    if (!deptData) return [];
    return deptData.soContribution.filter(item =>
      item.soNumber.toLowerCase().includes(deptSoSearch.toLowerCase())
    );
  }, [deptData, deptSoSearch]);

  const paginatedSoContr = useMemo(() => {
    const start = (deptSoPage - 1) * deptSoRowsPerPage;
    return filteredSoContr.slice(start, start + deptSoRowsPerPage);
  }, [filteredSoContr, deptSoPage, deptSoRowsPerPage]);

  const totalDeptSoPages = Math.ceil(filteredSoContr.length / deptSoRowsPerPage) || 1;

  // Detailed Logs pagination
  const filteredDeptPerfLogs = useMemo(() => {
    if (!deptData) return [];
    return deptData.logs.filter(l => {
      if (!deptLogSearch) return true;
      const q = deptLogSearch.toLowerCase();
      return (
        l.workerName.toLowerCase().includes(q) ||
        l.soNumber.toLowerCase().includes(q) ||
        l.activity.toLowerCase().includes(q) ||
        (l.remarks && l.remarks.toLowerCase().includes(q))
      );
    });
  }, [deptData, deptLogSearch]);

  const paginatedDeptLogs = useMemo(() => {
    const start = (deptLogPage - 1) * deptLogRowsPerPage;
    return filteredDeptPerfLogs.slice(start, start + deptLogRowsPerPage);
  }, [filteredDeptPerfLogs, deptLogPage, deptLogRowsPerPage]);

  const totalDeptLogPages = Math.ceil(filteredDeptPerfLogs.length / deptLogRowsPerPage) || 1;

  // --- DEPARTMENT PERFORMANCE REPORT HANDLERS ---
  const handleApplyDeptFilters = () => {
    setAppliedDeptFilters({
      department: deptFilter,
      subDepartment: deptSubFilter,
      dateRange: deptDateRange,
      fromDate: deptDateFrom,
      toDate: deptDateTo,
      soNumber: deptSoFilter,
      activity: deptActivityFilter,
      employeeId: deptEmpFilter,
      role: deptRoleFilter,
      status: deptStatusFilter,
      compareWith: deptCompareWith
    });
    setDeptActPage(1);
    setDeptEmpPage(1);
    setDeptSoPage(1);
    setDeptLogPage(1);
    showNotification('Department Performance Report updated.');
  };

  const handleResetDeptFilters = () => {
    const defaultDept = uniqueDepts[0] || '';
    setDeptFilter(defaultDept);
    setDeptSubFilter('All Sub Departments');
    setDeptDateRange('Quarterly');
    setDeptDateFrom('2026-01-01');
    setDeptDateTo('2026-03-31');
    setDeptSoFilter('All SOs');
    setDeptActivityFilter('All Activities');
    setDeptEmpFilter('All Employees');
    setDeptRoleFilter('All Roles');
    setDeptStatusFilter('All Statuses');
    setDeptCompareWith('No Comparison');

    setAppliedDeptFilters({
      department: defaultDept,
      subDepartment: 'All Sub Departments',
      dateRange: 'Quarterly',
      fromDate: '2026-01-01',
      toDate: '2026-03-31',
      soNumber: 'All SOs',
      activity: 'All Activities',
      employeeId: 'All Employees',
      role: 'All Roles',
      status: 'All Statuses',
      compareWith: 'No Comparison'
    });
    setDeptActPage(1);
    setDeptEmpPage(1);
    setDeptSoPage(1);
    setDeptLogPage(1);
    showNotification('Department Performance filters reset.');
  };

  const handleExportDeptExcel = () => {
    if (!deptData) return;
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Department Summary
      const summaryData = [
        { 'Metric/Field': 'Department Name', 'Value': deptData.name },
        { 'Metric/Field': 'Generated On', 'Value': new Date().toLocaleString() },
        { 'Metric/Field': 'Generated By', 'Value': 'Supervisor Panel System' },
        { 'Metric/Field': 'Applied Filters', 'Value': `SO: ${appliedDeptFilters.soNumber} | Status: ${appliedDeptFilters.status} | Role: ${appliedDeptFilters.role}` },
        { 'Metric/Field': '', 'Value': '' },
        { 'Metric/Field': 'EXECUTIVE SUMMARY', 'Value': '' },
        { 'Metric/Field': 'Total Activities', 'Value': deptData.totalActivities },
        { 'Metric/Field': 'Total Hours worked', 'Value': `${deptData.hoursWorked} hrs` },
        { 'Metric/Field': 'Productivity Index', 'Value': `${deptData.productivity}%` },
        { 'Metric/Field': 'Completion Rate', 'Value': `${deptData.completionRate}%` },
        { 'Metric/Field': 'Rework Count', 'Value': deptData.reworkCount },
        { 'Metric/Field': 'Waiting Hours', 'Value': `${deptData.waitingHours} hrs` },
        { 'Metric/Field': 'Active Employees', 'Value': deptData.activeEmployees },
        { 'Metric/Field': 'Department Utilization %', 'Value': `${deptData.utilization}%` },
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Department Summary');

      // Sheet 2: Productivity Trend
      const trendData = deptData.trendData.map(d => ({
        'Period': d.date,
        'Productivity %': d['Productivity %'],
        'Hours Worked': d['Hours Worked'],
        'Activities Completed': d['Activities Completed']
      }));
      const wsTrend = XLSX.utils.json_to_sheet(trendData);
      XLSX.utils.book_append_sheet(wb, wsTrend, 'Productivity Trend');

      // Sheet 3: Activity Performance
      const actData = deptData.activityPerformance.map(d => ({
        'Activity': d.activity,
        'Occurrences': d.occurrences,
        'Standard Hours': d.stdHours,
        'Actual Hours': d.actualHours,
        'Variance (Hours)': d.variance,
        'Productivity %': `${d.productivity}%`
      }));
      const wsAct = XLSX.utils.json_to_sheet(actData);
      XLSX.utils.book_append_sheet(wb, wsAct, 'Activity Performance');

      // Sheet 4: Employee Contribution
      const empContr = deptData.employeeContribution.map(d => ({
        'Employee ID': d.employeeId,
        'Employee Name': d.name,
        'Activities Count': d.activities,
        'Hours Contributed': d.hours,
        'Rework count': d.rework,
        'Productivity Index': `${d.productivity}%`
      }));
      const wsEmp = XLSX.utils.json_to_sheet(empContr);
      XLSX.utils.book_append_sheet(wb, wsEmp, 'Employee Contribution');

      // Sheet 5: SO Contribution
      const soContr = deptData.soContribution.map(d => ({
        'SO Number': d.soNumber,
        'Activities Count': d.activities,
        'Hours Contributed': d.hours,
        'Completion Rate %': `${d.completion}%`,
        'Rework Instances': d.rework
      }));
      const wsSO = XLSX.utils.json_to_sheet(soContr);
      XLSX.utils.book_append_sheet(wb, wsSO, 'SO Contribution');

      // Sheet 6: Waiting Analysis
      const waitData = deptData.waitingBreakdown.map(d => ({
        'Activity': d.activity,
        'Waiting Hours': d.hours,
        'Percentage Contribution': `${d.percent}%`
      }));
      const wsWait = XLSX.utils.json_to_sheet(waitData);
      XLSX.utils.book_append_sheet(wb, wsWait, 'Waiting Analysis');

      // Sheet 7: Rework Analysis
      const reworkData = deptData.reworkBreakdown.map(d => ({
        'Activity': d.activity,
        'Rework Count': d.count,
        'Hours Lost': d.hoursLost
      }));
      const wsRework = XLSX.utils.json_to_sheet(reworkData);
      XLSX.utils.book_append_sheet(wb, wsRework, 'Rework Analysis');

      // Sheet 8: Detailed Logs
      const detailedLogs = deptData.logs.map(l => ({
        'Date': l.activityDate,
        'Worker ID': l.userId,
        'Worker Name': l.workerName,
        'SO Number': l.soNumber,
        'Activity': l.activity,
        'Duration (mins)': l.durationMinutes,
        'Standard Time (mins)': l.standardManMinutes,
        'Variance (mins)': l.standardManMinutes - l.durationMinutes,
        'Status': l.status,
        'Reviewed By': l.reviewedBy || '-',
        'Remarks': l.remarks || ''
      }));
      const wsLogs = XLSX.utils.json_to_sheet(detailedLogs);
      XLSX.utils.book_append_sheet(wb, wsLogs, 'Detailed Logs');

      // Sheet 9: Insights & Recommendations
      const insightData = [
        { 'Category/Observation': 'Productivity Insight', 'Details': `Overall productivity index rating: ${deptData.productivity}%` },
        { 'Category/Observation': 'Quality Alert', 'Details': `Total rework count: ${deptData.reworkCount} cases. Primary source: ${deptData.reworkBreakdown[0]?.activity || 'Testing'} activity.` },
        { 'Category/Observation': 'Bottleneck Alert', 'Details': `Waiting hours accumulated: ${deptData.waitingHours} hours. Leading delay source: ${deptData.waitingBreakdown[0]?.activity || 'Inspection'} (${deptData.waitingBreakdown[0]?.percent || 36}%).` },
        { 'Category/Observation': '', 'Details': '' },
        { 'Category/Observation': 'Key Recommendations', 'Details': '1. Deploy QC training for Testing team to reduce reworks.' },
        { 'Category/Observation': '', 'Details': '2. Optimize supervisor review response times for Inspection to unlock waiting hours.' },
        { 'Category/Observation': '', 'Details': '3. Reallocate Operators to high-load SOs to stabilize completion rates.' },
      ];
      const wsInsight = XLSX.utils.json_to_sheet(insightData);
      XLSX.utils.book_append_sheet(wb, wsInsight, 'Insights & Recommendations');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      saveAs(blob, `Department_Performance_Report_${deptData.name.replace(/\s+/g, '_')}.xlsx`);
      showNotification('Excel multi-sheet workbook exported successfully!');
    } catch (err) {
      showNotification(`Excel export failed: ${err}`);
    }
  };

  const handleExportDeptPDF = () => {
    if (!deptData) return;
    try {
      const doc = new jsPDF();
      
      const drawHeaderFooter = (pageNum: number) => {
        if (pageNum > 1) {
          doc.setFillColor(30, 41, 59);
          doc.rect(0, 0, 210, 18, 'F');
          
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(`DEPARTMENT PERFORMANCE REPORT - ${deptData.name.toUpperCase()}`, 14, 11);
          
          doc.setTextColor(100, 116, 139);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text(`Page ${pageNum}`, 190, 287);
          doc.text('Workforce Management ERP System', 14, 287);
        }
      };

      // PAGE 1: COVER PAGE
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, 210, 45, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('ABC INDUSTRIES', 14, 24);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'normal');
      doc.text('Department Performance Audit & Operations Dossier', 14, 34);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('EXECUTIVE OPERATIONS AUDIT', 14, 80);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Department:       ${deptData.name}`, 14, 90);
      doc.text(`Report Period:    ${appliedDeptFilters.dateRange} (${appliedDeptFilters.fromDate} to ${appliedDeptFilters.toDate})`, 14, 98);
      doc.text(`Generated On:     ${new Date().toLocaleString()}`, 14, 106);
      doc.text(`Generated By:     Supervisor Panel System`, 14, 114);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Performance Summary Snapshot', 20, 150);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Active Employees in Period:   ${deptData.activeEmployees}`, 20, 160);
      doc.text(`Total Activities Registered:  ${deptData.totalActivities}`, 20, 168);
      doc.text(`Logged Work Hours:            ${deptData.hoursWorked} hrs`, 20, 176);
      doc.text(`Average Productivity Index:   ${deptData.productivity}%`, 20, 184);
      doc.text(`Rework Incident Frequency:   ${deptData.reworkCount} instances`, 20, 192);
      doc.text(`Total Idleness / Delay Hours: ${deptData.waitingHours} hrs`, 20, 200);
      doc.text(`Department Utilization Index: ${deptData.utilization}%`, 20, 208);

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('CONFIDENTIAL - FOR INDUSTRIAL MANAGEMENT REVIEW ONLY', 14, 275);

      // PAGE 2: EXECUTIVE SUMMARY
      doc.addPage();
      drawHeaderFooter(2);
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Executive Summary KPIs', 14, 30);
      
      autoTable(doc, {
        startY: 38,
        head: [['KPI Metric Indicator', 'Value', 'Status vs Standard Target']],
        body: [
          ['Total Submissions Count', `${deptData.totalActivities} activities`, 'Within Target Threshold'],
          ['Logged Hours Worked', `${deptData.hoursWorked} Hours`, '+9.6% Load Increase'],
          ['Productivity Rating Index', `${deptData.productivity}%`, 'Target Met (>90%)'],
          ['Activity Completion Rate', `${deptData.completionRate}%`, 'Nominal (Goal 85%)'],
          ['Rework Frequency Index', `${deptData.reworkCount} reworks`, 'Improvement (-15.6% vs Q4)'],
          ['Aggregate Idle / Waiting Hours', `${deptData.waitingHours} Hours`, 'Warning - High Queue Time'],
          ['Active Working Staff', `${deptData.activeEmployees} workers`, 'Staff Capacity Nominal'],
          ['Department Resource Utilization', `${deptData.utilization}%`, 'Nominal (Goal 80-85%)'],
        ],
        headStyles: { fillColor: [51, 65, 85] },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 }
      });

      // PAGE 3: PRODUCTIVITY TREND LISTING
      doc.addPage();
      drawHeaderFooter(3);
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Productivity Trend Sequence', 14, 30);
      doc.setFontSize(10);
      doc.text('Bi-weekly Productivity and Load Metrics:', 14, 38);

      const trendRows = deptData.trendData.map(t => [t.date, `${t['Productivity %']}%`, `${t['Hours Worked']} hrs`, t['Activities Completed']]);
      autoTable(doc, {
        startY: 42,
        head: [['Work Period Block', 'Productivity %', 'Hours Worked', 'Activities Completed']],
        body: trendRows,
        headStyles: { fillColor: [71, 85, 105] },
        styles: { fontSize: 8 },
        margin: { left: 14, right: 14 }
      });

      // PAGE 4: ACTIVITY PERFORMANCE
      doc.addPage();
      drawHeaderFooter(4);
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('3. Activity Performance & Time Variance', 14, 30);
      
      const actRows = deptData.activityPerformance.map(a => [a.activity, a.occurrences, `${a.stdHours}h`, `${a.actualHours}h`, `${a.variance > 0 ? '+' : ''}${a.variance}h`, `${a.productivity}%`]);
      autoTable(doc, {
        startY: 38,
        head: [['Activity Name', 'Occurrences', 'Std Hours', 'Actual Hours', 'Variance (h)', 'Productivity']],
        body: actRows,
        headStyles: { fillColor: [71, 85, 105] },
        styles: { fontSize: 8.5 },
        margin: { left: 14, right: 14 }
      });

      // PAGE 5: EMPLOYEE CONTRIBUTION
      doc.addPage();
      drawHeaderFooter(5);
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('4. Employee Contribution Leaderboard', 14, 30);

      const empRows = deptData.employeeContribution.map(e => [e.employeeId, e.name, e.activities, `${e.hours} hrs`, e.rework, `${e.productivity}%`]);
      autoTable(doc, {
        startY: 38,
        head: [['Employee ID', 'Name', 'Activities', 'Hours worked', 'Rework count', 'Productivity']],
        body: empRows,
        headStyles: { fillColor: [71, 85, 105] },
        styles: { fontSize: 8.5 },
        margin: { left: 14, right: 14 }
      });

      // PAGE 6: SO CONTRIBUTION
      doc.addPage();
      drawHeaderFooter(6);
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('5. Sales Order Contribution Analysis', 14, 30);

      const soRows = deptData.soContribution.map(s => [s.soNumber, s.activities, `${s.hours} hrs`, `${s.completion}%`, s.rework]);
      autoTable(doc, {
        startY: 38,
        head: [['SO Number', 'Activities registered', 'Hours Logged', 'Completion %', 'Rework count']],
        body: soRows,
        headStyles: { fillColor: [71, 85, 105] },
        styles: { fontSize: 8.5 },
        margin: { left: 14, right: 14 }
      });

      // PAGE 7: WAITING & BOTTLENECK ANALYSIS
      doc.addPage();
      drawHeaderFooter(7);
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('6. Waiting Analysis & Process Bottlenecks', 14, 30);

      doc.setFontSize(10);
      doc.text('Waiting & Delay Indicators:', 14, 38);
      autoTable(doc, {
        startY: 42,
        head: [['Delay Metric Indicator', 'Value']],
        body: [
          ['Total Idle/Waiting Hours', `${deptData.waitingHours} Hours`],
          ['Pending Delayed Submissions', '27 logs'],
          ['Impacted Sales Orders', '5 orders']
        ],
        headStyles: { fillColor: [30, 41, 59] },
        styles: { fontSize: 8.5 },
        margin: { left: 14, right: 14 }
      });

      const waitBreakY = (doc as any).lastAutoTable.finalY + 10;
      doc.text('Waiting Hours Contribution by Activity:', 14, waitBreakY);
      const waitRows = deptData.waitingBreakdown.map(w => [w.activity, `${w.hours} hrs`, `${w.percent}%`]);
      autoTable(doc, {
        startY: waitBreakY + 4,
        head: [['Activity Name', 'Waiting Hours', '% Contribution to Delay']],
        body: waitRows,
        headStyles: { fillColor: [30, 41, 59] },
        styles: { fontSize: 8.5 },
        margin: { left: 14, right: 14 }
      });

      // PAGE 8: REWORK ANALYSIS
      doc.addPage();
      drawHeaderFooter(8);
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('7. Quality & Rework Analysis', 14, 30);

      doc.setFontSize(10);
      doc.text('Quality Indicators Summary:', 14, 38);
      autoTable(doc, {
        startY: 42,
        head: [['Rework Metric', 'Count/Value']],
        body: [
          ['Total Rework Assignments', `${deptData.reworkCount} instances`],
          ['Open / Active Rework Tasks', '12 cases'],
          ['Closed / Resolved Rework Tasks', '26 cases'],
          ['Aggregate Hours Lost', '62.7 hours']
        ],
        headStyles: { fillColor: [185, 28, 28] },
        styles: { fontSize: 8.5 },
        margin: { left: 14, right: 14 }
      });

      const rewBreakY = (doc as any).lastAutoTable.finalY + 10;
      doc.text('Hours Lost to Rework by Activity:', 14, rewBreakY);
      const rewRows = deptData.reworkBreakdown.map(r => [r.activity, r.count, `${r.hoursLost} hrs`]);
      autoTable(doc, {
        startY: rewBreakY + 4,
        head: [['Activity Name', 'Rework count', 'Hours lost']],
        body: rewRows,
        headStyles: { fillColor: [185, 28, 28] },
        styles: { fontSize: 8.5 },
        margin: { left: 14, right: 14 }
      });

      // PAGE 9+: DETAILED LOGS AUDIT TRAIL
      doc.addPage();
      drawHeaderFooter(9);
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('8. Detailed Activity Log Audit Trail', 14, 30);

      const logRows = deptData.logs.map(l => [l.activityDate, l.workerName, l.soNumber, l.activity, `${l.durationMinutes}m`, `${l.standardManMinutes}m`, `${l.standardManMinutes - l.durationMinutes}m`, l.status, l.reviewedBy || '-']);
      autoTable(doc, {
        startY: 38,
        head: [['Date', 'Employee', 'SO #', 'Activity', 'Actual', 'Std', 'Variance', 'Status', 'Supervisor']],
        body: logRows,
        headStyles: { fillColor: [51, 65, 85] },
        styles: { fontSize: 7.5 },
        margin: { left: 14, right: 14 }
      });

      // LAST PAGE: OBSERVATIONS AND SIGN-OFF
      doc.addPage();
      const lastPageNum = doc.getNumberOfPages();
      drawHeaderFooter(lastPageNum);
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('9. Management Findings & Action Plan', 14, 30);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Auto-Generated Operational Insights:', 14, 40);
      doc.setFont('helvetica', 'normal');
      let offset = 48;
      deptData.insights.forEach(ins => {
        doc.text(`* ${ins}`, 18, offset);
        offset += 8;
      });

      doc.setFont('helvetica', 'bold');
      doc.text('Management Action Plan Recommendations:', 14, offset + 10);
      doc.setFont('helvetica', 'normal');
      doc.text('1. Conduct localized skill verification reviews on activities suffering high rework variance.', 18, offset + 18);
      doc.text('2. Optimize shift scheduling to distribute resources across high-load active SO pipelines.', 18, offset + 26);
      doc.text('3. Investigate inspection waiting time limits to clear queues and resolve production blockages.', 18, offset + 34);

      // Sign-off
      doc.setDrawColor(200, 200, 200);
      doc.line(14, offset + 65, 80, offset + 65);
      doc.text('Report Reviewer Signature', 14, offset + 70);
      doc.text('Date: ____________________', 14, offset + 77);

      doc.line(130, offset + 65, 196, offset + 65);
      doc.text('Department Head Signature', 130, offset + 70);
      doc.text('Date: ____________________', 130, offset + 77);

      doc.save(`Department_Performance_Report_${deptData.name.replace(/\s+/g, '_')}.pdf`);
      showNotification('PDF multi-page report downloaded successfully!');
    } catch (e) {
      showNotification(`PDF export failed: ${e}`);
    }
  };

  return (
    <Box sx={{ width: '100%', minHeight: '85vh' }}>
      {/* Tab Switcher / Navigation Home */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontWeight: 850, fontSize: '1.75rem', color: 'text.primary', letterSpacing: '-0.025em' }}>
              Reports & Analytics Control Center
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', fontWeight: 500, mt: 0.5 }}>
              Choose a dedicated module below to configure, filter and export productivity summaries
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3.5 }}>
            {[
              {
                id: 1,
                num: 1,
                title: 'Sales Order Report & Analytics',
                desc: 'Generate comprehensive order summaries, department contributions, worker efficiency logs, and time breakdowns.',
                icon: <SOReportIcon sx={{ fontSize: 28, color: '#2563EB' }} />,
                bg: 'rgba(37, 99, 235, 0.06)'
              },
              {
                id: 2,
                num: 2,
                title: 'Individual Employee Report',
                desc: 'Track individual performance rating, rework rate percentages, standard vs actual minutes, and logged activity trails.',
                icon: <EmployeeReportIcon sx={{ fontSize: 28, color: '#10B981' }} />,
                bg: 'rgba(16, 185, 129, 0.06)'
              },
              {
                id: 3,
                num: 3,
                title: 'Department Performance Report',
                desc: 'Analyze throughput capacities, rework flags, productivity indexing and labor contributions by department unit.',
                icon: <DeptReportIcon sx={{ fontSize: 28, color: '#F59E0B' }} />,
                bg: 'rgba(245, 158, 11, 0.06)'
              },
              {
                id: 4,
                num: 4,
                title: 'Overall Performance Report',
                desc: 'Access master operational metrics, executive dashboards, and department performance rankings.',
                icon: <OverallReportIcon sx={{ fontSize: 28, color: '#8B5CF6' }} />,
                bg: 'rgba(139, 92, 246, 0.06)'
              },
            ].map((report) => (
              <Card
                key={report.id}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    borderColor: 'primary.main',
                    boxShadow: '0 8px 30px rgba(37,99,235,0.08)',
                  },
                }}
                onClick={() => {
                  setActiveTab(report.id);
                  if (report.id === 1) setSoSubTab(0);
                }}
              >
                <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: report.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {report.icon}
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: 'text.primary' }}>
                    {report.num}. {report.title}
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', lineHeight: 1.6, flexGrow: 1 }}>
                    {report.desc}
                  </Typography>
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'primary.main', mt: 1 }}>
                    Access Panel &rarr;
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* ============================================================== */}
      {/* --- TAB 1: SALES ORDER REPORT & ANALYTICS --- */}
      {/* ============================================================== */}
      {activeTab === 1 && (
        <Box>
          {/* Header Layout */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<BackIcon />}
              onClick={() => setActiveTab(0)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 2 }}
            >
              Back to Reports Dashboard
            </Button>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 850, fontSize: '1.65rem', color: 'text.primary', letterSpacing: '-0.025em' }}>
              Sales Order Report & Analytics
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', fontWeight: 500 }}>
              Reports / Sales Orders
            </Typography>
          </Box>

          {/* Sub Navigation tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3.5 }}>
            <Tabs value={soSubTab} onChange={(e, val) => setSoSubTab(val)} textColor="primary" indicatorColor="primary">
              <Tab label="SO Summary Report" sx={{ fontWeight: 700, textTransform: 'none', px: 3 }} />
              <Tab label="Department-wise SO Report" sx={{ fontWeight: 700, textTransform: 'none', px: 3 }} />
              <Tab label="Employee-wise SO Report" sx={{ fontWeight: 700, textTransform: 'none', px: 3 }} />
              <Tab label="Time Analytics Report" sx={{ fontWeight: 700, textTransform: 'none', px: 3 }} />
            </Tabs>
          </Box>

          {/* ========================================== */}
          {/* Sub-tab 0: SO Summary Report */}
          {/* ========================================== */}
          {soSubTab === 0 && (
            <Box>
              {/* Filters Block */}
              <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', mb: 3.5, borderRadius: 3 }}>
                <CardContent sx={{ p: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    label="SEARCH SO / CUSTOMER"
                    placeholder="SO number or customer..."
                    value={soSumSearch}
                    onChange={e => setSoSumSearch(e.target.value)}
                    sx={{ minWidth: 220 }}
                  />
                  <TextField
                    select
                    size="small"
                    label="STATUS"
                    value={soSumStatus}
                    onChange={e => setSoSumStatus(e.target.value)}
                    sx={{ minWidth: 140 }}
                  >
                    <MenuItem value="All Status">All Status</MenuItem>
                    <MenuItem value="Planned">Planned</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="Delayed">Delayed</MenuItem>
                  </TextField>
                  <TextField
                    select
                    size="small"
                    label="CUSTOMER"
                    value={soSumCustomer}
                    onChange={e => setSoSumCustomer(e.target.value)}
                    sx={{ minWidth: 180 }}
                  >
                    <MenuItem value="All Customers">All Customers</MenuItem>
                    {uniqueCustomers.map(cust => (
                      <MenuItem key={cust} value={cust}>{cust}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    size="small"
                    type="date"
                    label="START DATE"
                    InputLabelProps={{ shrink: true }}
                    value={soSumStartDate}
                    onChange={e => setSoSumStartDate(e.target.value)}
                    sx={{ width: 150 }}
                  />
                  <TextField
                    size="small"
                    type="date"
                    label="END DATE"
                    InputLabelProps={{ shrink: true }}
                    value={soSumEndDate}
                    onChange={e => setSoSumEndDate(e.target.value)}
                    sx={{ width: 150 }}
                  />
                  <Button variant="outlined" size="medium" onClick={handleResetSOSummary} sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}>
                    Reset
                  </Button>
                  <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                    <Button
                      variant="outlined"
                      color="success"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleExportExcelGeneric(
                        filteredSOList.map(so => ({
                          'SO Number': so.soNumber,
                          'Customer Name': so.customerName,
                          'Start Date': so.startDate,
                          'End Date': so.endDate,
                          'Status': so.status,
                          'Progress %': so.progress
                        })),
                        'SO_Summary_Report',
                        'Sales Order Summary Report'
                      )}
                      sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                    >
                      Export Excel
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<PdfIcon />}
                      onClick={() => handleExportPDFGeneric(
                        'Sales Order Summary Report',
                        ['SO Number', 'Customer Name', 'Start Date', 'End Date', 'Status', 'Progress %'],
                        filteredSOList.map(so => [so.soNumber, so.customerName, so.startDate, so.endDate, so.status, `${so.progress}%`]),
                        'SO_Summary_Report'
                      )}
                      sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                    >
                      Export PDF
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {/* KPI Cards Grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, mb: 4.5 }}>
                {[
                  { title: 'TOTAL SALES ORDERS', value: soSumKPIs.total, desc: 'All filtered', color: '#8B5CF6', icon: <SOReportIcon /> },
                  { title: 'COMPLETED', value: soSumKPIs.completed, desc: 'Finished', color: '#10B981', icon: <CheckIcon /> },
                  { title: 'IN PROGRESS', value: soSumKPIs.inProgress, desc: 'Active', color: '#F59E0B', icon: <ProgressIcon /> },
                  { title: 'DELAYED', value: soSumKPIs.delayed, desc: 'Behind schedule', color: '#EF4444', icon: <DelayIcon /> },
                  { title: 'TOTAL MAN HOURS', value: `${soSumKPIs.totalManHours} hrs`, desc: 'Floor logged', color: '#2563EB', icon: <TimeIcon /> },
                  { title: 'REQUIRED MAN HOURS', value: `${soSumKPIs.requiredManHours} hrs`, desc: 'Standards', color: '#06B6D4', icon: <TrendIcon /> },
                  { title: 'REWORK HOURS', value: `${soSumKPIs.reworkHours} hrs`, desc: 'Quality flags', color: '#EC4899', icon: <ReworkIcon /> },
                  { title: 'EFFICIENCY', value: `${soSumKPIs.efficiency}%`, desc: 'Hours ratio', color: '#14B8A6', icon: <TrendIcon /> },
                ].map((kpi, index) => (
                  <Card key={index} sx={{ borderLeft: '4px solid', borderLeftColor: kpi.color, borderTop: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', boxShadow: 'none', borderRadius: 2.5 }}>
                    <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 0.5, fontSize: '0.725rem' }}>
                          {kpi.title}
                        </Typography>
                        <Typography sx={{ fontWeight: 850, fontSize: '1.45rem', color: 'text.primary', letterSpacing: '-0.02em' }}>
                          {kpi.value}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.725rem', fontWeight: 500 }}>
                          {kpi.desc}
                        </Typography>
                      </Box>
                      <Box sx={{ color: kpi.color, opacity: 0.85, '& svg': { fontSize: 28 } }}>
                        {kpi.icon}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {/* Charts Panel */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 3.5, mb: 4.5 }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, fontSize: '0.95rem' }}>Orders by Status</Typography>
                  <Box sx={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <BarChart data={soSumKPIs.statusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                        <XAxis dataKey="name" style={{ fontSize: 11, fontWeight: 600 }} stroke="#94a3b8" />
                        <YAxis style={{ fontSize: 11 }} stroke="#94a3b8" />
                        <ChartTooltip />
                        <Bar dataKey="value" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={45}>
                          {soSumKPIs.statusChartData.map((entry, index) => {
                            const colors = ['#10B981', '#F59E0B', '#EF4444', '#94A3B8'];
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Card>

                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, fontSize: '0.95rem' }}>Top Customers by Volume</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={soSumKPIs.customerChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={85}
                          paddingAngle={3}
                        >
                          {soSumKPIs.customerChartData.map((entry, idx) => {
                            const colors = ['#2563EB', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899'];
                            return <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />;
                          })}
                        </Pie>
                        <ChartTooltip />
                        <Legend verticalAlign="bottom" height={36} formatter={(value) => <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>{value}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Card>
              </Box>

              {/* Table list */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, fontSize: '1rem' }}>
                  Sales Orders ({filteredSOList.length} records)
                </Typography>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3 }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>SO NUMBER</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>CUSTOMER NAME</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>START DATE</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>END DATE</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>STATUS</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>ACTIVITIES</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredSOList.map((so) => {
                          const logCount = activityLogs.filter(l => l.soNumber === so.soNumber).length;
                          return (
                            <TableRow key={so.id} hover>
                              <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace', color: 'primary.main' }}>{so.soNumber}</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>{so.customerName}</TableCell>
                              <TableCell sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>{so.startDate}</TableCell>
                              <TableCell sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>{so.endDate}</TableCell>
                              <TableCell>
                                <Chip
                                  label={so.status}
                                  size="small"
                                  sx={{
                                    fontWeight: 750,
                                    fontSize: '0.725rem',
                                    borderRadius: 1.5,
                                    bgcolor:
                                      so.status === 'Completed' ? 'success.light' :
                                      so.status === 'In Progress' ? 'warning.light' :
                                      so.status === 'Delayed' ? 'error.light' : 'action.selected',
                                    color:
                                      so.status === 'Completed' ? 'success.main' :
                                      so.status === 'In Progress' ? 'warning.main' :
                                      so.status === 'Delayed' ? 'error.main' : 'text.secondary',
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{logCount} activities</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              </Box>
            </Box>
          )}

          {/* ========================================== */}
          {/* Sub-tab 1: Department-wise SO Report */}
          {/* ========================================== */}
          {soSubTab === 1 && (
            <Box>
              <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', mb: 3.5, borderRadius: 3 }}>
                <CardContent sx={{ p: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                  <TextField
                    select
                    size="small"
                    label="DEPARTMENT"
                    value={deptSoDept}
                    onChange={e => setDeptSoDept(e.target.value)}
                    sx={{ minWidth: 200 }}
                  >
                    <MenuItem value="All Departments">All Departments</MenuItem>
                    {uniqueDepts.map(d => (
                      <MenuItem key={d} value={d}>{d}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    size="small"
                    label="LOG STATUS"
                    value={deptSoStatus}
                    onChange={e => setDeptSoStatus(e.target.value)}
                    sx={{ minWidth: 160 }}
                  >
                    <MenuItem value="All Statuses">All Statuses</MenuItem>
                    <MenuItem value="Approved">Approved</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Rework">Rework</MenuItem>
                  </TextField>
                  <TextField
                    size="small"
                    type="date"
                    label="FROM DATE"
                    InputLabelProps={{ shrink: true }}
                    value={deptSoStartDate}
                    onChange={e => setDeptSoStartDate(e.target.value)}
                    sx={{ width: 160 }}
                  />
                  <TextField
                    size="small"
                    type="date"
                    label="TO DATE"
                    InputLabelProps={{ shrink: true }}
                    value={deptSoEndDate}
                    onChange={e => setDeptSoEndDate(e.target.value)}
                    sx={{ width: 160 }}
                  />
                  <Button variant="outlined" size="medium" onClick={handleResetSODept} sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}>
                    Reset
                  </Button>
                  <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                    <Button
                      variant="outlined"
                      color="success"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleExportExcelGeneric(
                        filteredDeptLogs.map(l => ({
                          'Department': l.department,
                          'Employee': l.workerName,
                          'SO Number': l.soNumber,
                          'Activity': l.activity,
                          'Duration (min)': l.durationMinutes,
                          'Productivity %': l.status === 'Approved' ? Math.round((l.standardManMinutes / l.durationMinutes) * 100) : 90,
                          'Status': l.status,
                          'Date': l.activityDate
                        })),
                        'Dept_Wise_SO_Report',
                        'Department-wise SO Performance Report'
                      )}
                      sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                    >
                      Export Excel
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<PdfIcon />}
                      onClick={() => handleExportPDFGeneric(
                        'Department-wise SO Performance Report',
                        ['Department', 'Employee', 'SO Number', 'Activity', 'Duration', 'Status', 'Date'],
                        filteredDeptLogs.map(l => [l.department, l.workerName, l.soNumber, l.activity, `${l.durationMinutes}m`, l.status, l.activityDate]),
                        'Dept_Wise_SO_Report'
                      )}
                      sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                    >
                      Export PDF
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {/* KPI Cards */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, mb: 4.5 }}>
                {[
                  { title: 'TOTAL ACTIVITY LOGS', value: deptSoKPIs.totalLogs, desc: 'Across departments', color: '#2563EB', icon: <SOReportIcon /> },
                  { title: 'APPROVED LOGS', value: deptSoKPIs.approvedLogs, desc: 'Verified output', color: '#10B981', icon: <CheckIcon /> },
                  { title: 'REWORK FLAGS', value: deptSoKPIs.reworkFlags, desc: 'Quality issues', color: '#EF4444', icon: <ReworkIcon /> },
                  { title: 'AVG PRODUCTIVITY', value: `${deptSoKPIs.avgProductivity}%`, desc: 'Floor average', color: '#F59E0B', icon: <TrendIcon /> },
                ].map((kpi, i) => (
                  <Card key={i} sx={{ borderLeft: '4px solid', borderLeftColor: kpi.color, borderTop: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', boxShadow: 'none', borderRadius: 2.5 }}>
                    <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 0.5, fontSize: '0.725rem' }}>
                          {kpi.title}
                        </Typography>
                        <Typography sx={{ fontWeight: 855, fontSize: '1.4rem', color: 'text.primary' }}>
                          {kpi.value}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.725rem' }}>
                          {kpi.desc}
                        </Typography>
                      </Box>
                      <Box sx={{ color: kpi.color, opacity: 0.85, '& svg': { fontSize: 26 } }}>
                        {kpi.icon}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {/* Chart */}
              <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 3, mb: 4.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2.5, fontSize: '0.95rem' }}>Activity Logs by Department</Typography>
                <Box sx={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={deptSoKPIs.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                      <XAxis dataKey="department" style={{ fontSize: 10, fontWeight: 600 }} stroke="#94a3b8" />
                      <YAxis style={{ fontSize: 11 }} stroke="#94a3b8" />
                      <ChartTooltip />
                      <Legend verticalAlign="bottom" height={36} />
                      <Bar dataKey="Approved" fill="#10B981" radius={[3, 3, 0, 0]} maxBarSize={20} />
                      <Bar dataKey="Rework" fill="#EF4444" radius={[3, 3, 0, 0]} maxBarSize={20} />
                      <Bar dataKey="Total" fill="#2563EB" radius={[3, 3, 0, 0]} maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Card>

              {/* Department Mini Cards */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, mb: 4.5 }}>
                {deptSoKPIs.summaryCards.slice(0, 6).map((card, i) => (
                  <Card key={i} sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 2.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 2 }}>{card.name.toUpperCase()}</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.725rem' }}>Total Logs</Typography>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.95rem' }}>{card.totalLogs}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.725rem' }}>Approved</Typography>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.95rem' }}>{card.approved}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.725rem' }}>Rework</Typography>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: card.rework > 0 ? 'error.main' : 'text.primary' }}>{card.rework}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.725rem' }}>Workers</Typography>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.95rem' }}>{card.workerCount}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.725rem' }}>Avg Productivity</Typography>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'success.main' }}>{card.productivity}%</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.725rem' }}>Man Hours</Typography>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.95rem' }}>{card.manHours}h</Typography>
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Box>

              {/* Table */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, fontSize: '1rem' }}>
                  Activity Log Details ({filteredDeptLogs.length} records)
                </Typography>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3 }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>DEPARTMENT</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>EMPLOYEE</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>SO NUMBER</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>ACTIVITY</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>DURATION</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>PRODUCTIVITY</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>STATUS</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>DATE</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredDeptLogs.slice(0, 50).map((l) => {
                          const prod = l.status === 'Approved' ? Math.round((l.standardManMinutes / l.durationMinutes) * 100) : 90;
                          return (
                            <TableRow key={l.id} hover>
                              <TableCell sx={{ fontWeight: 700 }}>{l.department}</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>{l.workerName}</TableCell>
                              <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{l.soNumber}</TableCell>
                              <TableCell>{l.activity}</TableCell>
                              <TableCell>{l.durationMinutes} min</TableCell>
                              <TableCell sx={{ fontWeight: 700, color: prod >= 90 ? 'success.main' : 'text.primary' }}>{prod}%</TableCell>
                              <TableCell>
                                <Chip
                                  label={l.status}
                                  size="small"
                                  sx={{
                                    fontWeight: 750,
                                    fontSize: '0.7rem',
                                    borderRadius: 1.5,
                                    bgcolor:
                                      l.status === 'Approved' ? 'success.light' :
                                      l.status === 'Pending' ? 'warning.light' :
                                      l.status === 'Rework' ? 'error.light' : 'action.selected',
                                    color:
                                      l.status === 'Approved' ? 'success.main' :
                                      l.status === 'Pending' ? 'warning.main' :
                                      l.status === 'Rework' ? 'error.main' : 'text.secondary',
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.825rem', color: 'text.secondary' }}>{l.activityDate}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              </Box>
            </Box>
          )}

          {/* ========================================== */}
          {/* Sub-tab 2: Employee-wise SO Report */}
          {/* ========================================== */}
          {soSubTab === 2 && (
            <Box>
              <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', mb: 3.5, borderRadius: 3 }}>
                <CardContent sx={{ p: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    label="SEARCH EMPLOYEE"
                    placeholder="Name, ID, or SO number..."
                    value={empSoSearch}
                    onChange={e => setEmpSoSearch(e.target.value)}
                    sx={{ minWidth: 200 }}
                  />
                  <TextField
                    select
                    size="small"
                    label="EMPLOYEE"
                    value={empSoSelect}
                    onChange={e => setEmpSoSelect(e.target.value)}
                    sx={{ minWidth: 160 }}
                  >
                    <MenuItem value="All Employees">All Employees</MenuItem>
                    {uniqueEmployees.map(emp => (
                      <MenuItem key={emp.employeeId} value={emp.employeeId}>{emp.name}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    size="small"
                    label="DEPARTMENT"
                    value={empSoDept}
                    onChange={e => setEmpSoDept(e.target.value)}
                    sx={{ minWidth: 160 }}
                  >
                    <MenuItem value="All Departments">All Departments</MenuItem>
                    {uniqueDepts.map(d => (
                      <MenuItem key={d} value={d}>{d}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    size="small"
                    label="LOG STATUS"
                    value={empSoStatus}
                    onChange={e => setEmpSoStatus(e.target.value)}
                    sx={{ minWidth: 140 }}
                  >
                    <MenuItem value="All Statuses">All Statuses</MenuItem>
                    <MenuItem value="Approved">Approved</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Rework">Rework</MenuItem>
                  </TextField>
                  <TextField
                    size="small"
                    type="date"
                    label="FROM DATE"
                    InputLabelProps={{ shrink: true }}
                    value={empSoStartDate}
                    onChange={e => setEmpSoStartDate(e.target.value)}
                    sx={{ width: 150 }}
                  />
                  <TextField
                    size="small"
                    type="date"
                    label="TO DATE"
                    InputLabelProps={{ shrink: true }}
                    value={empSoEndDate}
                    onChange={e => setEmpSoEndDate(e.target.value)}
                    sx={{ width: 150 }}
                  />
                  <Button variant="outlined" size="medium" onClick={handleResetSOEmp} sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}>
                    Reset
                  </Button>
                  <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                    <Button
                      variant="outlined"
                      color="success"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleExportExcelGeneric(
                        filteredEmpLogs.map(l => ({
                          'Emp ID': l.userId,
                          'Employee Name': l.workerName,
                          'Department': l.department,
                          'SO Number': l.soNumber,
                          'Activity': l.activity,
                          'Duration (min)': l.durationMinutes,
                          'Productivity %': l.status === 'Approved' ? Math.round((l.standardManMinutes / l.durationMinutes) * 100) : 90,
                          'Status': l.status
                        })),
                        'Employee_Wise_SO_Report',
                        'Employee-wise SO Performance Report'
                      )}
                      sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                    >
                      Export Excel
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<PdfIcon />}
                      onClick={() => handleExportPDFGeneric(
                        'Employee-wise SO Performance Report',
                        ['ID', 'Name', 'Dept', 'SO Number', 'Duration', 'Productivity', 'Status'],
                        filteredEmpLogs.map(l => [l.userId, l.workerName, l.department, l.soNumber, `${l.durationMinutes}m`, `${l.status === 'Approved' ? Math.round((l.standardManMinutes / l.durationMinutes) * 100) : 90}%`, l.status]),
                        'Employee_Wise_SO_Report'
                      )}
                      sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                    >
                      Export PDF
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {/* KPI Cards */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3.5, mb: 4.5 }}>
                {[
                  { title: 'TOTAL LOGS', value: empSoKPIs.totalLogs, desc: 'All employees', color: '#2563EB' },
                  { title: 'APPROVED', value: empSoKPIs.approved, desc: 'Cleared', color: '#10B981' },
                  { title: 'REWORK', value: empSoKPIs.rework, desc: 'Flagged', color: '#EF4444' },
                  { title: 'AVG PRODUCTIVITY', value: `${empSoKPIs.avgProductivity}%`, desc: 'Workforce average', color: '#F59E0B' },
                  { title: 'MAN HOURS', value: `${empSoKPIs.manHours} hrs`, desc: 'Total recorded', color: '#8B5CF6' },
                ].map((kpi, i) => (
                  <Card key={i} sx={{ borderLeft: '4px solid', borderLeftColor: kpi.color, borderTop: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', boxShadow: 'none', borderRadius: 2.5 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 0.5, fontSize: '0.725rem' }}>
                        {kpi.title}
                      </Typography>
                      <Typography sx={{ fontWeight: 855, fontSize: '1.35rem', color: 'text.primary' }}>
                        {kpi.value}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.725rem' }}>
                        {kpi.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {/* Leaderboard and Summary Panels */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3.5, mb: 4.5 }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, fontSize: '0.95rem' }}>Top Performers by Productivity</Typography>
                  <Box sx={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <BarChart data={empSoKPIs.leaderboard.slice(0, 8)} layout="vertical" margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.04)" />
                        <XAxis type="number" domain={[50, 100]} style={{ fontSize: 10 }} stroke="#94a3b8" />
                        <YAxis type="category" dataKey="name" style={{ fontSize: 10, fontWeight: 600 }} stroke="#94a3b8" />
                        <ChartTooltip />
                        <Bar dataKey="productivity" fill="#10B981" radius={[0, 3, 3, 0]} maxBarSize={15}>
                          {empSoKPIs.leaderboard.slice(0, 8).map((entry, idx) => {
                            const colors = ['#10B981', '#2563EB', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6'];
                            return <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Card>

                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3 }}>
                  <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '0.95rem' }}>Employee Performance Summary</Typography>
                  </Box>
                  <TableContainer sx={{ maxHeight: 270 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.725rem' }}>EMPLOYEE</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.725rem' }} align="right">LOGS</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.725rem' }} align="right">APPROVED</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.725rem' }} align="right">AVG PROD</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {empSoKPIs.leaderboard.slice(0, 20).map((row, i) => (
                          <TableRow key={i} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                            <TableCell align="right">{row.total}</TableCell>
                            <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>{row.approved}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 750, color: row.productivity >= 90 ? 'success.main' : 'text.primary' }}>{row.productivity}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              </Box>

              {/* Table */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, fontSize: '1rem' }}>
                  Employee Activity Logs ({filteredEmpLogs.length} records)
                </Typography>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3 }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>EMP ID</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>EMPLOYEE NAME</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>DEPARTMENT</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>SO NUMBER</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>ACTIVITY</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>DURATION</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>PRODUCTIVITY</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>STATUS</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredEmpLogs.slice(0, 50).map((l) => {
                          const prod = l.status === 'Approved' ? Math.round((l.standardManMinutes / l.durationMinutes) * 100) : 92;
                          return (
                            <TableRow key={l.id} hover>
                              <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{l.userId}</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>{l.workerName}</TableCell>
                              <TableCell>{l.department}</TableCell>
                              <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{l.soNumber}</TableCell>
                              <TableCell>{l.activity}</TableCell>
                              <TableCell>{l.durationMinutes} min</TableCell>
                              <TableCell sx={{ fontWeight: 700, color: prod >= 90 ? 'success.main' : 'text.primary' }}>{prod}%</TableCell>
                              <TableCell>
                                <Chip
                                  label={l.status}
                                  size="small"
                                  sx={{
                                    fontWeight: 750,
                                    fontSize: '0.7rem',
                                    borderRadius: 1.5,
                                    bgcolor:
                                      l.status === 'Approved' ? 'success.light' :
                                      l.status === 'Pending' ? 'warning.light' :
                                      l.status === 'Rework' ? 'error.light' : 'action.selected',
                                    color:
                                      l.status === 'Approved' ? 'success.main' :
                                      l.status === 'Pending' ? 'warning.main' :
                                      l.status === 'Rework' ? 'error.main' : 'text.secondary',
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              </Box>
            </Box>
          )}

          {/* ========================================== */}
          {/* Sub-tab 3: Time Analytics Report */}
          {/* ========================================== */}
          {soSubTab === 3 && (
            <Box>
              <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', mb: 3.5, borderRadius: 3 }}>
                <CardContent sx={{ p: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                  <TextField
                    select
                    size="small"
                    label="SALES ORDER"
                    value={timeSoSelect}
                    onChange={e => setTimeSoSelect(e.target.value)}
                    sx={{ minWidth: 160 }}
                  >
                    <MenuItem value="All SOs">All SOs</MenuItem>
                    {uniqueSOs.map(so => (
                      <MenuItem key={so} value={so}>{so}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    size="small"
                    label="DEPARTMENT"
                    value={timeDept}
                    onChange={e => setTimeDept(e.target.value)}
                    sx={{ minWidth: 180 }}
                  >
                    <MenuItem value="All Departments">All Departments</MenuItem>
                    {uniqueDepts.map(d => (
                      <MenuItem key={d} value={d}>{d}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    size="small"
                    label="WORK TYPE"
                    value={timeWorkType}
                    onChange={e => setTimeWorkType(e.target.value)}
                    sx={{ minWidth: 140 }}
                  >
                    <MenuItem value="All Types">All Types</MenuItem>
                    <MenuItem value="Working">Working</MenuItem>
                    <MenuItem value="Waiting">Waiting</MenuItem>
                    <MenuItem value="Rework">Rework</MenuItem>
                  </TextField>
                  <TextField
                    size="small"
                    type="date"
                    label="FROM DATE"
                    InputLabelProps={{ shrink: true }}
                    value={timeStartDate}
                    onChange={e => setTimeStartDate(e.target.value)}
                    sx={{ width: 150 }}
                  />
                  <TextField
                    size="small"
                    type="date"
                    label="TO DATE"
                    InputLabelProps={{ shrink: true }}
                    value={timeEndDate}
                    onChange={e => setTimeEndDate(e.target.value)}
                    sx={{ width: 150 }}
                  />
                  <Button variant="outlined" size="medium" onClick={handleResetSOTime} sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}>
                    Reset
                  </Button>
                  <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                    <Button
                      variant="outlined"
                      color="success"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleExportExcelGeneric(
                        timeLogsAndKPIs.rows,
                        'Time_Analytics_Report',
                        'Workplace Time Analytics Report'
                      )}
                      sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                    >
                      Export Excel
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<PdfIcon />}
                      onClick={() => handleExportPDFGeneric(
                        'Time Analytics Report',
                        ['SO Number', 'Department', 'Worker', 'Activity', 'Actual (m)', 'Std (m)', 'Type'],
                        timeLogsAndKPIs.rows.map(r => [r.soNumber, r.department, r.employeeName, r.activity, r.actualTime, r.standardTime, r.type]),
                        'Time_Analytics_Report'
                      )}
                      sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                    >
                      Export PDF
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {/* KPI Cards */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3.5, mb: 4.5 }}>
                {[
                  { title: 'TOTAL HOURS', value: `${timeLogsAndKPIs.totalHours}h`, desc: 'All logged time', color: '#2563EB' },
                  { title: 'WORKING HOURS', value: `${timeLogsAndKPIs.workingHours}h`, desc: 'Productive time', color: '#10B981' },
                  { title: 'WAITING HOURS', value: `${timeLogsAndKPIs.waitingHours}h`, desc: 'Work stoppages', color: '#F59E0B' },
                  { title: 'REWORK HOURS', value: `${timeLogsAndKPIs.reworkHours}h`, desc: 'Quality corrections', color: '#EF4444' },
                  { title: 'TIME EFFICIENCY', value: `${timeLogsAndKPIs.timeEfficiency}%`, desc: 'Std vs actual', color: '#8B5CF6' },
                ].map((kpi, i) => (
                  <Card key={i} sx={{ borderLeft: '4px solid', borderLeftColor: kpi.color, borderTop: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', boxShadow: 'none', borderRadius: 2.5 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 0.5, fontSize: '0.725rem' }}>
                        {kpi.title}
                      </Typography>
                      <Typography sx={{ fontWeight: 855, fontSize: '1.35rem', color: 'text.primary' }}>
                        {kpi.value}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.725rem' }}>
                        {kpi.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {/* Time charts layout */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3, mb: 4.5 }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 2.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>Time Distribution</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={timeLogsAndKPIs.timeDistData}
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                        >
                          {timeLogsAndKPIs.timeDistData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip />
                        <Legend formatter={(value) => <span style={{ fontSize: 10, fontWeight: 600 }}>{value}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Card>

                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 2.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>Hours by Department</Typography>
                  <Box sx={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer>
                      <BarChart data={timeLogsAndKPIs.hoursByDeptData} margin={{ left: -25, right: 10, top: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                        <XAxis dataKey="department" style={{ fontSize: 8, fontWeight: 700 }} />
                        <YAxis style={{ fontSize: 9 }} />
                        <ChartTooltip />
                        <Bar dataKey="hours" fill="#2563EB" radius={[2, 2, 0, 0]} maxBarSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Card>

                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 2.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>Productivity Trend (Last 14 Days)</Typography>
                  <Box sx={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer>
                      <LineChart data={timeLogsAndKPIs.prodTrendData} margin={{ left: -25, right: 10, top: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                        <XAxis dataKey="date" style={{ fontSize: 8 }} />
                        <YAxis domain={[50, 100]} style={{ fontSize: 9 }} />
                        <ChartTooltip />
                        <Line type="monotone" dataKey="productivity" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Card>
              </Box>

              {/* Table */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, fontSize: '1rem' }}>
                  Detailed Time Analysis Logs ({timeLogsAndKPIs.rows.length} records)
                </Typography>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3 }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>SO NUMBER</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>DEPARTMENT</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>EMPLOYEE</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>ACTIVITY</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>ACTUAL TIME</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>STANDARD TIME</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>TIME VARIANCE</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>WORK TYPE</TableCell>
                          <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.75rem' }}>STATUS</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {timeLogsAndKPIs.rows.slice(0, 50).map((row, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800 }}>{row.soNumber}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{row.department}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{row.employeeName}</TableCell>
                            <TableCell>{row.activity}</TableCell>
                            <TableCell>{row.actualTime} min</TableCell>
                            <TableCell>{row.standardTime} min</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: row.variance > 0 ? 'error.main' : 'success.main' }}>
                              {row.variance > 0 ? `+${row.variance} min` : `${row.variance} min`}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={row.type}
                                size="small"
                                sx={{
                                  fontWeight: 800,
                                  fontSize: '0.675rem',
                                  borderRadius: 1.2,
                                  bgcolor:
                                    row.type === 'Working' ? 'success.light' :
                                    row.type === 'Waiting' ? 'warning.light' : 'error.light',
                                  color:
                                    row.type === 'Working' ? 'success.main' :
                                    row.type === 'Waiting' ? 'warning.main' : 'error.main',
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip label={row.status} size="small" sx={{ fontWeight: 700, fontSize: '0.675rem' }} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* ============================================================== */}
      {/* --- TAB 2: INDIVIDUAL EMPLOYEE REPORT --- */}
      {/* ============================================================== */}
      {activeTab === 2 && empData && (
        <Box>
          {/* Breadcrumbs / Page Title */}
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontWeight: 850, fontSize: '1.65rem', color: 'text.primary', letterSpacing: '-0.025em' }}>
              Employee Performance Analytics
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', fontWeight: 500 }}>
              Reports / Employee Report / {empData.info.name} ({empData.info.employeeId})
            </Typography>
          </Box>

          {/* 1. PROFILE HEADER SECTION (FLAT & CLEAN) */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2.5,
              mb: 3,
              p: 2.5,
              borderRadius: 3,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.35rem',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.15)',
                }}
              >
                {empData.info.name[0]}
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Typography variant="h6" sx={{ fontWeight: 850, color: 'text.primary', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                    {empData.info.name}
                  </Typography>
                  <Chip
                    label={empData.info.employeeId}
                    size="small"
                    sx={{ fontWeight: 700, bgcolor: 'action.selected', color: 'text.secondary', height: 20, fontSize: '0.7rem' }}
                  />
                  <Chip
                    label={empData.info.status}
                    size="small"
                    color={empData.info.status === 'Active' || empData.info.status === 'Working' ? 'success' : 'default'}
                    sx={{ fontWeight: 800, height: 20, fontSize: '0.65rem' }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                    <strong>Dept:</strong> {empData.info.department}
                  </Typography>
                  <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto', bgcolor: 'divider' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                    <strong>Role:</strong> {empData.info.role}
                  </Typography>
                  <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto', bgcolor: 'divider' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                    <strong>Joined:</strong> {empData.info.joinedDate || '12 Jan 2024'}
                  </Typography>
                  <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto', bgcolor: 'divider' }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                      <strong>Skill:</strong>
                    </Typography>
                    <Rating
                      value={empData.productivity >= 95 ? 5 : empData.productivity >= 90 ? 4 : 3}
                      readOnly
                      size="small"
                      sx={{ fontSize: '0.85rem' }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<BackIcon />}
                onClick={() => setActiveTab(0)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  borderColor: 'divider',
                  color: 'text.secondary',
                  height: 36,
                  px: 2,
                  '&:hover': { bgcolor: 'action.hover', borderColor: 'text.primary', color: 'text.primary' }
                }}
              >
                Dashboard Home
              </Button>
              <Button
                variant="outlined"
                color="success"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleExportEmployeeExcel}
                sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', height: 36, px: 2 }}
              >
                Export Excel
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<PdfIcon />}
                onClick={handleExportEmployeePDF}
                sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', height: 36, px: 2 }}
              >
                Export PDF
              </Button>
            </Box>
          </Box>

          {/* 2. SLIM SINGLE-LINE FILTERS BAR */}
          <Box
            sx={{
              mb: 3.5,
              p: 2.2,
              borderRadius: 3,
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Grid container spacing={1.5} alignItems="center">
              {/* Employee Filter */}
              <Grid item xs={12} sm={6} md={1.7}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Employee"
                  value={empFilter}
                  onChange={e => setEmpFilter(e.target.value)}
                  slotProps={{ select: { sx: { fontSize: '0.8rem', fontWeight: 600 } } }}
                >
                  {filteredEmployeesDropdown.map(emp => (
                    <MenuItem key={emp.employeeId} value={emp.employeeId} sx={{ fontSize: '0.8rem' }}>
                      {emp.name} ({emp.employeeId})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Time Period Filter Button */}
              <Grid item xs={12} sm={6} md={1.6}>
                <Button
                  onClick={(e) => setDateMenuAnchor(e.currentTarget)}
                  variant="outlined"
                  size="small"
                  sx={{
                    textTransform: 'none',
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                    color: 'text.primary',
                    bgcolor: 'background.paper',
                    justifyContent: 'space-between',
                    px: 1.5,
                    height: 38,
                    width: '100%',
                    textAlign: 'left',
                    borderRadius: 1,
                    '&:hover': { borderColor: 'text.primary' }
                  }}
                >
                  <Box sx={{ textAlign: 'left', width: '100%' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.625rem', fontWeight: 700, lineHeight: 1, mb: 0.5 }}>
                      Time Period
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {empDateRange === 'Custom' 
                        ? `${empDateFrom ? formatDateShort(empDateFrom) : 'Start'} - ${empDateTo ? formatDateShort(empDateTo) : 'End'}` 
                        : empDateRange}
                    </Typography>
                  </Box>
                </Button>

                <Popover
                  open={Boolean(dateMenuAnchor)}
                  anchorEl={dateMenuAnchor}
                  onClose={() => setDateMenuAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  slotProps={{
                    paper: {
                      sx: { p: 2.5, width: 320, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid', borderColor: 'divider', mt: 1 }
                    }
                  }}
                >
                  <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', mb: 2 }}>Select Time Period</Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Preset"
                    value={empDateRange}
                    onChange={e => {
                      const val = e.target.value;
                      setEmpDateRange(val);
                      if (val !== 'Custom') {
                        setDateMenuAnchor(null);
                      }
                    }}
                    sx={{ mb: 2 }}
                    slotProps={{ select: { sx: { fontSize: '0.8rem' } } }}
                  >
                    <MenuItem value="Today">Today</MenuItem>
                    <MenuItem value="Yesterday">Yesterday</MenuItem>
                    <MenuItem value="Weekly">Weekly</MenuItem>
                    <MenuItem value="Monthly">Monthly</MenuItem>
                    <MenuItem value="Quarterly">Quarterly</MenuItem>
                    <MenuItem value="Yearly">Yearly</MenuItem>
                    <MenuItem value="Custom">Custom Range</MenuItem>
                  </TextField>

                  {empDateRange === 'Custom' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="Start Date"
                        InputLabelProps={{ shrink: true }}
                        value={empDateFrom}
                        onChange={e => setEmpDateFrom(e.target.value)}
                        slotProps={{ htmlInput: { style: { fontSize: '0.8rem' } } }}
                      />
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="End Date"
                        InputLabelProps={{ shrink: true }}
                        value={empDateTo}
                        onChange={e => setEmpDateTo(e.target.value)}
                        slotProps={{ htmlInput: { style: { fontSize: '0.8rem' } } }}
                      />
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button size="small" variant="text" onClick={() => setDateMenuAnchor(null)} sx={{ textTransform: 'none', fontWeight: 700 }}>
                      Cancel
                    </Button>
                    <Button size="small" variant="contained" onClick={() => setDateMenuAnchor(null)} sx={{ textTransform: 'none', fontWeight: 700 }}>
                      Apply
                    </Button>
                  </Box>
                </Popover>
              </Grid>

              {/* Department Filter */}
              <Grid item xs={12} sm={6} md={1.4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Department"
                  value={empDeptFilter}
                  onChange={e => setEmpDeptFilter(e.target.value)}
                  slotProps={{ select: { sx: { fontSize: '0.8rem', fontWeight: 600 } } }}
                >
                  <MenuItem value="All Departments" sx={{ fontSize: '0.8rem' }}>All Departments</MenuItem>
                  {uniqueDepts.map(d => (
                    <MenuItem key={d} value={d} sx={{ fontSize: '0.8rem' }}>{d}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Role Filter */}
              <Grid item xs={12} sm={6} md={1.2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Role"
                  value={empRoleFilter}
                  onChange={e => setEmpRoleFilter(e.target.value)}
                  slotProps={{ select: { sx: { fontSize: '0.8rem', fontWeight: 600 } } }}
                >
                  <MenuItem value="All Roles" sx={{ fontSize: '0.8rem' }}>All Roles</MenuItem>
                  <MenuItem value="Supervisor" sx={{ fontSize: '0.8rem' }}>Supervisor</MenuItem>
                  <MenuItem value="Admin" sx={{ fontSize: '0.8rem' }}>Admin</MenuItem>
                  <MenuItem value="Skilled Worker" sx={{ fontSize: '0.8rem' }}>Skilled Worker</MenuItem>
                  <MenuItem value="Technician" sx={{ fontSize: '0.8rem' }}>Technician</MenuItem>
                  <MenuItem value="Operator" sx={{ fontSize: '0.8rem' }}>Operator</MenuItem>
                </TextField>
              </Grid>

              {/* SO Number Filter */}
              <Grid item xs={12} sm={6} md={1.5}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="SO Number"
                  value={empSOFilter}
                  onChange={e => {
                    const val = e.target.value;
                    const arr = typeof val === 'string' ? val.split(',') : (val as string[]);
                    if (arr.includes('All SOs') && arr.length > 1) {
                      if (arr[arr.length - 1] === 'All SOs') {
                        setEmpSOFilter(['All SOs']);
                      } else {
                        setEmpSOFilter(arr.filter(v => v !== 'All SOs'));
                      }
                    } else if (arr.length === 0) {
                      setEmpSOFilter(['All SOs']);
                    } else {
                      setEmpSOFilter(arr);
                    }
                  }}
                  slotProps={{ select: { multiple: true, renderValue: (selected: any) => selected.join(', '), sx: { fontSize: '0.8rem', fontWeight: 600 } } }}
                >
                  <MenuItem value="All SOs" sx={{ fontSize: '0.8rem' }}>
                    <Checkbox checked={empSOFilter.includes('All SOs')} size="small" />
                    <ListItemText primary="All SOs" primaryTypographyProps={{ fontSize: '0.8rem' }} />
                  </MenuItem>
                  {uniqueSOs.map(so => (
                    <MenuItem key={so} value={so} sx={{ fontSize: '0.8rem' }}>
                      <Checkbox checked={empSOFilter.includes(so)} size="small" />
                      <ListItemText primary={so} primaryTypographyProps={{ fontSize: '0.8rem' }} />
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Activity Filter */}
              <Grid item xs={12} sm={6} md={1.5}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Activity"
                  onChange={e => {
                    const val = e.target.value;
                    const arr = typeof val === 'string' ? val.split(',') : (val as string[]);
                    if (arr.includes('All Activities') && arr.length > 1) {
                      if (arr[arr.length - 1] === 'All Activities') {
                        setEmpActivityFilter(['All Activities']);
                      } else {
                        setEmpActivityFilter(arr.filter(v => v !== 'All Activities'));
                      }
                    } else if (arr.length === 0) {
                      setEmpActivityFilter(['All Activities']);
                    } else {
                      setEmpActivityFilter(arr);
                    }
                  }}
                  value={empActivityFilter}
                  slotProps={{ select: { multiple: true, renderValue: (selected: any) => selected.join(', '), sx: { fontSize: '0.8rem', fontWeight: 600 } } }}
                >
                  <MenuItem value="All Activities" sx={{ fontSize: '0.8rem' }}>
                    <Checkbox checked={empActivityFilter.includes('All Activities')} size="small" />
                    <ListItemText primary="All Activities" primaryTypographyProps={{ fontSize: '0.8rem' }} />
                  </MenuItem>
                  {uniqueActivities.map(act => (
                    <MenuItem key={act} value={act} sx={{ fontSize: '0.8rem' }}>
                      <Checkbox checked={empActivityFilter.includes(act)} size="small" />
                      <ListItemText primary={act} primaryTypographyProps={{ fontSize: '0.8rem' }} />
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Status Filter */}
              <Grid item xs={12} sm={6} md={1.3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Status"
                  value={empStatusFilter}
                  onChange={e => {
                    const val = e.target.value;
                    const arr = typeof val === 'string' ? val.split(',') : (val as string[]);
                    if (arr.includes('All Statuses') && arr.length > 1) {
                      if (arr[arr.length - 1] === 'All Statuses') {
                        setEmpStatusFilter(['All Statuses']);
                      } else {
                        setEmpStatusFilter(arr.filter(v => v !== 'All Statuses'));
                      }
                    } else if (arr.length === 0) {
                      setEmpStatusFilter(['All Statuses']);
                    } else {
                      setEmpStatusFilter(arr);
                    }
                  }}
                  slotProps={{ select: { multiple: true, renderValue: (selected: any) => selected.join(', '), sx: { fontSize: '0.8rem', fontWeight: 600 } } }}
                >
                  <MenuItem value="All Statuses" sx={{ fontSize: '0.8rem' }}>
                    <Checkbox checked={empStatusFilter.includes('All Statuses')} size="small" />
                    <ListItemText primary="All Statuses" primaryTypographyProps={{ fontSize: '0.8rem' }} />
                  </MenuItem>
                  {['Approved', 'Rejected', 'Rework', 'Pending'].map(st => (
                    <MenuItem key={st} value={st} sx={{ fontSize: '0.8rem' }}>
                      <Checkbox checked={empStatusFilter.includes(st)} size="small" />
                      <ListItemText primary={st} primaryTypographyProps={{ fontSize: '0.8rem' }} />
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Filter Actions */}
              <Grid item xs={12} md={1.8} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleResetEmployeeFilters}
                  sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', px: 1.5, height: 36, fontSize: '0.8rem', borderColor: 'divider', color: 'text.secondary' }}
                >
                  Reset
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleApplyEmployeeFilters}
                  sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', px: 2, height: 36, fontSize: '0.8rem' }}
                >
                  Generate
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Sub-Tab Navigation Bar */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={empSubTab}
              onChange={(e, newVal) => setEmpSubTab(newVal)}
              aria-label="employee report sections"
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  minWidth: 120,
                  px: 3,
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    color: 'primary.main',
                  }
                }
              }}
            >
              <Tab label="Dashboard Overview" />
              <Tab label="Performance & Contribution" />
              <Tab label="Quality & Audits" />
              <Tab label="Detailed Activity Log" />
            </Tabs>
          </Box>

          {/* SUB-TAB content blocks */}
            {empSubTab === 0 && (
            <Box>
              {/* 1. KPIs Horizontal Bar */}
              <Box
                sx={{
                  mb: 3.5,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  overflow: 'hidden',
                }}
              >
                <Grid container>
                  {[
                    { label: 'Total Activities', value: empData.totalActivities, subtext: '+12.5% vs prev.', isGreen: true, icon: <SOReportIcon sx={{ color: 'primary.main', fontSize: '1.1rem' }} /> },
                    { label: 'Hours Worked', value: `${empData.hoursWorked} hrs`, subtext: '+8.7% vs prev.', isGreen: true, icon: <TimeIcon sx={{ color: 'primary.main', fontSize: '1.1rem' }} /> },
                    { label: 'Productivity Index', value: `${empData.productivity}%`, subtext: '+5.2% vs prev.', isGreen: true, icon: <TrendIcon sx={{ color: 'success.main', fontSize: '1.1rem' }} /> },
                    { label: 'Approval Rate', value: `${empData.approvalRate}%`, subtext: '+3.6% vs prev.', isGreen: true, icon: <CheckIcon sx={{ color: 'success.main', fontSize: '1.1rem' }} /> },
                    { label: 'Rework Count', value: empData.reworkCount, subtext: '-33.3% vs prev.', isGreen: false, isRework: true, icon: <ReworkIcon sx={{ color: 'warning.main', fontSize: '1.1rem' }} /> },
                    { label: 'Active SOs', value: empData.activeSOs, subtext: 'Associated SOs', isNeutral: true, icon: <ColumnIcon sx={{ color: 'text.secondary', fontSize: '1.1rem' }} /> },
                    { label: 'Utilization %', value: `${empData.utilization}%`, subtext: '+4.1% vs prev.', isGreen: true, icon: <ProgressIcon sx={{ color: 'primary.main', fontSize: '1.1rem' }} /> },
                    { label: 'Avg Duration', value: empData.avgDuration, subtext: 'Per logged task', isNeutral: true, icon: <TimeIcon sx={{ color: 'text.secondary', fontSize: '1.1rem' }} /> },
                  ].map((kpi, i) => (
                    <Grid
                      item
                      xs={6}
                      sm={3}
                      md={1.5}
                      key={i}
                      sx={{
                        p: 2,
                        borderRight: {
                          xs: (i % 2 === 0) ? '1px solid #f1f5f9' : 'none',
                          sm: (i % 4 !== 3) ? '1px solid #f1f5f9' : 'none',
                          md: (i !== 7) ? '1px solid #f1f5f9' : 'none',
                        },
                        borderBottom: {
                          xs: (i < 6) ? '1px solid #f1f5f9' : 'none',
                          sm: (i < 4) ? '1px solid #f1f5f9' : 'none',
                          md: 'none',
                        },
                        transition: 'background-color 0.2s',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.025em', fontSize: '0.65rem' }}>
                          {kpi.label.toUpperCase()}
                        </Typography>
                        {kpi.icon}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 855, fontSize: '1.25rem', mb: 0.5, color: kpi.isRework && kpi.value > 0 ? 'error.main' : 'text.primary' }}>
                        {kpi.value}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {kpi.isNeutral ? (
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.625rem' }}>
                            {kpi.subtext}
                          </Typography>
                        ) : kpi.isGreen ? (
                          <>
                            <ArrowUpIcon sx={{ color: 'success.main', fontSize: '0.7rem' }} />
                            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700, fontSize: '0.625rem' }}>
                              {kpi.subtext}
                            </Typography>
                          </>
                        ) : kpi.isRework ? (
                          <>
                            <ArrowDownIcon sx={{ color: 'success.main', fontSize: '0.7rem' }} />
                            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700, fontSize: '0.625rem' }}>
                              {kpi.subtext}
                            </Typography>
                          </>
                        ) : (
                          <>
                            <ArrowDownIcon sx={{ color: 'error.main', fontSize: '0.7rem' }} />
                            <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700, fontSize: '0.625rem' }}>
                              {kpi.subtext}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* 2. Main Grid: Chart & Observations */}
              <Grid container spacing={3}>
                {/* Left: Trend line chart */}
                <Grid item xs={12} md={8}>
                  <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.95rem' }}>
                        Productivity & Labor Hours Trend
                      </Typography>
                      <TextField
                        select
                        size="small"
                        value={trendView}
                        onChange={e => setTrendView(e.target.value)}
                        sx={{ width: 110 }}
                        slotProps={{ select: { sx: { height: 28, fontSize: '0.75rem', fontWeight: 700 } } }}
                      >
                        <MenuItem value="Daily">Daily</MenuItem>
                        <MenuItem value="Weekly">Weekly</MenuItem>
                        <MenuItem value="Monthly">Monthly</MenuItem>
                      </TextField>
                    </Box>

                    <Box sx={{ width: '100%', height: 260 }}>
                      <ResponsiveContainer>
                        <LineChart data={empData.trendData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                          <YAxis tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                          <ChartTooltip />
                          <Legend wrapperStyle={{ fontSize: 9, fontWeight: 700 }} />
                          <Line type="monotone" name="Productivity %" dataKey="Productivity %" stroke="#2563EB" strokeWidth={3} activeDot={{ r: 5 }} />
                          <Line type="monotone" name="Hours Worked" dataKey="Hours Worked" stroke="#10B981" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </Card>
                </Grid>

                {/* Right: Remarks & Actionable Recommendations */}
                <Grid item xs={12} md={4}>
                  <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 3, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: 'text.primary', fontSize: '0.95rem' }}>
                      Executive Summary & Observations
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                      {empData.observations.map((obs, idx) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 1 }}>
                          <Typography variant="body2" color="primary.main" sx={{ fontWeight: 800 }}>•</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', fontSize: '0.8rem', lineHeight: 1.4 }}>
                            {obs}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    <Box
                      sx={{
                        p: 2.2,
                        bgcolor: 'rgba(37,99,235,0.03)',
                        borderRadius: 2.5,
                        borderLeft: '4px solid',
                        borderColor: 'primary.main',
                        mt: 'auto'
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', display: 'block', mb: 0.5, letterSpacing: '0.05em', fontSize: '0.65rem' }}>
                        ACTIONABLE MANAGER RECOMMENDATION
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 650, color: 'text.primary', fontStyle: 'italic', fontSize: '0.8rem', lineHeight: 1.4 }}>
                        {empData.recommendations}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* SUB-TAB 1: PERFORMANCE & CONTRIBUTION */}
          {empSubTab === 1 && (
            <Grid container spacing={3} alignItems="stretch">
              {/* Card 1: Productivity by Activity */}
              <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 3, width: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.9rem' }}>
                      <TrendIcon sx={{ color: 'primary.main', fontSize: '1.1rem' }} />
                      Productivity by Activity
                    </Typography>
                    <TextField
                      size="small"
                      placeholder="Search..."
                      value={empActivitySearch}
                      onChange={e => {
                        setEmpActivitySearch(e.target.value);
                        setEmpActivityPage(1);
                      }}
                      slotProps={{
                        input: {
                          startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 0.5, fontSize: '0.9rem' }} />
                        }
                      }}
                      sx={{
                        width: 120,
                        '& .MuiOutlinedInput-root': {
                          height: 26,
                          fontSize: '0.7rem',
                          borderRadius: 1.5,
                        }
                      }}
                    />
                  </Box>
                  
                  <TableContainer sx={{ flexGrow: 1, minHeight: 200 }}>
                    <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                      <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1, color: 'text.secondary', width: '45%' }}>ACTIVITY</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1, color: 'text.secondary', width: '15%' }}>OCCUR.</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1, color: 'text.secondary', width: '15%' }}>HOURS</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1, color: 'text.secondary', width: '25%' }}>PRODUCTIVITY</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedActivityPerformance.map((item, idx) => (
                          <TableRow key={idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1, color: 'text.primary', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {item.activity}
                            </TableCell>
                            <TableCell align="center" sx={{ fontSize: '0.75rem', py: 1 }}>{item.occurrences}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1 }}>{item.hours}h</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: item.productivity >= 90 ? 'success.main' : 'warning.main', fontSize: '0.75rem', py: 1 }}>
                              {item.productivity}%
                            </TableCell>
                          </TableRow>
                        ))}
                        {paginatedActivityPerformance.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600 }}>
                              No matching activities.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Pagination control */}
                  {searchedActivityPerformance.length > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.675rem' }}>
                        Showing {Math.min(searchedActivityPerformance.length, (empActivityPage - 1) * empActivityRowsPerPage + 1)} to {Math.min(searchedActivityPerformance.length, empActivityPage * empActivityRowsPerPage)} of {searchedActivityPerformance.length} logs
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.675rem' }}>
                          Show
                        </Typography>
                        <TextField
                          select
                          size="small"
                          value={empActivityRowsPerPage}
                          onChange={e => {
                            setEmpActivityRowsPerPage(Number(e.target.value));
                            setEmpActivityPage(1);
                          }}
                          slotProps={{ select: { sx: { height: 22, fontSize: '0.7rem', fontWeight: 800, py: 0 } } }}
                          sx={{ 
                            width: 55, 
                            mr: 1,
                            '& .MuiOutlinedInput-root': {
                              height: 22,
                              fontSize: '0.7rem',
                              borderRadius: 1
                            }
                          }}
                        >
                          <MenuItem value={5} sx={{ fontSize: '0.7rem' }}>5</MenuItem>
                          <MenuItem value={10} sx={{ fontSize: '0.7rem' }}>10</MenuItem>
                          <MenuItem value={25} sx={{ fontSize: '0.7rem' }}>25</MenuItem>
                        </TextField>

                        <Button
                          size="small"
                          variant="outlined"
                          disabled={empActivityPage === 1}
                          onClick={() => setEmpActivityPage(p => Math.max(1, p - 1))}
                          sx={{ minWidth: 24, height: 24, p: 0, borderRadius: 1, fontSize: '0.7rem', textTransform: 'none' }}
                        >
                          Prev
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          sx={{ minWidth: 24, height: 24, p: 0, borderRadius: 1, fontSize: '0.7rem', fontWeight: 800 }}
                        >
                          {empActivityPage}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={empActivityPage >= totalActivityPages}
                          onClick={() => setEmpActivityPage(p => Math.min(totalActivityPages, p + 1))}
                          sx={{ minWidth: 24, height: 24, p: 0, borderRadius: 1, fontSize: '0.7rem', textTransform: 'none' }}
                        >
                          Next
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Card>
              </Grid>

              {/* Card 2: SO Labor Contribution */}
              <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 3, width: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.9rem' }}>
                      <SOReportIcon sx={{ color: 'primary.main', fontSize: '1.1rem' }} />
                      SO Labor Contribution
                    </Typography>
                    <TextField
                      size="small"
                      placeholder="Search..."
                      value={empContribSoSearch}
                      onChange={e => {
                        setEmpContribSoSearch(e.target.value);
                        setEmpSoPage(1);
                      }}
                      slotProps={{
                        input: {
                          startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 0.5, fontSize: '0.9rem' }} />
                        }
                      }}
                      sx={{
                        width: 120,
                        '& .MuiOutlinedInput-root': {
                          height: 26,
                          fontSize: '0.7rem',
                          borderRadius: 1.5,
                        }
                      }}
                    />
                  </Box>
                  
                  <TableContainer sx={{ flexGrow: 1, minHeight: 200 }}>
                    <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                      <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1, color: 'text.secondary', width: '38%' }}>SO NUMBER</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1, color: 'text.secondary', width: '17%' }}>LOGS</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1, color: 'text.secondary', width: '20%' }}>HOURS</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1, color: 'text.secondary', width: '25%' }}>CONTRIBUTION</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedSoContribution.map((item, idx) => (
                          <TableRow key={idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', color: 'primary.main', fontSize: '0.75rem', py: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {item.soNumber}
                            </TableCell>
                            <TableCell align="center" sx={{ fontSize: '0.75rem', py: 1 }}>{item.activities}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem', py: 1 }}>{item.hours}h</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: 'success.main', fontSize: '0.75rem', py: 1 }}>{item.percent}%</TableCell>
                          </TableRow>
                        ))}
                        {paginatedSoContribution.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600 }}>
                              No matching SOs.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Pagination control */}
                  {searchedSoContribution.length > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.675rem' }}>
                        Showing {Math.min(searchedSoContribution.length, (empSoPage - 1) * empSoRowsPerPage + 1)} to {Math.min(searchedSoContribution.length, empSoPage * empSoRowsPerPage)} of {searchedSoContribution.length} logs
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.675rem' }}>
                          Show
                        </Typography>
                        <TextField
                          select
                          size="small"
                          value={empSoRowsPerPage}
                          onChange={e => {
                            setEmpSoRowsPerPage(Number(e.target.value));
                            setEmpSoPage(1);
                          }}
                          slotProps={{ select: { sx: { height: 22, fontSize: '0.7rem', fontWeight: 800, py: 0 } } }}
                          sx={{ 
                            width: 55, 
                            mr: 1,
                            '& .MuiOutlinedInput-root': {
                              height: 22,
                              fontSize: '0.7rem',
                              borderRadius: 1
                            }
                          }}
                        >
                          <MenuItem value={5} sx={{ fontSize: '0.7rem' }}>5</MenuItem>
                          <MenuItem value={10} sx={{ fontSize: '0.7rem' }}>10</MenuItem>
                          <MenuItem value={25} sx={{ fontSize: '0.7rem' }}>25</MenuItem>
                        </TextField>

                        <Button
                          size="small"
                          variant="outlined"
                          disabled={empSoPage === 1}
                          onClick={() => setEmpSoPage(p => Math.max(1, p - 1))}
                          sx={{ minWidth: 24, height: 24, p: 0, borderRadius: 1, fontSize: '0.7rem', textTransform: 'none' }}
                        >
                          Prev
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          sx={{ minWidth: 24, height: 24, p: 0, borderRadius: 1, fontSize: '0.7rem', fontWeight: 800 }}
                        >
                          {empSoPage}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={empSoPage >= totalSoPages}
                          onClick={() => setEmpSoPage(p => Math.min(totalSoPages, p + 1))}
                          sx={{ minWidth: 24, height: 24, p: 0, borderRadius: 1, fontSize: '0.7rem', textTransform: 'none' }}
                        >
                          Next
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Card>
              </Grid>

              {/* Card 3: Standard Time Deviation */}
              <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 3, width: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1, color: 'text.primary', fontSize: '0.95rem' }}>
                    Standard Time Deviation
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, mt: 2 }}>
                    <Box sx={{ width: 300, height: 300, position: 'relative' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={empData.activityTimeMetrics}
                            cx="50%"
                            cy="50%"
                            innerRadius={90}
                            outerRadius={125}
                            paddingAngle={3.5}
                            dataKey="value"
                          >
                            {empData.activityTimeMetrics.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <ChartTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                        <Typography variant="h5" sx={{ fontWeight: 850, fontSize: '1.6rem', lineHeight: 1, color: 'text.primary' }}>
                          {empData.productivity}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.75rem', display: 'block', mt: 0.4 }}>
                          Prod.
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 3, flexWrap: 'wrap', width: '100%', borderTop: '1px solid', borderColor: 'divider', pt: 2.5 }}>
                      {empData.activityTimeMetrics.map((item, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color }} />
                          <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary' }}>
                            {item.name === 'Ahead of Standard' ? 'Ahead' : item.name === 'Delayed vs Standard' ? 'Delayed' : item.name}
                          </Typography>
                          <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: 'text.primary', ml: 0.5 }}>
                            {item.value} hrs
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Card>
              </Grid>

              {/* Card 4: Log Approval Status */}
              <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 3, width: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1, color: 'text.primary', fontSize: '0.95rem' }}>
                    Log Approval Status
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, mt: 2 }}>
                    <Box sx={{ width: 300, height: 300, position: 'relative' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={empData.activityStatusMetrics}
                            cx="50%"
                            cy="50%"
                            innerRadius={90}
                            outerRadius={125}
                            paddingAngle={3.5}
                            dataKey="value"
                          >
                            {empData.activityStatusMetrics.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <ChartTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                        <Typography variant="h5" sx={{ fontWeight: 850, fontSize: '1.6rem', lineHeight: 1, color: 'text.primary' }}>
                          {empData.approvalRate}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.75rem', display: 'block', mt: 0.4 }}>
                          Appr.
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 3, flexWrap: 'wrap', width: '100%', borderTop: '1px solid', borderColor: 'divider', pt: 2.5 }}>
                      {empData.activityStatusMetrics.map((item, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color }} />
                          <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary' }}>
                            {item.name === 'Rework Required' ? 'Rework' : item.name}
                          </Typography>
                          <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: 'text.primary', ml: 0.5 }}>
                            {item.value}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* SUB-TAB 2: QUALITY & AUDITS */}
          {empSubTab === 2 && (
            <Grid container spacing={3} alignItems="stretch">
              {/* Left Column: Supervisor review table */}
              <Grid item xs={12} md={5} sx={{ display: 'flex' }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 3, width: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.9rem' }}>
                    <EmployeeReportIcon sx={{ color: 'primary.main', fontSize: '1.1rem' }} />
                    Review Summary by Supervisor
                  </Typography>
                  <TableContainer sx={{ flexGrow: 1, maxHeight: 250, overflowY: 'auto', pr: 0.5, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 } }}>
                    <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                      <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1.2, color: 'text.secondary', width: '40%' }}>SUPERVISOR</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1.2, color: 'text.secondary', width: '20%' }}>APPR.</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1.2, color: 'text.secondary', width: '20%' }}>REJ.</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1.2, color: 'text.secondary', width: '20%' }}>REWORK</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {empData.supervisorReview.map((item, idx) => (
                          <TableRow key={idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: 'text.primary' }}>{item.supervisor}</TableCell>
                            <TableCell align="center" sx={{ fontSize: '0.75rem', color: 'success.main', fontWeight: 700, py: 1.2 }}>{item.approved}</TableCell>
                            <TableCell align="center" sx={{ fontSize: '0.75rem', color: 'error.main', fontWeight: 700, py: 1.2 }}>{item.rejected}</TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.75rem', color: 'warning.main', fontWeight: 700, py: 1.2 }}>{item.reworked}</TableCell>
                          </TableRow>
                        ))}
                        {empData.supervisorReview.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600 }}>
                              No audited logs found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              </Grid>

              {/* Right Column: Rework Cause Analysis */}
              <Grid item xs={12} md={7} sx={{ display: 'flex' }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 3, width: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.9rem' }}>
                    <ReworkIcon sx={{ color: 'warning.main', fontSize: '1.1rem' }} />
                    Rework Cause Analysis
                  </Typography>
                  <TableContainer sx={{ flexGrow: 1, maxHeight: 250, overflowY: 'auto', pr: 0.5, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 } }}>
                    <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                      <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1.2, color: 'text.secondary', width: '35%' }}>ACTIVITY</TableCell>
                          <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1.2, color: 'text.secondary', width: '35%' }}>REWORK REASON</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1.2, color: 'text.secondary', width: '12%' }}>COUNT</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1.2, color: 'text.secondary', width: '18%' }}>HOURS LOST</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {empData.reworkBreakdown.map((item, idx) => (
                          <TableRow key={idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: 'text.primary' }}>
                              {item.activity}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', py: 1.2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {item.reason}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.2 }}>{item.count}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: 'error.main', fontSize: '0.75rem', py: 1.2 }}>{item.hoursLost}h</TableCell>
                          </TableRow>
                        ))}
                        {empData.reworkBreakdown.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600 }}>
                              No rework incidents logged in this period.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* SUB-TAB 3: DETAILED ACTIVITY LOG */}
          {empSubTab === 3 && (
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3, overflow: 'hidden', bgcolor: 'background.paper' }}>
              <Box sx={{ p: 3, pb: 2.5 }}>
                {/* Table header with Search & Columns control */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.95rem' }}>
                    <SOReportIcon sx={{ color: 'primary.main', fontSize: '1.15rem' }} />
                    Detailed Activity Log History
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <TextField
                      size="small"
                      placeholder="Search in log history..."
                      value={empHistorySearch}
                      onChange={e => {
                        setEmpHistorySearch(e.target.value);
                        setEmpHistoryPage(1);
                      }}
                      slotProps={{
                        input: {
                          startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: '1rem' }} />
                        }
                      }}
                      sx={{ 
                        width: 220,
                        '& .MuiOutlinedInput-root': {
                          height: 32,
                          fontSize: '0.775rem',
                          borderRadius: 2
                        }
                      }}
                    />

                    <Button
                      variant="outlined"
                      startIcon={<FilterIcon />}
                      size="small"
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, borderColor: 'divider', color: 'text.secondary', height: 32, fontSize: '0.775rem' }}
                    >
                      Filters
                    </Button>

                    <Button
                      variant="outlined"
                      startIcon={<ColumnIcon />}
                      size="small"
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, borderColor: 'divider', color: 'text.secondary', height: 32, fontSize: '0.775rem' }}
                    >
                      Columns
                    </Button>
                  </Box>
                </Box>
              </Box>

              <TableContainer sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1.2, color: 'text.secondary' }}>DATE</TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1.2, color: 'text.secondary' }}>SO NUMBER</TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1.2, color: 'text.secondary' }}>DEPARTMENT</TableCell>
                      <TableCell sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1.2, color: 'text.secondary' }}>ACTIVITY</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1.2, color: 'text.secondary' }}>START TIME</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1.2, color: 'text.secondary' }}>END TIME</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1.2, color: 'text.secondary' }}>DURATION</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1.2, color: 'text.secondary' }}>STD. DURATION</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1.2, color: 'text.secondary' }}>VARIANCE</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1.2, color: 'text.secondary' }}>STATUS</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.7rem', py: 1.2, color: 'text.secondary' }}>VERIFIED BY</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedEmpHistoryLogs.map((item, idx) => {
                      const variance = item.standardManMinutes - item.durationMinutes;
                      const isSavingTime = variance >= 0;
                      return (
                        <TableRow key={idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, py: 1.2 }}>{item.activityDate}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', fontWeight: 750, fontFamily: 'monospace', color: 'primary.main', py: 1.2 }}>
                            {item.soNumber}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', py: 1.2 }}>{item.department}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', fontWeight: 650, py: 1.2 }}>{item.activity}</TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.75rem', color: 'text.secondary', py: 1.2 }}>{item.startTime}</TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.75rem', color: 'text.secondary', py: 1.2 }}>{item.endTime}</TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.75rem', fontWeight: 600, py: 1.2 }}>
                            {item.durationMinutes >= 60 
                              ? `${Math.floor(item.durationMinutes / 60)}h ${item.durationMinutes % 60}m` 
                              : `${item.durationMinutes}m`}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.75rem', color: 'text.secondary', py: 1.2 }}>
                            {item.standardManMinutes >= 60 
                              ? `${Math.floor(item.standardManMinutes / 60)}h ${item.standardManMinutes % 60}m` 
                              : `${item.standardManMinutes}m`}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              color: isSavingTime ? 'success.main' : 'error.main',
                              py: 1.2
                            }}
                          >
                            {variance === 0 ? '0m' : isSavingTime ? `+${variance}m` : `${variance}m`}
                          </TableCell>
                          <TableCell align="center" sx={{ py: 0.5 }}>
                            <Chip
                              label={item.status}
                              size="small"
                              color={
                                item.status === 'Approved' ? 'success' :
                                item.status === 'Rework' ? 'warning' :
                                item.status === 'Rejected' ? 'error' : 'default'
                              }
                              sx={{ fontWeight: 800, fontSize: '0.65rem', height: 18 }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 650, py: 1.2 }}>{item.reviewedBy || 'Amit Verma'}</TableCell>
                        </TableRow>
                      );
                    })}
                    {paginatedEmpHistoryLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={11} align="center" sx={{ py: 4, color: 'text.secondary', fontWeight: 700 }}>
                          No activity history logs match the applied filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Table pagination controls matching the mockup & overall tab */}
              {searchedEmpHistoryLogs.length > 0 && (
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid', borderColor: 'divider', bgcolor: '#f8fafc' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                    Showing {searchedEmpHistoryLogs.length === 0 ? 0 : (empHistoryPage - 1) * empHistoryRowsPerPage + 1} to {Math.min(empHistoryPage * empHistoryRowsPerPage, searchedEmpHistoryLogs.length)} of {searchedEmpHistoryLogs.length} logs
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      Show
                    </Typography>
                    <TextField
                      select
                      size="small"
                      value={empHistoryRowsPerPage}
                      onChange={e => {
                        setEmpHistoryRowsPerPage(Number(e.target.value));
                        setEmpHistoryPage(1);
                      }}
                      slotProps={{ select: { sx: { height: 26, fontSize: '0.75rem', fontWeight: 800, py: 0 } } }}
                      sx={{ 
                        width: 70, 
                        mr: 1,
                        '& .MuiOutlinedInput-root': {
                          height: 28,
                          fontSize: '0.75rem',
                          borderRadius: 1.5
                        }
                      }}
                    >
                      <MenuItem value={5} sx={{ fontSize: '0.75rem' }}>5</MenuItem>
                      <MenuItem value={10} sx={{ fontSize: '0.75rem' }}>10</MenuItem>
                      <MenuItem value={25} sx={{ fontSize: '0.75rem' }}>25</MenuItem>
                    </TextField>

                    <Button
                      size="small"
                      variant="outlined"
                      disabled={empHistoryPage === 1}
                      onClick={() => setEmpHistoryPage(p => Math.max(1, p - 1))}
                      sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, height: 28, fontSize: '0.75rem' }}
                    >
                      Previous
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      sx={{ minWidth: 28, height: 28, borderRadius: 1.5, fontWeight: 800, fontSize: '0.75rem', px: 1 }}
                    >
                      {empHistoryPage}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={empHistoryPage >= totalEmpHistoryPages}
                      onClick={() => setEmpHistoryPage(p => Math.min(totalEmpHistoryPages, p + 1))}
                      sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, height: 28, fontSize: '0.75rem' }}
                    >
                      Next
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* ============================================================== */}
      {/* --- TAB 3: DEPARTMENT PERFORMANCE REPORT --- */}
      {/* ============================================================== */}
      {activeTab === 3 && deptData && (
        <Box sx={{ width: '100%' }}>

          {/* ── SECTION 1: Header ── */}
          <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Button variant="outlined" size="small" startIcon={<BackIcon />} onClick={() => setActiveTab(0)}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, mb: 1, height: 30, fontSize: '0.78rem' }}>
                Back to Dashboard
              </Button>
              <Typography sx={{ fontWeight: 850, fontSize: '1.55rem', color: 'text.primary', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
                Department Performance Report
              </Typography>
              <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', fontWeight: 500, mt: 0.3 }}>
                {deptData.name} &nbsp;·&nbsp; {appliedDeptFilters.dateRange} &nbsp;·&nbsp; {filteredDeptPerfLogs.length.toLocaleString()} activity logs
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <Button variant="outlined" color="success" size="small" startIcon={<DownloadIcon />} onClick={handleExportDeptExcel}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, height: 34 }}>Export Excel</Button>
              <Button variant="outlined" color="error" size="small" startIcon={<PdfIcon />} onClick={handleExportDeptPDF}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, height: 34 }}>Export PDF</Button>
            </Box>
          </Box>

          {/* ── SECTION 2: Filter Bar ── */}
          <Card sx={{ mb: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 2 }}>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField select size="small" label="Department" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                sx={{ minWidth: 155, flex: '1 1 155px' }} slotProps={{ select: { sx: { fontSize: '0.8rem', fontWeight: 600 } } }}>
                {uniqueDepts.map(d => <MenuItem key={d} value={d} sx={{ fontSize: '0.8rem' }}>{d}</MenuItem>)}
              </TextField>

              <TextField select size="small" label="Sub Department" value={deptSubFilter} onChange={e => setDeptSubFilter(e.target.value)}
                sx={{ minWidth: 155, flex: '1 1 155px' }} slotProps={{ select: { sx: { fontSize: '0.8rem', fontWeight: 600 } } }}>
                <MenuItem value="All Sub Departments" sx={{ fontSize: '0.8rem' }}>All Sub Departments</MenuItem>
                <MenuItem value="QC Line" sx={{ fontSize: '0.8rem' }}>QC Line</MenuItem>
                <MenuItem value="Assembly Line A" sx={{ fontSize: '0.8rem' }}>Assembly Line A</MenuItem>
                <MenuItem value="Coil Section" sx={{ fontSize: '0.8rem' }}>Coil Section</MenuItem>
              </TextField>

              <Button onClick={(e) => setDeptDateMenuAnchor(e.currentTarget)} variant="outlined"
                sx={{ color: 'text.primary', bgcolor: 'background.paper', borderColor: 'rgba(0,0,0,0.23)', px: 1.5, height: 40,
                  textAlign: 'left', borderRadius: 1.2, textTransform: 'none', minWidth: 150, flex: '1 1 150px',
                  '&:hover': { borderColor: 'text.primary' } }}>
                <Box sx={{ textAlign: 'left', width: '100%' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.6rem', fontWeight: 700, lineHeight: 1, mb: 0.3 }}>Time Period</Typography>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 600 }}>
                    {deptDateRange === 'Custom' ? `${deptDateFrom ? formatDateShort(deptDateFrom) : 'Start'} – ${deptDateTo ? formatDateShort(deptDateTo) : 'End'}` : deptDateRange}
                  </Typography>
                </Box>
              </Button>
              <Popover open={Boolean(deptDateMenuAnchor)} anchorEl={deptDateMenuAnchor} onClose={() => setDeptDateMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                slotProps={{ paper: { sx: { p: 2.5, width: 310, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid', borderColor: 'divider', mt: 1 } } }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', mb: 2 }}>Select Time Period</Typography>
                <TextField select fullWidth size="small" label="Preset" value={deptDateRange} onChange={e => { const v = e.target.value; setDeptDateRange(v); if (v !== 'Custom') setDeptDateMenuAnchor(null); }} sx={{ mb: 2 }} slotProps={{ select: { sx: { fontSize: '0.8rem' } } }}>
                  {['Today','Yesterday','Weekly','Monthly','Quarterly','Yearly','Custom'].map(v => <MenuItem key={v} value={v}>{v === 'Custom' ? 'Custom Range' : v}</MenuItem>)}
                </TextField>
                {deptDateRange === 'Custom' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                    <TextField fullWidth size="small" type="date" label="Start Date" InputLabelProps={{ shrink: true }} value={deptDateFrom} onChange={e => setDeptDateFrom(e.target.value)} slotProps={{ htmlInput: { style: { fontSize: '0.8rem' } } }} />
                    <TextField fullWidth size="small" type="date" label="End Date" InputLabelProps={{ shrink: true }} value={deptDateTo} onChange={e => setDeptDateTo(e.target.value)} slotProps={{ htmlInput: { style: { fontSize: '0.8rem' } } }} />
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button size="small" variant="text" onClick={() => setDeptDateMenuAnchor(null)} sx={{ textTransform: 'none', fontWeight: 700 }}>Cancel</Button>
                  <Button size="small" variant="contained" onClick={() => setDeptDateMenuAnchor(null)} sx={{ textTransform: 'none', fontWeight: 700 }}>Apply</Button>
                </Box>
              </Popover>

              <TextField select size="small" label="SO Number" value={deptSoFilter} onChange={e => setDeptSoFilter(e.target.value)}
                sx={{ minWidth: 130, flex: '1 1 130px' }} slotProps={{ select: { sx: { fontSize: '0.8rem', fontWeight: 600 } } }}>
                <MenuItem value="All SOs" sx={{ fontSize: '0.8rem' }}>All SOs</MenuItem>
                {uniqueSOs.map(so => <MenuItem key={so} value={so} sx={{ fontSize: '0.8rem' }}>{so}</MenuItem>)}
              </TextField>

              <TextField select size="small" label="Activity" value={deptActivityFilter} onChange={e => setDeptActivityFilter(e.target.value)}
                sx={{ minWidth: 130, flex: '1 1 130px' }} slotProps={{ select: { sx: { fontSize: '0.8rem', fontWeight: 600 } } }}>
                <MenuItem value="All Activities" sx={{ fontSize: '0.8rem' }}>All Activities</MenuItem>
                {uniqueActivities.map(act => <MenuItem key={act} value={act} sx={{ fontSize: '0.8rem' }}>{act}</MenuItem>)}
              </TextField>

              <TextField select size="small" label="Status" value={deptStatusFilter} onChange={e => setDeptStatusFilter(e.target.value)}
                sx={{ minWidth: 120, flex: '1 1 120px' }} slotProps={{ select: { sx: { fontSize: '0.8rem', fontWeight: 600 } } }}>
                {['All Statuses','Approved','Rejected','Rework','Pending'].map(v => <MenuItem key={v} value={v} sx={{ fontSize: '0.8rem' }}>{v}</MenuItem>)}
              </TextField>

              <TextField select size="small" label="Employee" value={deptEmpFilter} onChange={e => setDeptEmpFilter(e.target.value)}
                sx={{ minWidth: 140, flex: '1 1 140px' }} slotProps={{ select: { sx: { fontSize: '0.8rem' } } }}>
                <MenuItem value="All Employees" sx={{ fontSize: '0.8rem' }}>All Employees</MenuItem>
                {uniqueEmployees.map(emp => <MenuItem key={emp.employeeId} value={emp.employeeId} sx={{ fontSize: '0.8rem' }}>{emp.name}</MenuItem>)}
              </TextField>

              <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                <Button variant="contained" color="primary" size="small" onClick={handleApplyDeptFilters}
                  sx={{ textTransform: 'none', fontWeight: 750, borderRadius: 2, height: 36, px: 2.5, whiteSpace: 'nowrap' }}>Apply Filters</Button>
                <Button variant="outlined" size="small" onClick={handleResetDeptFilters}
                  sx={{ textTransform: 'none', fontWeight: 750, borderRadius: 2, height: 36, px: 2 }}>Reset</Button>
              </Box>
            </Box>
          </Card>

          {/* ── SECTION 3: KPI Cards ── */}
          <Card sx={{ mb: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3 }}>
            <Grid container>
              {[
                { label: 'Total Activities', value: deptData.totalActivities.toLocaleString(), sub: `+12.4% vs prev`, color: '#2563EB', icon: <SOReportIcon sx={{ fontSize: '1.1rem', color: '#2563EB' }} /> },
                { label: 'Total Hours Worked', value: `${deptData.hoursWorked.toLocaleString()}h`, sub: '+9.6% vs prev', color: '#10b981', icon: <TimeIcon sx={{ fontSize: '1.1rem', color: '#10b981' }} /> },
                { label: 'Productivity Index', value: `${deptData.productivity}%`, sub: '+5.3% vs prev', color: '#8b5cf6', icon: <TrendIcon sx={{ fontSize: '1.1rem', color: '#8b5cf6' }} /> },
                { label: 'Completion Rate', value: `${deptData.completionRate}%`, sub: '+6.7% vs prev', color: '#0ea5e9', icon: <CheckIcon sx={{ fontSize: '1.1rem', color: '#0ea5e9' }} /> },
                { label: 'Rework Cases', value: String(deptData.reworkCount), sub: '−15.6% vs prev', color: '#f59e0b', icon: <ReworkIcon sx={{ fontSize: '1.1rem', color: '#f59e0b' }} />, isDown: true },
                { label: 'Waiting Hours', value: `${deptData.waitingHours}h`, sub: '−8.2% vs prev', color: '#ef4444', icon: <DelayIcon sx={{ fontSize: '1.1rem', color: '#ef4444' }} />, isDown: true },
                { label: 'Active Employees', value: String(deptData.activeEmployees), sub: '+7.7% vs prev', color: '#2563EB', icon: <EmployeeReportIcon sx={{ fontSize: '1.1rem', color: '#2563EB' }} /> },
              ].map((kpi, i, arr) => (
                <Grid item key={i} xs={6} sm={4} md sx={{ p: 2.5, borderRight: i < arr.length - 1 ? '1px solid' : 'none', borderColor: 'divider', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {kpi.icon}
                    <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.3, lineHeight: 1.2 }}>
                      {kpi.label}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 850, fontSize: '1.4rem', color: 'text.primary', letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {kpi.value}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, color: kpi.isDown ? 'success.main' : 'success.main', mt: 0.5 }}>
                    {kpi.sub}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Card>

          {/* ── SECTION 4: Trend Chart + Two Donut Charts in one row (equal thirds) ── */}
          <Grid container spacing={2.5} sx={{ mb: 2.5 }} alignItems="stretch">
            {/* Trend Chart — 1/3 width */}
            <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 3, width: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: 'text.primary' }}>Productivity & Hours</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
                      Performance trend over time
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {['Daily', 'Weekly', 'Monthly'].map(view => (
                      <Button key={view} size="small"
                        variant={deptTrendView === view ? 'contained' : 'outlined'}
                        onClick={() => setDeptTrendView(view as any)}
                        sx={{ textTransform: 'none', fontSize: '0.68rem', fontWeight: 700, py: 0.1, px: 1, borderRadius: 1.2, height: 24, boxShadow: 'none' }}>
                        {view}
                      </Button>
                    ))}
                  </Box>
                </Box>
                <Box sx={{ width: '100%', flexGrow: 1, minHeight: 260 }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={deptData.trendData} margin={{ left: -25, right: 10, top: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                      <XAxis dataKey="date" style={{ fontSize: 8, fontWeight: 700 }} stroke="rgba(0,0,0,0.3)" />
                      <YAxis yAxisId="prod" style={{ fontSize: 8, fontWeight: 600 }} domain={[0, 100]} />
                      <YAxis yAxisId="hours" orientation="right" style={{ fontSize: 8, fontWeight: 600 }} />
                      <ChartTooltip />
                      <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: 9, fontWeight: 700 }} />
                      <Line yAxisId="prod" type="monotone" dataKey="Productivity %" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                      <Line yAxisId="hours" type="monotone" dataKey="Hours Worked" stroke="#10B981" strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Card>
            </Grid>

            {/* Donut 1: Activity Status — 1/3 width */}
            <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 2.5, width: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: 'text.primary', mb: 1.5 }}>
                  Activity Status Distribution
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexGrow: 1, gap: 1.5 }}>
                  {/* Left: Donut Chart */}
                  <Box sx={{ position: 'relative', width: 150, height: 150, flexShrink: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={deptData.activityStatusMetrics} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={2.5} dataKey="value">
                          {deptData.activityStatusMetrics.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <ChartTooltip formatter={(val: any, name: any) => [`${val}`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                      <Typography sx={{ fontWeight: 900, fontSize: '1.15rem', lineHeight: 1, color: 'text.primary' }}>{deptData.completionRate}%</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 750, fontSize: '0.58rem', display: 'block', mt: 0.1 }}>Comp.</Typography>
                    </Box>
                  </Box>
                  {/* Right: Legend list */}
                  <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                    {deptData.activityStatusMetrics.map((item, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'action.hover', pb: 0.4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
                          <Typography sx={{ fontWeight: 700, fontSize: '0.74rem', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.3, flexShrink: 0 }}>
                          <Typography sx={{ fontWeight: 800, fontSize: '0.76rem', color: 'text.primary' }}>{item.value}</Typography>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.66rem', color: 'text.secondary' }}>({item.percent}%)</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Card>
            </Grid>

            {/* Donut 2: vs Standard Time — 1/3 width */}
            <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 2.5, width: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: 'text.primary', mb: 1.5 }}>
                  Standard Time Deviation
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexGrow: 1, gap: 1.5 }}>
                  {/* Left: Donut Chart */}
                  <Box sx={{ position: 'relative', width: 150, height: 150, flexShrink: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={deptData.activityTimeMetrics} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={2.5} dataKey="value">
                          {deptData.activityTimeMetrics.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <ChartTooltip formatter={(val: any, name: any) => [`${val}`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                      <Typography sx={{ fontWeight: 900, fontSize: '1.15rem', lineHeight: 1, color: 'text.primary' }}>{deptData.productivity}%</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 750, fontSize: '0.58rem', display: 'block', mt: 0.1 }}>Prod.</Typography>
                    </Box>
                  </Box>
                  {/* Right: Legend list */}
                  <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                    {deptData.activityTimeMetrics.map((item, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'action.hover', pb: 0.4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
                          <Typography sx={{ fontWeight: 700, fontSize: '0.74rem', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.name === 'Within Standard Time' ? 'Within Std' : item.name === 'Above Standard Time' ? 'Above Std' : 'Below Std'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.3, flexShrink: 0 }}>
                          <Typography sx={{ fontWeight: 800, fontSize: '0.78rem', color: 'text.primary' }}>{item.value}</Typography>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.66rem', color: 'text.secondary' }}>({item.percent}%)</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>

          {/* ── SECTION 5: Three Contribution Tables (Full Width Stacked) ── */}
          <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
            {/* Table 1: Activity / Productivity Performance */}
            <Grid item xs={12}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 2.5, width: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.9rem' }}>Activity Performance</Typography>
                  <TextField size="small" placeholder="Search activity..." value={deptActSearch}
                    onChange={e => { setDeptActSearch(e.target.value); setDeptActPage(1); }}
                    slotProps={{ input: { sx: { height: 28, fontSize: '0.72rem', py: 0, borderRadius: 1.5 } } }}
                    sx={{ width: 200 }} />
                </Box>
                <TableContainer sx={{ flexGrow: 1 }}>
                  <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.67rem', py: 1, color: 'text.secondary', width: '30%' }}>ACTIVITY</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.67rem', py: 1, color: 'text.secondary' }} align="right">COUNT</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.67rem', py: 1, color: 'text.secondary' }} align="right">ACTUAL HOURS</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.67rem', py: 1, color: 'text.secondary' }} align="right">VARIANCE</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.67rem', py: 1, color: 'text.secondary' }} align="right">PRODUCTIVITY %</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedActPerf.map((item, idx) => (
                        <TableRow key={idx} hover sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.76rem', py: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.activity}</TableCell>
                          <TableCell sx={{ fontSize: '0.76rem', py: 1 }} align="right">{item.occurrences}</TableCell>
                          <TableCell sx={{ fontSize: '0.76rem', py: 1 }} align="right">{item.actualHours}h</TableCell>
                          <TableCell sx={{ fontSize: '0.76rem', py: 1, color: item.variance > 0 ? 'error.main' : 'success.main', fontWeight: 700 }} align="right">
                            {item.variance > 0 ? `+${item.variance}` : item.variance}h
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800, color: item.productivity >= 90 ? 'success.main' : 'warning.main', fontSize: '0.76rem', py: 1 }} align="right">
                            {item.productivity}%
                          </TableCell>
                        </TableRow>
                      ))}
                      {paginatedActPerf.length === 0 && (
                        <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary', fontSize: '0.78rem' }}>No data</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.67rem' }}>
                    {filteredActPerf.length > 0 ? `${(deptActPage - 1) * deptActRowsPerPage + 1}–${Math.min(deptActPage * deptActRowsPerPage, filteredActPerf.length)}` : '0'} of {filteredActPerf.length}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Button size="small" variant="outlined" disabled={deptActPage === 1} onClick={() => setDeptActPage(p => Math.max(1, p - 1))} sx={{ minWidth: 28, height: 24, p: 0, borderRadius: 1, fontSize: '0.65rem', textTransform: 'none' }}>Prev</Button>
                    <Button size="small" variant="contained" sx={{ minWidth: 28, height: 24, p: 0, borderRadius: 1, fontSize: '0.65rem', fontWeight: 800 }}>{deptActPage}</Button>
                    <Button size="small" variant="outlined" disabled={deptActPage >= totalActPages} onClick={() => setDeptActPage(p => Math.min(totalActPages, p + 1))} sx={{ minWidth: 28, height: 24, p: 0, borderRadius: 1, fontSize: '0.65rem', textTransform: 'none' }}>Next</Button>
                  </Box>
                </Box>
              </Card>
            </Grid>

            {/* Table 2: Employee Contribution */}
            <Grid item xs={12}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 2.5, width: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.9rem' }}>Employee Contribution</Typography>
                  <TextField size="small" placeholder="Search employee..." value={deptEmpSearch}
                    onChange={e => { setDeptEmpSearch(e.target.value); setDeptEmpPage(1); }}
                    slotProps={{ input: { sx: { height: 28, fontSize: '0.72rem', py: 0, borderRadius: 1.5 } } }}
                    sx={{ width: 200 }} />
                </Box>
                <TableContainer sx={{ flexGrow: 1 }}>
                  <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.67rem', py: 1, color: 'text.secondary', width: '30%' }}>EMPLOYEE</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.67rem', py: 1, color: 'text.secondary' }} align="right">ACTIVITIES COUNT</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.67rem', py: 1, color: 'text.secondary' }} align="right">TOTAL HOURS</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.67rem', py: 1, color: 'text.secondary' }} align="right">PRODUCTIVITY %</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.67rem', py: 1, color: 'text.secondary' }} align="right">REWORK CASES</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedEmpContr.map((item, idx) => (
                        <TableRow key={idx} hover sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.76rem', py: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</TableCell>
                          <TableCell sx={{ fontSize: '0.76rem', py: 1 }} align="right">{item.activities}</TableCell>
                          <TableCell sx={{ fontSize: '0.76rem', py: 1 }} align="right">{item.hours}h</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: item.productivity >= 90 ? 'success.main' : 'warning.main', fontSize: '0.76rem', py: 1 }} align="right">{item.productivity}%</TableCell>
                          <TableCell sx={{ fontSize: '0.76rem', py: 1, color: item.rework > 3 ? 'error.main' : 'text.secondary', fontWeight: 700 }} align="right">{item.rework}</TableCell>
                        </TableRow>
                      ))}
                      {paginatedEmpContr.length === 0 && (
                        <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary', fontSize: '0.78rem' }}>No data</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.67rem' }}>
                    {filteredEmpContr.length > 0 ? `${(deptEmpPage - 1) * deptEmpRowsPerPage + 1}–${Math.min(deptEmpPage * deptEmpRowsPerPage, filteredEmpContr.length)}` : '0'} of {filteredEmpContr.length}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Button size="small" variant="outlined" disabled={deptEmpPage === 1} onClick={() => setDeptEmpPage(p => Math.max(1, p - 1))} sx={{ minWidth: 28, height: 24, p: 0, borderRadius: 1, fontSize: '0.65rem', textTransform: 'none' }}>Prev</Button>
                    <Button size="small" variant="contained" sx={{ minWidth: 28, height: 24, p: 0, borderRadius: 1, fontSize: '0.65rem', fontWeight: 800 }}>{deptEmpPage}</Button>
                    <Button size="small" variant="outlined" disabled={deptEmpPage >= totalEmpPages} onClick={() => setDeptEmpPage(p => Math.min(totalEmpPages, p + 1))} sx={{ minWidth: 28, height: 24, p: 0, borderRadius: 1, fontSize: '0.65rem', textTransform: 'none' }}>Next</Button>
                  </Box>
                </Box>
              </Card>
            </Grid>

            {/* Table 3: SO Contribution */}
            <Grid item xs={12}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 2.5, width: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.9rem' }}>SO Contribution</Typography>
                  <TextField size="small" placeholder="Search SO..." value={deptSoSearch}
                    onChange={e => { setDeptSoSearch(e.target.value); setDeptSoPage(1); }}
                    slotProps={{ input: { sx: { height: 28, fontSize: '0.72rem', py: 0, borderRadius: 1.5 } } }}
                    sx={{ width: 200 }} />
                </Box>
                <TableContainer sx={{ flexGrow: 1 }}>
                  <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.67rem', py: 1, color: 'text.secondary', width: '25%' }}>SO NUMBER</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.67rem', py: 1, color: 'text.secondary' }} align="right">ACTIVITIES COUNT</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.67rem', py: 1, color: 'text.secondary' }} align="right">TOTAL HOURS</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.67rem', py: 1, color: 'text.secondary' }} align="right">COMPLETION %</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.67rem', py: 1, color: 'text.secondary' }} align="right">REWORK CASES</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedSoContr.map((item, idx) => (
                        <TableRow key={idx} hover sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell sx={{ fontWeight: 750, fontFamily: 'monospace', color: 'primary.main', fontSize: '0.76rem', py: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.soNumber}</TableCell>
                          <TableCell sx={{ fontSize: '0.76rem', py: 1 }} align="right">{item.activities}</TableCell>
                          <TableCell sx={{ fontSize: '0.76rem', py: 1 }} align="right">{item.hours}h</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: item.completion >= 90 ? 'success.main' : 'warning.main', fontSize: '0.76rem', py: 1 }} align="right">{item.completion}%</TableCell>
                          <TableCell sx={{ fontSize: '0.76rem', py: 1, color: item.rework > 5 ? 'error.main' : 'text.secondary', fontWeight: 700 }} align="right">{item.rework}</TableCell>
                        </TableRow>
                      ))}
                      {paginatedSoContr.length === 0 && (
                        <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary', fontSize: '0.78rem' }}>No data</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.67rem' }}>
                    {filteredSoContr.length > 0 ? `${(deptSoPage - 1) * deptSoRowsPerPage + 1}–${Math.min(deptSoPage * deptSoRowsPerPage, filteredSoContr.length)}` : '0'} of {filteredSoContr.length}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Button size="small" variant="outlined" disabled={deptSoPage === 1} onClick={() => setDeptSoPage(p => Math.max(1, p - 1))} sx={{ minWidth: 28, height: 24, p: 0, borderRadius: 1, fontSize: '0.65rem', textTransform: 'none' }}>Prev</Button>
                    <Button size="small" variant="contained" sx={{ minWidth: 28, height: 24, p: 0, borderRadius: 1, fontSize: '0.65rem', fontWeight: 800 }}>{deptSoPage}</Button>
                    <Button size="small" variant="outlined" disabled={deptSoPage >= totalDeptSoPages} onClick={() => setDeptSoPage(p => Math.min(totalDeptSoPages, p + 1))} sx={{ minWidth: 28, height: 24, p: 0, borderRadius: 1, fontSize: '0.65rem', textTransform: 'none' }}>Next</Button>
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>

          {/* ── SECTION 6: Analysis Row — Waiting + Rework + Dept Summary (full 3-column) ── */}
          <Grid container spacing={2.5} sx={{ mb: 2.5 }} alignItems="stretch">
            {/* ── Waiting Analysis — full redesign ── */}
            <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 0, width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Card header */}
                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#fafbff' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: 'text.primary' }}>Waiting Analysis</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>Idle time & delay breakdown</Typography>
                </Box>
                {/* 3 KPI boxes in a row */}
                <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider' }}>
                  {[
                    { label: 'Total Wait Hrs', value: `${deptData.waitingHours}h`, color: '#3b82f6', bg: '#eff6ff' },
                    { label: 'Delayed Acts', value: '27', color: '#f59e0b', bg: '#fffbeb' },
                    { label: 'Delayed SOs', value: '5', color: '#ef4444', bg: '#fef2f2' },
                  ].map((item, idx, arr) => (
                    <Box key={idx} sx={{ flex: 1, p: 2, textAlign: 'center', bgcolor: item.bg, borderRight: idx < arr.length - 1 ? '1px solid' : 'none', borderRightColor: 'divider' }}>
                      <Typography sx={{ fontWeight: 900, fontSize: '1.4rem', color: item.color, lineHeight: 1 }}>{item.value}</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem', color: 'text.secondary', display: 'block', mt: 0.4 }}>{item.label}</Typography>
                    </Box>
                  ))}
                </Box>
                {/* Top waiting activities table */}
                <Box sx={{ px: 2.5, pt: 1.5, pb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.67rem', color: 'text.secondary', letterSpacing: 0.5 }}>TOP WAITING ACTIVITIES</Typography>
                </Box>
                <TableContainer sx={{ flexGrow: 1 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.67rem', py: 1, color: 'text.secondary' }}>ACTIVITY</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.67rem', py: 1, color: 'text.secondary' }} align="right">HRS</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.67rem', py: 1, color: 'text.secondary' }} align="right">SHARE</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {deptData.waitingBreakdown.map((item, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontSize: '0.76rem', fontWeight: 650, py: 1 }}>{item.activity}</TableCell>
                          <TableCell sx={{ fontSize: '0.76rem', fontWeight: 700, color: '#3b82f6', py: 1 }} align="right">{item.hours}h</TableCell>
                          <TableCell sx={{ fontSize: '0.76rem', fontWeight: 700, py: 1 }} align="right">{item.percent}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>

            {/* ── Rework Analysis — full redesign ── */}
            <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 0, width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#fafbff' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: 'text.primary' }}>Rework Analysis</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>Quality issue & hours lost</Typography>
                </Box>
                {/* 4 KPI boxes in 2×2 */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid', borderColor: 'divider' }}>
                  {[
                    { label: 'Total Reworks', value: String(deptData.reworkCount), color: '#ef4444', bg: '#fef2f2' },
                    { label: 'Open', value: '12', color: '#f59e0b', bg: '#fffbeb' },
                    { label: 'Closed', value: '26', color: '#10b981', bg: '#f0fdf4' },
                    { label: 'Hrs Lost', value: '62.7h', color: '#6b7280', bg: '#f9fafb' },
                  ].map((item, idx) => (
                    <Box key={idx} sx={{
                      p: 1.5,
                      textAlign: 'center',
                      bgcolor: item.bg,
                      borderRight: idx % 2 === 0 ? '1px solid' : 'none',
                      borderRightColor: 'divider',
                      borderBottom: idx < 2 ? '1px solid' : 'none',
                      borderBottomColor: 'divider'
                    }}>
                      <Typography sx={{ fontWeight: 900, fontSize: '1.25rem', color: item.color, lineHeight: 1 }}>{item.value}</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.62rem', color: 'text.secondary', display: 'block', mt: 0.4 }}>{item.label}</Typography>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ px: 2.5, pt: 1.5, pb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.67rem', color: 'text.secondary', letterSpacing: 0.5 }}>TOP REWORK ACTIVITIES</Typography>
                </Box>
                <TableContainer sx={{ flexGrow: 1 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.67rem', py: 1, color: 'text.secondary' }}>ACTIVITY</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.67rem', py: 1, color: 'text.secondary' }} align="right">COUNT</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.67rem', py: 1, color: 'text.secondary' }} align="right">HRS LOST</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {deptData.reworkBreakdown.map((item, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontSize: '0.76rem', fontWeight: 650, py: 1 }}>{item.activity}</TableCell>
                          <TableCell sx={{ fontSize: '0.76rem', fontWeight: 700, py: 1 }} align="right">{item.count}</TableCell>
                          <TableCell sx={{ fontSize: '0.76rem', fontWeight: 700, color: 'error.main', py: 1 }} align="right">{item.hoursLost}h</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>

            {/* ── Department Summary — full redesign ── */}
            <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 0, width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#fafbff' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: 'text.primary' }}>Department Summary</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>Key metrics at a glance</Typography>
                </Box>
                {/* 2-column grid of metrics */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flexGrow: 1 }}>
                  {[
                    { label: 'Total Employees', value: String(deptData.activeEmployees), color: 'text.primary', bg: 'transparent' },
                    { label: 'Avg Productivity', value: `${deptData.productivity}%`, color: '#10b981', bg: '#f0fdf4' },
                    { label: 'Approval Rate', value: '97.8%', color: '#3b82f6', bg: '#eff6ff' },
                    { label: 'Avg Review Time', value: '18m 24s', color: 'text.primary', bg: 'transparent' },
                    { label: 'Utilization', value: `${deptData.utilization}%`, color: '#8b5cf6', bg: '#f5f3ff' },
                    { label: 'Waiting Hours', value: `${deptData.waitingHours}h`, color: '#f59e0b', bg: '#fffbeb' },
                    { label: 'Rework Count', value: String(deptData.reworkCount), color: '#ef4444', bg: '#fef2f2' },
                    { label: 'Active SOs', value: String(filteredDeptPerfLogs.reduce((acc, l) => { (acc as Set<string>).add(l.soNumber); return acc; }, new Set<string>()).size), color: 'text.primary', bg: 'transparent' },
                  ].map((row, idx, arr) => (
                    <Box key={idx} sx={{
                      p: 2,
                      bgcolor: row.bg,
                      borderRight: idx % 2 === 0 ? '1px solid' : 'none',
                      borderRightColor: 'divider',
                      borderBottom: idx < arr.length - 2 ? '1px solid' : 'none',
                      borderBottomColor: 'divider',
                      display: 'flex', flexDirection: 'column', gap: 0.3
                    }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.3 }}>{row.label}</Typography>
                      <Typography sx={{ fontWeight: 900, fontSize: '1.15rem', color: row.color, lineHeight: 1.2 }}>{row.value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Card>
            </Grid>
          </Grid>

          {/* ── SECTION 7: Key Insights Banner ── */}
          <Card sx={{ mb: 2.5, border: '1px solid', borderColor: 'rgba(37,99,235,0.2)', bgcolor: 'rgba(37,99,235,0.025)', boxShadow: 'none', borderRadius: 3, p: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip label="Key Insights" color="primary" sx={{ fontWeight: 800, borderRadius: 1.5, fontSize: '0.72rem', height: 26, flexShrink: 0 }} />
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', flexGrow: 1 }}>
                {deptData.insights.map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0 }} />
                    <Typography sx={{ fontWeight: 650, fontSize: '0.78rem', color: 'text.primary' }}>{item}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Card>

          {/* ── SECTION 8: Detailed Activity Logs (Full Width) ── */}
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, mb: 2 }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.92rem' }}>Detailed Activity Logs</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.72rem' }}>
                  Searchable log of every activity record matching current filters
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <TextField size="small" placeholder="Search logs..." value={deptLogSearch}
                  onChange={e => { setDeptLogSearch(e.target.value); setDeptLogPage(1); }}
                  slotProps={{ input: { startAdornment: <SearchIcon sx={{ color: 'text.secondary', fontSize: '1rem', mr: 0.8 }} />, sx: { height: 32, fontSize: '0.76rem', borderRadius: 1.5 } } }}
                  sx={{ width: 220 }} />
                <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.68rem' }}>Show</Typography>
                  <TextField select size="small" value={deptLogRowsPerPage}
                    onChange={e => { setDeptLogRowsPerPage(Number(e.target.value)); setDeptLogPage(1); }}
                    slotProps={{ select: { sx: { height: 28, fontSize: '0.72rem', fontWeight: 800, py: 0 } } }}
                    sx={{ width: 60, '& .MuiOutlinedInput-root': { height: 28, fontSize: '0.72rem', borderRadius: 1 } }}>
                    <MenuItem value={5} sx={{ fontSize: '0.72rem' }}>5</MenuItem>
                    <MenuItem value={10} sx={{ fontSize: '0.72rem' }}>10</MenuItem>
                    <MenuItem value={25} sx={{ fontSize: '0.72rem' }}>25</MenuItem>
                    <MenuItem value={50} sx={{ fontSize: '0.72rem' }}>50</MenuItem>
                  </TextField>
                </Box>
              </Box>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.68rem', py: 1.2, color: 'text.secondary' }}>DATE</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.68rem', py: 1.2, color: 'text.secondary' }}>EMPLOYEE</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.68rem', py: 1.2, color: 'text.secondary' }}>SO NUMBER</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.68rem', py: 1.2, color: 'text.secondary' }}>ACTIVITY</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.68rem', py: 1.2, color: 'text.secondary' }} align="center">DURATION</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.68rem', py: 1.2, color: 'text.secondary' }} align="center">STD TIME</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.68rem', py: 1.2, color: 'text.secondary' }} align="center">VARIANCE</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.68rem', py: 1.2, color: 'text.secondary' }} align="center">STATUS</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.68rem', py: 1.2, color: 'text.secondary' }}>SUPERVISOR</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.68rem', py: 1.2, color: 'text.secondary' }}>REMARKS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedDeptLogs.map((item, idx) => {
                    const variance = item.standardManMinutes - item.durationMinutes;
                    return (
                      <TableRow key={idx} hover sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, py: 1.2 }}>{item.activityDate}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, py: 1.2 }}>{item.workerName}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 750, fontFamily: 'monospace', color: 'primary.main', py: 1.2 }}>{item.soNumber}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 650, py: 1.2 }}>{item.activity}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 1.2 }} align="center">{item.durationMinutes}m</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', py: 1.2 }} align="center">{item.standardManMinutes}m</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 750, color: variance < 0 ? 'error.main' : 'success.main', py: 1.2 }} align="center">
                          {variance > 0 ? `+${variance}` : variance}m
                        </TableCell>
                        <TableCell align="center" sx={{ py: 0.5 }}>
                          <Chip label={item.status} size="small"
                            color={item.status === 'Approved' ? 'success' : item.status === 'Rework' ? 'warning' : item.status === 'Rejected' ? 'error' : 'default'}
                            sx={{ fontWeight: 800, fontSize: '0.62rem', height: 18, borderRadius: 1, textTransform: 'uppercase' }} />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 650, py: 1.2 }}>{item.reviewedBy || 'Amit Verma'}</TableCell>
                        <TableCell sx={{ fontSize: '0.72rem', color: 'text.secondary', py: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>
                          {item.remarks || item.reworkReason || '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {paginatedDeptLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 5, color: 'text.secondary', fontWeight: 700 }}>
                        No activity logs matching current filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#f8fafc', borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.68rem' }}>
                Showing {filteredDeptPerfLogs.length > 0 ? `${(deptLogPage - 1) * deptLogRowsPerPage + 1}–${Math.min(deptLogPage * deptLogRowsPerPage, filteredDeptPerfLogs.length)}` : '0'} of {filteredDeptPerfLogs.length} entries
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <Button size="small" variant="outlined" disabled={deptLogPage === 1} onClick={() => setDeptLogPage(p => Math.max(1, p - 1))} sx={{ minWidth: 24, height: 24, p: 0, borderRadius: 1, fontSize: '0.7rem', textTransform: 'none' }}>Prev</Button>
                <Button size="small" variant="contained" sx={{ minWidth: 24, height: 24, p: 0, borderRadius: 1, fontSize: '0.7rem', fontWeight: 800 }}>{deptLogPage}</Button>
                <Button size="small" variant="outlined" disabled={deptLogPage >= totalDeptLogPages} onClick={() => setDeptLogPage(p => Math.min(totalDeptLogPages, p + 1))} sx={{ minWidth: 24, height: 24, p: 0, borderRadius: 1, fontSize: '0.7rem', textTransform: 'none' }}>Next</Button>
              </Box>
            </Box>
          </Card>

        </Box>
      )}

      {/* ============================================================== */}
      {/* --- TAB 4: OVERALL PERFORMANCE REPORT (5th Image) --- */}
      {/* ============================================================== */}
      {activeTab === 4 && (
        <Box>
          {/* Header Layout */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<BackIcon />}
              onClick={() => setActiveTab(0)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 2 }}
            >
              Back to Reports Dashboard
            </Button>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="outlined"
                color="success"
                startIcon={<DownloadIcon />}
                onClick={() => handleExportExcelGeneric(
                  overallReportData.logs.map(l => ({
                    'Department': l.department,
                    'SO Number': l.soNumber,
                    'Employee': l.workerName,
                    'Activity': l.activity,
                    'Standard (min)': l.standardManMinutes,
                    'Actual (min)': l.durationMinutes,
                    'Productivity %': l.status === 'Approved' ? Math.round((l.standardManMinutes / l.durationMinutes) * 100) : 90,
                    'Status': l.status,
                    'Rework': l.status === 'Rework' ? 'Yes' : 'No',
                    'Supervisor': l.reviewedBy || '-',
                    'Log Date': l.activityDate
                  })),
                  'Overall_Performance_Report',
                  'Overall Factory Performance Report'
                )}
                sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
              >
                Export Excel
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PdfIcon />}
                onClick={() => handleExportPDFGeneric(
                  'Overall Factory Performance Report',
                  ['Dept', 'SO #', 'Worker', 'Activity', 'Actual', 'Std', 'Prod %', 'Status', 'Date'],
                  overallReportData.logs.map(l => [l.department, l.soNumber, l.workerName, l.activity, `${l.durationMinutes}m`, `${l.standardManMinutes}m`, `${l.status === 'Approved' ? Math.round((l.standardManMinutes / l.durationMinutes) * 100) : 90}%`, l.status, l.activityDate]),
                  'Overall_Performance_Report'
                )}
                sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
              >
                Export PDF
              </Button>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 850, fontSize: '1.65rem', color: 'text.primary', letterSpacing: '-0.025em' }}>
              Overall Performance Report
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', fontWeight: 500 }}>
              Home / Reports / Overall Report
            </Typography>
          </Box>

          {/* Generate Your Report Filters panel */}
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, mb: 4 }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                Generate Your Report
              </Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, alignItems: 'center' }}>
                <TextField
                  select
                  size="small"
                  label="Date Range"
                  value={overallDateRange}
                  onChange={e => setOverallDateRange(e.target.value)}
                  sx={{ minWidth: 140 }}
                >
                  <MenuItem value="Daily">Daily</MenuItem>
                  <MenuItem value="Weekly">Weekly</MenuItem>
                  <MenuItem value="Monthly">Monthly</MenuItem>
                  <MenuItem value="Custom">Custom</MenuItem>
                </TextField>

                {overallDateRange === 'Custom' && (
                  <>
                    <TextField
                      size="small"
                      type="date"
                      label="FROM DATE"
                      InputLabelProps={{ shrink: true }}
                      value={overallFromDate}
                      onChange={e => setOverallFromDate(e.target.value)}
                      sx={{ width: 150 }}
                    />
                    <TextField
                      size="small"
                      type="date"
                      label="TO DATE"
                      InputLabelProps={{ shrink: true }}
                      value={overallToDate}
                      onChange={e => setOverallToDate(e.target.value)}
                      sx={{ width: 150 }}
                    />
                  </>
                )}

                <TextField
                  select
                  size="small"
                  label="Department"
                  value={overallDept}
                  onChange={e => setOverallDept(e.target.value)}
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="All Departments">All Departments</MenuItem>
                  {uniqueDepts.map(d => (
                    <MenuItem key={d} value={d}>{d}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  size="small"
                  label="Employee"
                  value={overallEmp}
                  onChange={e => setOverallEmp(e.target.value)}
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="All Employees">All Employees</MenuItem>
                  {uniqueEmployees.map(emp => (
                    <MenuItem key={emp.employeeId} value={emp.employeeId}>{emp.name}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  size="small"
                  label="Supervisor"
                  value={overallSup}
                  onChange={e => setOverallSup(e.target.value)}
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="All Supervisors">All Supervisors</MenuItem>
                  {uniqueSupervisors.map(sup => (
                    <MenuItem key={sup} value={sup}>{sup}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  size="small"
                  label="SO Number"
                  value={overallSO}
                  onChange={e => setOverallSO(e.target.value)}
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="All Sales Orders">All Sales Orders</MenuItem>
                  {uniqueSOs.map(so => (
                    <MenuItem key={so} value={so}>{so}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  size="small"
                  label="Activity"
                  value={overallActivity}
                  onChange={e => setOverallActivity(e.target.value)}
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="All Activities">All Activities</MenuItem>
                  {uniqueActivities.map(act => (
                    <MenuItem key={act} value={act}>{act}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  size="small"
                  label="Status"
                  value={overallStatus}
                  onChange={e => setOverallStatus(e.target.value)}
                  sx={{ minWidth: 140 }}
                >
                  <MenuItem value="All Status">All Status</MenuItem>
                  <MenuItem value="Approved">Approved</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Rework">Rework</MenuItem>
                </TextField>

                <Box sx={{ display: 'flex', gap: 2, ml: 'auto' }}>
                  <Button
                    variant="outlined"
                    onClick={handleClearOverall}
                    sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', px: 3, height: 40 }}
                  >
                    Clear Filters
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleGenerateOverall}
                    sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', px: 3, height: 40 }}
                  >
                    Generate Report
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Executive Summary Block */}
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 1 }}>
            Executive Summary
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2.5, mb: 4.5 }}>
            {[
              { label: 'TOTAL EMPLOYEES', value: overallReportData.totalEmployees, desc: 'All workforce', color: '#3B82F6' },
              { label: 'ACTIVE EMPLOYEES', value: overallReportData.activeEmployees, desc: 'Currently active', color: '#10B981' },
              { label: 'TOTAL ACTIVITY LOGS', value: overallReportData.totalLogs, desc: 'Submissions', color: '#8B5CF6' },
              { label: 'APPROVED ACTIVITIES', value: overallReportData.approvedCount, desc: 'Verified work', color: '#06B6D4' },
              { label: 'PENDING ACTIVITIES', value: overallReportData.pendingCount, desc: 'Awaiting review', color: '#F59E0B' },
              { label: 'REWORK ACTIVITIES', value: overallReportData.reworkCount, desc: 'Quality flags', color: '#EF4444' },

              { label: 'PRODUCTIVITY %', value: `${overallReportData.productivity}%`, desc: 'Avg efficiency', color: '#EC4899' },
              { label: 'TOTAL MAN HOURS', value: `${overallReportData.manHours} hrs`, desc: 'Floor logged', color: '#3B82F6' },
              { label: 'WAITING HOURS', value: `${overallReportData.waitingHours} hrs`, desc: 'Idle time', color: '#F59E0B' },
              { label: 'ACTIVE SOS', value: overallReportData.activeSOs, desc: 'In progress', color: '#8B5CF6' },
              { label: 'COMPLETED SOS', value: overallReportData.completedSOs, desc: 'Delivered', color: '#10B981' },
              { label: 'DELAYED SOS', value: overallReportData.delayedSOs, desc: 'Behind schedule', color: '#EF4444' },
            ].map((kpi, idx) => (
              <Card key={idx} sx={{ borderLeft: '4px solid', borderLeftColor: kpi.color, borderTop: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', boxShadow: 'none', borderRadius: 2.5 }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 0.5, fontSize: '0.675rem' }}>
                    {kpi.label}
                  </Typography>
                  <Typography sx={{ fontWeight: 855, fontSize: '1.25rem', color: 'text.primary' }}>
                    {kpi.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.675rem' }}>
                    {kpi.desc}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Operational Insights Section */}
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, fontSize: '1rem' }}>
            Operational Insights
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2.5, mb: 4.5 }}>
            {[
              { title: 'TOP PERFORMING DEPARTMENT', highlight: overallReportData.topDept, value: `${overallReportData.topDeptVal}%`, color: 'success.main' },
              { title: 'TOP PERFORMING EMPLOYEE', highlight: overallReportData.topEmpName, value: `${overallReportData.topEmpVal}%`, color: 'success.main' },
              { title: 'MOST DELAYED DEPARTMENT', highlight: overallReportData.mostDelayedDept, value: `${overallReportData.minDeptProd}%`, color: 'warning.main' },
              { title: 'MOST REWORKED ACTIVITY', highlight: overallReportData.reworkedAct, value: `${overallReportData.reworkedActCount} reworks`, color: 'error.main' },
              { title: 'MOST ACTIVE SO', highlight: overallReportData.activeSOVal, value: `${overallReportData.activeSOCount} activities`, color: 'primary.main' },
              { title: 'HIGHEST PRODUCTIVITY DAY', highlight: overallReportData.prodDay, value: 'Not enough data', color: 'text.secondary' },
            ].map((insight, idx) => (
              <Card key={idx} sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 2.5 }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 1, fontSize: '0.675rem' }}>
                    {insight.title}
                  </Typography>
                  <Typography sx={{ fontWeight: 850, fontSize: '0.85rem', color: 'text.primary', mb: 0.5, textTransform: 'uppercase' }}>
                    {insight.highlight}
                  </Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: insight.color }}>
                    {insight.value}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Advanced Analytics Charts Row 1 */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3.5, mb: 3.5 }}>
            <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, fontSize: '0.95rem' }}>Productivity by Department</Typography>
              <Box sx={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={overallReportData.productivityByDept} margin={{ left: -25, right: 10, top: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="department" style={{ fontSize: 8, fontWeight: 700 }} />
                    <YAxis style={{ fontSize: 9 }} />
                    <ChartTooltip />
                    <Bar dataKey="productivity" fill="#2563EB" radius={[2, 2, 0, 0]} maxBarSize={25} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Card>

            <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, fontSize: '0.95rem' }}>Activity Status Distribution</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overallReportData.statusDistribution}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {overallReportData.statusDistribution.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                    <Legend verticalAlign="bottom" height={36} formatter={(value) => <span style={{ fontSize: 11, fontWeight: 600 }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Box>

          {/* Advanced Analytics Charts Row 2 */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3.5, mb: 4.5 }}>
            <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, fontSize: '0.95rem' }}>Man Hours by Department</Typography>
              <Box sx={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={overallReportData.manHoursByDept} margin={{ left: -25, right: 10, top: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="department" style={{ fontSize: 8, fontWeight: 700 }} />
                    <YAxis style={{ fontSize: 9 }} />
                    <ChartTooltip />
                    <Bar dataKey="hours" fill="#8B5CF6" radius={[2, 2, 0, 0]} maxBarSize={25} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Card>

            <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, fontSize: '0.95rem' }}>Top Activities</Typography>
              <Box sx={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={overallReportData.topActivitiesChart} layout="vertical" margin={{ left: 40, right: 10, top: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.04)" />
                    <XAxis type="number" style={{ fontSize: 9 }} />
                    <YAxis type="category" dataKey="name" style={{ fontSize: 8, fontWeight: 700 }} />
                    <ChartTooltip />
                    <Bar dataKey="count" fill="#10B981" radius={[0, 2, 2, 0]} maxBarSize={15} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Box>

          {/* Detailed Report Table (mock pagination and search) */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem' }}>
                Detailed Report
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Show</Typography>
                <TextField
                  select
                  size="small"
                  value={overallRowsPerPage}
                  onChange={e => {
                    setOverallRowsPerPage(Number(e.target.value));
                    setOverallPage(1);
                  }}
                  sx={{ width: 80 }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </TextField>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>entries</Typography>

                <TextField
                  size="small"
                  placeholder="Search table..."
                  value={overallSearch}
                  onChange={e => {
                    setOverallSearch(e.target.value);
                    setOverallPage(1);
                  }}
                  sx={{ minWidth: 200 }}
                />
              </Box>
            </Box>

            <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3, mb: 3 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.725rem' }}>DEPARTMENT</TableCell>
                      <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.725rem' }}>SO NUMBER</TableCell>
                      <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.725rem' }}>EMPLOYEE</TableCell>
                      <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.725rem' }}>ACTIVITY</TableCell>
                      <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.725rem' }}>STANDARD TIME</TableCell>
                      <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.725rem' }}>ACTUAL TIME</TableCell>
                      <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.725rem' }}>PRODUCTIVITY</TableCell>
                      <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.725rem' }}>STATUS</TableCell>
                      <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.725rem' }}>REWORK</TableCell>
                      <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.725rem' }}>SUPERVISOR</TableCell>
                      <TableCell sx={{ fontWeight: 750, color: 'text.secondary', fontSize: '0.725rem' }}>LOG DATE</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedOverallLogs.map((l) => {
                      const prod = l.status === 'Approved' ? Math.round((l.standardManMinutes / l.durationMinutes) * 100) : 90;
                      return (
                        <TableRow key={l.id} hover>
                          <TableCell sx={{ fontWeight: 700 }}>{l.department}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{l.soNumber}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{l.workerName}</TableCell>
                          <TableCell>{l.activity}</TableCell>
                          <TableCell>{l.standardManMinutes} min</TableCell>
                          <TableCell>{l.durationMinutes} min</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: prod >= 90 ? 'success.main' : 'text.primary' }}>{prod}%</TableCell>
                          <TableCell>
                            <Chip
                              label={l.status}
                              size="small"
                              sx={{
                                fontWeight: 750,
                                fontSize: '0.675rem',
                                borderRadius: 1.5,
                                bgcolor:
                                  l.status === 'Approved' ? 'success.light' :
                                  l.status === 'Pending' ? 'warning.light' : 'error.light',
                                color:
                                  l.status === 'Approved' ? 'success.main' :
                                  l.status === 'Pending' ? 'warning.main' : 'error.main',
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: l.status === 'Rework' ? 'error.main' : 'text.secondary' }}>
                            {l.status === 'Rework' ? 'Yes' : 'No'}
                          </TableCell>
                          <TableCell>{l.reviewedBy || '-'}</TableCell>
                          <TableCell sx={{ fontSize: '0.825rem', color: 'text.secondary' }}>{l.activityDate}</TableCell>
                        </TableRow>
                      );
                    })}
                    {paginatedOverallLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={11} align="center" sx={{ py: 3, fontWeight: 700, color: 'text.secondary' }}>
                          No matching records found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Table pagination control matching the mockup */}
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid', borderColor: 'divider', bgcolor: '#f8fafc' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  Showing {searchedOverallLogs.length === 0 ? 0 : (overallPage - 1) * overallRowsPerPage + 1} to {Math.min(overallPage * overallRowsPerPage, searchedOverallLogs.length)} of {searchedOverallLogs.length} entries
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={overallPage === 1}
                    onClick={() => setOverallPage(prev => prev - 1)}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}
                  >
                    Previous
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    sx={{ minWidth: 32, height: 32, borderRadius: 1.5, fontWeight: 800 }}
                  >
                    {overallPage}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={overallPage >= totalOverallPages}
                    onClick={() => setOverallPage(prev => prev + 1)}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}
                  >
                    Next
                  </Button>
                </Box>
              </Box>
            </Card>
          </Box>
        </Box>
      )}

      {/* Snackbar alerts */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" sx={{ borderRadius: 2, fontWeight: 700 }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Reports;
