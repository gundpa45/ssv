import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
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
  Avatar,
  Snackbar,
  Alert,
  TextField,
  MenuItem,
  InputAdornment,
  LinearProgress,
  Skeleton,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  Autocomplete,
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  HelpOutlined as FormulaIcon,
  Timeline as DailyIcon,
  DateRange as WeeklyIcon,
  Assessment as MonthlyIcon,
  Group as PerformersIcon,
  Warning as ReworkIcon,
  BarChart as DeptIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  PictureAsPdf as PdfIcon,
  EmojiEvents as TrophyIcon,
  CheckCircle as CheckIcon,
  TrendingUp as TrendIcon,
  Refresh as RefreshIcon,
  FiberManualRecord as LiveDotIcon,
  Analytics as AnalyticsIcon,
  AccessTime as ClockIcon,
  Speed as SpeedIcon,
  ReportProblem as ReportIcon,
  RateReview as ReviewIcon,
  Visibility as PreviewIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
  Cell,
} from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';




// â”€â”€ UI component: perâ€‘section download bar
const SectionDownloadBar: React.FC<{
  label: string;
  onDownloadBackend: () => void;
  onDownloadFrontend?: () => void;
}> = ({ onDownloadBackend, onDownloadFrontend }) => (
  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mb: 2 }}>
    <Button
      variant="outlined"
      startIcon={<DownloadIcon />}
      onClick={onDownloadBackend}
      sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.82rem' }}
    >
      Download Excel
    </Button>
    {onDownloadFrontend && (
      <Button
        variant="contained"
        startIcon={<PdfIcon />}
        onClick={onDownloadFrontend}
        sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.82rem', background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' }}
      >
        Download PDF
      </Button>
    )}
  </Box>
);

// Existing helper functions
const savePDF = (doc: import('jspdf').jsPDF, filename: string) => {
  const blob = doc.output('blob');
  triggerDownloadAndOpen(blob, filename);
};

const saveXLSX = (wb: XLSX.WorkBook, filename: string) => {
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  triggerDownloadAndOpen(blob, filename);
};

// Helper: download then open (for Excel & PDF)
const triggerDownloadAndOpen = (blob: Blob, filename: string) => {
  saveAs(blob, filename);
  const url = URL.createObjectURL(blob);
  const newTab = window.open(url, '_blank');
  if (!newTab) {
    // Popâ€‘up blocked
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};



// â”€â”€â”€ API Base â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


const pctColor = (p: number | null) => {
  if (p === null) return '#94A3B8';
  if (p <= 85) return '#10B981';
  if (p <= 100) return '#3B82F6';
  if (p <= 120) return '#F59E0B';
  return '#EF4444';
};

const fmtTime = (d: Date) =>
  d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

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
  
  if (period === 'Custom Date Range' || period === 'Custom Range') {
    if (startD && logDateStr < startD) return false;
    if (endD && logDateStr > endD) return false;
    return true;
  }

  return true;
};

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface NormalizedLog {
  id: string;
  userId: string;
  workerName: string;
  soNumber: string;
  department: string;
  activity: string;
  startTime: string;
  endTime: string;
  standardManMinutes: number;
  durationMinutes: number;
  remarks?: string;
  createdAt?: string;
  managerRemarks?: string;
  isRework?: boolean;
  reworkAssignedToId?: string;
  reworkAssignedToName?: string;
}

interface DashboardSummary {
  totalUsers: number;
  totalDepartments: number;
  totalActivities: number;
  totalSalesOrders: number;
  totalActivityLogs: number;
  totalManHours: number;
  activeUsers: number;
  completedActivities: number;
  averageProductivity: number;
  productivityTrend: { time: string; productivity: number; activeTasks: number; hasData: boolean }[];
}

// â”€â”€â”€ Skeleton Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const StatCardSkeleton = () => (
  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: 100 }}>
    <Skeleton variant="text" width="60%" height={16} sx={{ mb: 1 }} />
    <Skeleton variant="text" width="40%" height={32} />
    <Skeleton variant="text" width="80%" height={12} sx={{ mt: 0.5 }} />
  </Paper>
);

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface ReportsAnalyticsProps {
  defaultTab?: number;
}

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({ defaultTab = 0 }) => {
  const { themeMode, users, erpActivities, updateActivityLog, activityLogs } = useApp();
  const location = useLocation();

  // â”€â”€ State â”€â”€
  const [mainTab, setMainTab] = useState(() => {
    const stored = sessionStorage.getItem('reports_mainTab');
    return stored !== null ? Number(stored) : defaultTab;
  });
  const [trendTab, setTrendTab] = useState(() => {
    const stored = sessionStorage.getItem('reports_trendTab');
    return stored !== null ? Number(stored) : 0;
  });

  React.useEffect(() => {
    sessionStorage.setItem('reports_mainTab', String(mainTab));
  }, [mainTab]);

  React.useEffect(() => {
    sessionStorage.setItem('reports_trendTab', String(trendTab));
  }, [trendTab]);
  
  // â”€â”€ Live Data State â”€â”€
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [logs, setLogs] = useState<NormalizedLog[]>([]);
  const [liveUsers, setLiveUsers] = useState<typeof users>([]);

  const [selectedEmpId, setSelectedEmpId] = useState(() => (location.state as any)?.selectedEmpId || '');

  // Individual employee report filters
  const [indPeriodFilter, setIndPeriodFilter] = useState(() => (location.state as any)?.selectedEmpId ? 'All' : 'Custom Date Range');
  // Individual employee report filters dynamically defaulted to current month and day
  const [indFromDate, setIndFromDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [indToDate, setIndToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [indStatusFilter, setIndStatusFilter] = useState('All');

  // Applied states for individual employee preview
  const [appliedEmpId, setAppliedEmpId] = useState(() => (location.state as any)?.selectedEmpId || '');
  const [appliedPeriodFilter, setAppliedPeriodFilter] = useState(() => (location.state as any)?.selectedEmpId ? 'All' : 'Custom Date Range');
  const [appliedFromDate, setAppliedFromDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [appliedToDate, setAppliedToDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Handle passed location state for selecting a user
  React.useEffect(() => {
    // If a specific employee is selected via navigation state, open Individual Report tab
    if (location.state && (location.state as any).selectedEmpId) {
      const targetEmpId = (location.state as any).selectedEmpId;
      setSelectedEmpId(targetEmpId);
      setAppliedEmpId(targetEmpId);
      setIndPeriodFilter('All');
      setAppliedPeriodFilter('All');
      setMainTab(1);
    }
    // If the URL path indicates Individual Employee Report, force tab and hide overview
    if (location.pathname.includes('/individual-employee-report')) {
      setMainTab(1);
    }
  }, [location]);

  // Auto-select first user on initial load
  React.useEffect(() => {
    const displayUsers = liveUsers.length > 0 ? liveUsers : users;
    if (displayUsers.length > 0 && !selectedEmpId) {
      const firstUser = displayUsers[0];
      setSelectedEmpId(firstUser.userId);
      setAppliedEmpId(firstUser.userId);
    }
  }, [liveUsers, users, selectedEmpId]);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // â”€â”€ Review Log Modal State â”€â”€
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReviewLog, setSelectedReviewLog] = useState<NormalizedLog | null>(null);
  const [managerRemarksInput, setManagerRemarksInput] = useState('');
  const [isReworkInput, setIsReworkInput] = useState(false);
  const [reworkAssignedToIdInput, setReworkAssignedToIdInput] = useState('');

  const isInitialLoad = useRef(true);
  const prevLogsRef = useRef<any[]>(activityLogs || []);

  React.useEffect(() => { setMainTab(defaultTab); }, [defaultTab]);

  // â”€â”€ Save review changes to backend â”€â”€
  const handleSaveReview = async () => {
    if (!selectedReviewLog) return;
    setRefreshing(true);
    const success = await updateActivityLog(selectedReviewLog.id, {
      managerRemarks: managerRemarksInput.trim() || null,
      isRework: isReworkInput,
      reworkAssignedToId: isReworkInput && reworkAssignedToIdInput ? reworkAssignedToIdInput : null,
    });
    setRefreshing(false);
    if (success) {
      setSnackbar({ open: true, message: 'âœ… Log reviewed and updated successfully!', severity: 'success' });
      setReviewModalOpen(false);
      fetchAllData(true); // reload fresh data
    } else {
      setSnackbar({ open: true, message: 'âŒ Failed to update log review.', severity: 'error' });
    }
  };

  // â”€â”€ Normalize raw backend log â”€â”€
  const normalizeLog = (log: any): NormalizedLog => {
    if (log.workerName && log.isRework !== undefined) return log as NormalizedLog;
    const first = log.user?.firstName || '';
    const last = log.user?.lastName || '';
    const workerName = `${first} ${last}`.trim() || 'Unknown Worker';
    const employeeId = log.user?.employeeId || log.userId || 'EMP-UNKNOWN';
    const soNumber = log.SalesOrder?.soNumber || log.soId || 'SO-UNKNOWN';
    const departmentName = log.department?.name || log.departmentId || 'Unknown';
    const activityName = log.activity?.activityName || log.activityId || 'Unknown Activity';
    const firstSlot = log.slots?.[0];
    let startTime = '';
    let endTime = '';
    if (firstSlot?.startTime) {
      const d = new Date(firstSlot.startTime);
      if (!isNaN(d.getTime())) startTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (firstSlot?.endTime) {
      const d = new Date(firstSlot.endTime);
      if (!isNaN(d.getTime())) endTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    const standardManMinutes = log.activity?.standardManMinutes || log.standardManMinutes || 0;
    const durationMinutes = firstSlot?.durationMinutes || log.durationMinutes || 0;
    const reworkAssignedToName = log.reworkAssignedTo
      ? `${log.reworkAssignedTo.firstName || ''} ${log.reworkAssignedTo.lastName || ''}`.trim()
      : undefined;

    return {
      id: log.id,
      userId: employeeId,
      workerName,
      soNumber,
      department: departmentName,
      activity: activityName,
      startTime,
      endTime,
      standardManMinutes,
      durationMinutes,
      remarks: log.remarks,
      createdAt: log.createdAt,
      managerRemarks: log.managerRemarks,
      isRework: log.isRework || false,
      reworkAssignedToId: log.reworkAssignedToId,
      reworkAssignedToName,
    };
  };

  // â”€â”€ Fetch all data â”€â”€
  const fetchAllData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else if (isInitialLoad.current) setLoading(true);

    try {
      setSummary({
        totalUsers: users.length,
        totalDepartments: 0,
        totalActivities: 0,
        totalSalesOrders: 0,
        totalActivityLogs: activityLogs.length,
        totalManHours: 0,
        activeUsers: users.filter((u: any) => u.status === 'Working').length,
        completedActivities: activityLogs.filter((l: any) => l.durationMinutes > 0).length,
        averageProductivity: 85,
        productivityTrend: []
      });
      setLogs(activityLogs.map(normalizeLog));
      setLiveUsers(users);
      setLastUpdated(new Date());
      isInitialLoad.current = false;
    } catch (err) {
      console.error('ReportsAnalytics error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activityLogs, users]);

  // â”€â”€ Initial load â”€â”€
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // â”€â”€ Update data when context activityLogs change â”€â”€
  useEffect(() => {
    if (!activityLogs) return;

    let hasChanges = activityLogs.length !== prevLogsRef.current.length;
    if (!hasChanges) {
      for (let i = 0; i < activityLogs.length; i++) {
        const log = activityLogs[i];
        const prevLog = prevLogsRef.current.find(l => l.id === log.id);
        if (!prevLog ||
            log.remarks !== prevLog.remarks ||
            log.durationMinutes !== prevLog.durationMinutes ||
            log.standardManMinutes !== prevLog.standardManMinutes ||
            log.startTime !== prevLog.startTime ||
            log.endTime !== prevLog.endTime ||
            log.userId !== prevLog.userId ||
            log.soNumber !== prevLog.soNumber ||
            log.department !== prevLog.department ||
            log.activity !== prevLog.activity) {
          hasChanges = true;
          break;
        }
      }
    }

    if (hasChanges) {
      prevLogsRef.current = activityLogs;
      fetchAllData();
    }
  }, [activityLogs, fetchAllData]);

  // â”€â”€ Computed stats from real logs â”€â”€
  const completedLogs = logs.filter(l => l.durationMinutes > 0);
  const avgProductivity = summary?.averageProductivity ??
    (completedLogs.length > 0
      ? Math.round(completedLogs.reduce((s, l) => s + (l.standardManMinutes > 0 ? (l.durationMinutes / l.standardManMinutes) * 100 : 0), 0) / completedLogs.length)
      : 0);
  const reworkLogs = logs.filter(l =>
    l.isRework ||
    (l.remarks && l.remarks.toLowerCase().includes('rework')) ||
    (l.standardManMinutes > 0 && (l.durationMinutes / l.standardManMinutes) > 1.66)
  );

  // â”€â”€ Overall metrics calculation for Overview â”€â”€
  const overallCompleted = [
    ...erpActivities.filter(a => a.status === 'Completed'),
    ...logs.filter(l => !erpActivities.some(a => a.id === l.id))
  ].length;
  const overallRunning = erpActivities.filter(a => a.status === 'Running').length;
  const overallAssigned = erpActivities.filter(a => a.status === 'Assigned').length;
  const overallTotal = overallCompleted + overallRunning + overallAssigned;

  // â”€â”€ Department aggregation â”€â”€
  const deptMap: Record<string, { total: number; stdSum: number; actSum: number; rework: number }> = {};
  logs.forEach(l => {
    const d = l.department || 'Unknown';
    if (!deptMap[d]) deptMap[d] = { total: 0, stdSum: 0, actSum: 0, rework: 0 };
    deptMap[d].total += 1;
    deptMap[d].stdSum += l.standardManMinutes;
    deptMap[d].actSum += l.durationMinutes;
    const isRework = (l.remarks?.toLowerCase().includes('rework')) || (l.standardManMinutes > 0 && (l.durationMinutes / l.standardManMinutes) > 1.66);
    if (isRework) deptMap[d].rework += 1;
  });

  const deptData = Object.entries(deptMap).map(([dept, v]) => ({
    label: dept,
    productivity: v.stdSum > 0 ? Math.min(150, Math.round((v.actSum / v.stdSum) * 100)) : 0,
  })).sort((a, b) => b.productivity - a.productivity).slice(0, 6);

  const reworkData = Object.entries(deptMap).map(([dept, v]) => ({
    department: dept.length > 10 ? dept.slice(0, 10) + 'â€¦' : dept,
    completed: v.total - v.rework,
    rework: v.rework,
  })).slice(0, 6);

  // â”€â”€ Performer aggregation â”€â”€
  const empStats: Record<string, { name: string; dept: string; std: number; act: number; count: number }> = {};
  logs.forEach(l => {
    if (!empStats[l.workerName]) empStats[l.workerName] = { name: l.workerName, dept: l.department, std: 0, act: 0, count: 0 };
    empStats[l.workerName].std += l.standardManMinutes;
    empStats[l.workerName].act += l.durationMinutes;
    empStats[l.workerName].count += 1;
  });

  const performersList = Object.values(empStats).map(e => ({
    name: e.name,
    department: e.dept,
    score: e.std > 0 ? Math.min(150, Math.round((e.act / e.std) * 100)) : 100,
    completed: e.count,
  })).filter(p => p.completed > 0);

  const topPerformers = [...performersList].sort((a, b) => b.score - a.score).slice(0, 5);
  const lowestPerformers = [...performersList].sort((a, b) => a.score - b.score).slice(0, 5);

  // â”€â”€ Trend charts from dashboard summary â”€â”€
  const trendSource = summary?.productivityTrend || [];
  // Weekly: group by day of week from logs
  const dayBuckets: Record<string, number[]> = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] };
  logs.forEach(l => {
    if (l.createdAt) {
      const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(l.createdAt).getDay()];
      if (l.standardManMinutes > 0) dayBuckets[day].push(Math.round((l.durationMinutes / l.standardManMinutes) * 100));
    }
  });
  const weeklyData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => ({
    label: day,
    productivity: dayBuckets[day].length > 0
      ? Math.round(dayBuckets[day].reduce((s, v) => s + v, 0) / dayBuckets[day].length)
      : 0,
    hasData: dayBuckets[day].length > 0,
  }));

  // Monthly: group by month from logs
  const monthBuckets: Record<string, number[]> = {};
  logs.forEach(l => {
    if (l.createdAt) {
      const month = new Date(l.createdAt).toLocaleString('default', { month: 'short' });
      if (!monthBuckets[month]) monthBuckets[month] = [];
      if (l.standardManMinutes > 0) monthBuckets[month].push(Math.round((l.durationMinutes / l.standardManMinutes) * 100));
    }
  });
  const monthlyData = Object.entries(monthBuckets).map(([label, vals]) => ({
    label,
    productivity: vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0,
  })).slice(-6);

  // Rework activity breakdown
  const actReworkMap: Record<string, { activity: string; department: string; reworkCount: number }> = {};
  reworkLogs.forEach(l => {
    if (!actReworkMap[l.activity]) actReworkMap[l.activity] = { activity: l.activity, department: l.department, reworkCount: 0 };
    actReworkMap[l.activity].reworkCount += 1;
  });
  const mostRework = Object.values(actReworkMap).sort((a, b) => b.reworkCount - a.reworkCount).slice(0, 5);

  // â”€â”€ Employee individual â”€â”€
  const displayUsers = liveUsers.length > 0 ? liveUsers : users;
  const selectedUser = displayUsers.find(u => u.userId === appliedEmpId) ?? null;

  const empLogs = useMemo(() => {
    if (!appliedEmpId) return [];
    return logs.filter(l => {
      if (l.userId !== appliedEmpId) return false;
      const logDateStr = l.createdAt ? l.createdAt.split('T')[0] : '';
      return isLogInPeriod(logDateStr, appliedPeriodFilter, appliedFromDate, appliedToDate);
    });
  }, [logs, appliedEmpId, appliedPeriodFilter, appliedFromDate, appliedToDate]);

  const empActivities = useMemo(() => {
    if (!appliedEmpId) return [];
    return [
      ...erpActivities.filter(a => a.assignedEmployeeId === appliedEmpId).map(a => ({
        id: a.id, name: a.name, code: a.code,
        standardTime: a.standardTime, startTime: a.startTime, endTime: a.endTime,
        actualDuration: a.actualDuration, status: a.status,
        remarks: '', managerRemarks: '', isRework: false, reworkAssignedToId: '', reworkAssignedToName: '', rawLog: null,
      })),
      ...empLogs.filter(l => !erpActivities.some(a => a.id === l.id)).map(l => ({
        id: l.id, name: l.activity, code: l.soNumber,
        standardTime: `${l.standardManMinutes} Minutes`, startTime: l.startTime, endTime: l.endTime,
        actualDuration: `${l.durationMinutes} Minutes`, status: 'Completed' as const,
        remarks: l.remarks || '',
        managerRemarks: l.managerRemarks || '',
        isRework: l.isRework || false,
        reworkAssignedToId: l.reworkAssignedToId || '',
        reworkAssignedToName: l.reworkAssignedToName || '',
        rawLog: l,
      })),
    ];
  }, [erpActivities, appliedEmpId, empLogs]);



  // â”€â”€ Chart styles â”€â”€
  const isDark = themeMode === 'dark';
  const tooltipStyle = {
    backgroundColor: isDark ? '#1E1B4B' : '#FFFFFF',
    borderRadius: 12,
    border: '1px solid rgba(139,92,246,0.3)',
    fontSize: 12,
    fontWeight: 600,
  };
  const gridStroke = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  // â”€â”€ PDF Export â”€â”€
  const downloadOverviewPDF = () => {
    try {
      const doc = new jsPDF();
      const now = new Date().toLocaleString();

      // Title Banner
      doc.setFillColor(139, 92, 246);
      doc.rect(0, 0, 210, 32, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Workforce Overview & Performance Report', 14, 13);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Users: ${users.length} | Generated: ${now}`, 14, 22);

      // Map all activities
      const displayUsers = liveUsers.length > 0 ? liveUsers : users;
      const allActivities = [
        ...erpActivities.map(a => {
          const u = displayUsers.find(user => user.userId === a.assignedEmployeeId);
          return {
            id: a.id,
            name: a.name,
            code: a.code,
            standardTime: a.standardTime,
            startTime: a.startTime,
            endTime: a.endTime,
            actualDuration: a.actualDuration,
            status: a.status,
            remarks: '',
            managerRemarks: '',
            isRework: false,
            reworkAssignedToId: '',
            reworkAssignedToName: '',
            rawLog: null,
            employeeId: u?.userId || a.assignedEmployeeId || '',
            employeeName: u?.adminName || '',
            department: a.department || '',
          };
        }),
        ...logs.filter(l => !erpActivities.some(a => a.id === l.id)).map(l => {
          const u = displayUsers.find(user => user.userId === l.userId);
          return {
            id: l.id,
            name: l.activity,
            code: l.soNumber,
            standardTime: `${l.standardManMinutes} Minutes`,
            startTime: l.startTime,
            endTime: l.endTime,
            actualDuration: `${l.durationMinutes} Minutes`,
            status: 'Completed' as const,
            remarks: l.remarks || '',
            managerRemarks: l.managerRemarks || '',
            isRework: l.isRework || false,
            reworkAssignedToId: l.reworkAssignedToId || '',
            reworkAssignedToName: l.reworkAssignedToName || '',
            rawLog: l,
            employeeId: u?.userId || l.userId || '',
            employeeName: l.workerName || u?.adminName || '',
            department: l.department || '',
          };
        })
      ];

      doc.setTextColor(30, 30, 30);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('SECTION 1: OVERVIEW SUMMARY', 14, 40);

      autoTable(doc, {
        startY: 43,
        head: [['Metric', 'Value']],
        body: [
          ['Total Users', String(users.length)],
          ['Total Activities', String(overallTotal)],
          ['Completed', String(overallCompleted)],
          ['Running', String(overallRunning)],
          ['Assigned', String(overallAssigned)],
          ['Avg Productivity', `${avgProductivity}%`],
        ],
        headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 },
      });

      let nextY = (doc as any).lastAutoTable.finalY + 10;

      if (allActivities.length > 0) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('SECTION 2: DETAILED WORK HISTORY (First 100 Logs)', 14, nextY);

        const parseMins = (val: any) => {
          if (typeof val === 'number') return val;
          if (typeof val === 'string') {
            const match = val.match(/^(\d+)/);
            if (match) return parseInt(match[1], 10);
          }
          return 0;
        };

        autoTable(doc, {
          startY: nextY + 3,
          head: [['Date', 'Emp ID', 'Emp Name', 'SO Num', 'Dept', 'Activity', 'Hours', 'Productivity', 'Status']],
          body: allActivities.slice(0, 100).map(a => {
            const logDate = a.rawLog?.createdAt ? new Date(a.rawLog.createdAt).toLocaleDateString('en-IN') : '';
            const actualMins = parseMins(a.actualDuration);
            const idealMins = parseMins(a.standardTime);
            const actualHrs = Math.round(actualMins / 60 * 10) / 10;
            const productivity = idealMins > 0 ? Math.round((actualMins / idealMins) * 100) : 0;
            return [
              logDate,
              a.employeeId,
              a.employeeName,
              a.code,
              a.rawLog?.department || a.department || '',
              a.name,
              `${actualHrs} hrs`,
              `${productivity}%`,
              a.status
            ];
          }),
          headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 8 },
          styles: { fontSize: 7, cellPadding: 3 },
        });

        nextY = (doc as any).lastAutoTable.finalY + 10;
      }

      // Add page numbers
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}  â€¢  Work Management ERP  â€¢  Workforce Overview Report`, 14, 290);
      }

      savePDF(doc, `Overview_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      setSnackbar({ open: true, message: 'âœ… Overview PDF downloaded!', severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: `Export failed: ${e}`, severity: 'error' });
    }
  };

  const downloadOverviewExcel = () => {
    try {
      const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const day = String(d.getDate()).padStart(2, '0');
        const month = d.toLocaleString('en-US', { month: 'short' });
        const year = String(d.getFullYear()).slice(-2);
        return `${day}-${month}-${year}`;
      };

      const parseMins = (val: any) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          const match = val.match(/^(\d+)/);
          if (match) return parseInt(match[1], 10);
        }
        return 0;
      };

      const now = new Date();
      const periodLabel = `Monthly - ${now.toLocaleString('en-IN', { month: 'long' })} ${now.getFullYear()}`;

      const wb = XLSX.utils.book_new();
      const rows: any[][] = [];

      // Title
      rows.push(['WORKFORCE MANAGEMENT SYSTEM']);
      rows.push(['WORKFORCE OVERVIEW & PERFORMANCE REPORT']);
      rows.push([]);
      rows.push(['Report Type', 'Workforce Overview']);
      rows.push(['Generated', now.toLocaleString('en-IN')]);
      rows.push(['Period', periodLabel]);
      rows.push([]);

      // â”€â”€ SECTION 1: Overview Summary â”€â”€
      rows.push(['SECTION 1: OVERVIEW SUMMARY']);
      rows.push(['Field', 'Value']);
      rows.push(['Total Users', users.length]);
      rows.push(['Total Activities', overallTotal]);
      rows.push(['Completed', overallCompleted]);
      rows.push(['Running', overallRunning]);
      rows.push(['Assigned', overallAssigned]);
      rows.push(['Avg Productivity', `${avgProductivity}%`]);
      rows.push([]);

      // Map all activities
      const displayUsers = liveUsers.length > 0 ? liveUsers : users;
      const allActivities = [
        ...erpActivities.map(a => {
          const u = displayUsers.find(user => user.userId === a.assignedEmployeeId);
          return {
            id: a.id,
            name: a.name,
            code: a.code,
            standardTime: a.standardTime,
            startTime: a.startTime,
            endTime: a.endTime,
            actualDuration: a.actualDuration,
            status: a.status,
            remarks: '',
            managerRemarks: '',
            isRework: false,
            reworkAssignedToId: '',
            reworkAssignedToName: '',
            rawLog: null,
            employeeId: u?.userId || a.assignedEmployeeId || '',
            employeeName: u?.adminName || '',
            department: a.department || '',
          };
        }),
        ...logs.filter(l => !erpActivities.some(a => a.id === l.id)).map(l => {
          const u = displayUsers.find(user => user.userId === l.userId);
          return {
            id: l.id,
            name: l.activity,
            code: l.soNumber,
            standardTime: `${l.standardManMinutes} Minutes`,
            startTime: l.startTime,
            endTime: l.endTime,
            actualDuration: `${l.durationMinutes} Minutes`,
            status: 'Completed' as const,
            remarks: l.remarks || '',
            managerRemarks: l.managerRemarks || '',
            isRework: l.isRework || false,
            reworkAssignedToId: l.reworkAssignedToId || '',
            reworkAssignedToName: l.reworkAssignedToName || '',
            rawLog: l,
            employeeId: u?.userId || l.userId || '',
            employeeName: l.workerName || u?.adminName || '',
            department: l.department || '',
          };
        })
      ];

      // â”€â”€ SECTION 2: Detailed Work History â”€â”€
      rows.push(['SECTION 2: DETAILED WORK HISTORY']);
      rows.push([
        'Date', 'Employee ID', 'Employee Name', 'SO Number', 'Department', 'Activity',
        'Start Time', 'End Time', 'Hours Worked', 'Ideal Hours',
        'Productivity %', 'Rework Count', 'Rework Duration (Hrs)',
      ]);

      let totalReworkCount = 0;
      let totalReworkMins = 0;
      const soSet = new Set<string>();
      const deptMap = new Map<string, { activities: number; actualMins: number; idealMins: number }>();
      const soMap = new Map<string, { activities: number; actualMins: number; idealMins: number }>();

      allActivities.forEach((a: any) => {
        const logDate = a.rawLog?.createdAt ? formatDate(a.rawLog.createdAt) : (a.rawLog?.date ? formatDate(a.rawLog.date) : '');
        const empId = a.employeeId || '';
        const empName = a.employeeName || '';
        const soNum = a.code || '';
        const dept = a.rawLog?.department || a.department || '';
        const act = a.name || '';
        const startT = a.startTime || '';
        const endT = a.endTime || '';
        const actualMins = parseMins(a.actualDuration);
        const idealMins = parseMins(a.standardTime);
        const actualHrs = Math.round(actualMins / 60 * 10) / 10;
        const idealHrs = Math.round(idealMins / 60 * 10) / 10;
        const productivity = idealMins > 0 ? Math.round((actualMins / idealMins) * 100) : 0;
        const isRework = a.isRework || (a.remarks || '').toLowerCase().includes('rework');
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
          logDate, empId, empName, soNum, dept, act,
          startT, endT, actualHrs, idealHrs,
          `${productivity}%`, reworkCount, reworkDurationHrs,
        ]);
      });

      rows.push([]);

      // â”€â”€ SECTION 3: Performance Summary â”€â”€
      const totalActualMins = allActivities.reduce((s: number, a: any) => s + parseMins(a.actualDuration), 0);
      const totalIdealMins = allActivities.reduce((s: number, a: any) => s + parseMins(a.standardTime), 0);
      const totalActualHrs = Math.round(totalActualMins / 60 * 10) / 10;
      const totalIdealHrs = Math.round(totalIdealMins / 60 * 10) / 10;
      const avgWorkHrs = soSet.size > 0 ? Math.round((totalActualHrs / soSet.size) * 10) / 10 : 0;
      const utilization = totalIdealMins > 0 ? Math.round((totalActualMins / totalIdealMins) * 100) : 0;

      let sumDeptProd = 0;
      deptMap.forEach(v => {
        const prod = v.idealMins > 0 ? Math.round((v.actualMins / v.idealMins) * 100) : 0;
        sumDeptProd += prod;
      });
      const avgProductivityVal = deptMap.size > 0 ? Math.round((sumDeptProd / deptMap.size) * 10) / 10 : 0;
      const totalReworkHrs = Math.round(totalReworkMins / 60 * 10) / 10;

      rows.push(['SECTION 3: PERFORMANCE SUMMARY']);
      rows.push(['Metric', 'Value']);
      rows.push(['Total Users', users.length]);
      rows.push(['Total SOs Worked', soSet.size]);
      rows.push(['Total Activities', allActivities.length]);
      rows.push(['Total Work Hours', `${totalActualHrs} Hours`]);
      rows.push(['Average Work Hours per SO', `${avgWorkHrs} Hours`]);
      rows.push(['Expected Hours (Ideal)', `${totalIdealHrs} Hours`]);
      rows.push(['Utilization %', `${utilization}%`]);
      rows.push(['Average Productivity %', `${avgProductivityVal}%`]);
      rows.push(['Total Rework Count', totalReworkCount]);
      rows.push(['Total Rework Hours', `${totalReworkHrs} Hours`]);
      rows.push([]);

      // â”€â”€ SECTION 4: Department-wise Contribution â”€â”€
      rows.push(['SECTION 4: DEPARTMENT-WISE CONTRIBUTION']);
      rows.push(['Department', 'Activities', 'Hours Worked', 'Productivity %']);
      deptMap.forEach((v, dept) => {
        const hrs = Math.round(v.actualMins / 60 * 10) / 10;
        const prod = v.idealMins > 0 ? Math.round((v.actualMins / v.idealMins) * 100) : 0;
        rows.push([dept, v.activities, `${hrs}`, `${prod}%`]);
      });
      rows.push([]);

      // â”€â”€ SECTION 5: SO-wise Contribution â”€â”€
      rows.push(['SECTION 5: SO-WISE CONTRIBUTION']);
      rows.push(['SO Number', 'Activities', 'Hours Worked', 'Productivity %']);
      soMap.forEach((v, soNum) => {
        const hrs = Math.round(v.actualMins / 60 * 10) / 10;
        const prod = v.idealMins > 0 ? Math.round((v.actualMins / v.idealMins) * 100) : 0;
        rows.push([soNum, v.activities, `${hrs}`, `${prod}%`]);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [
        { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 25 },
        { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
        { wch: 16 }, { wch: 14 }, { wch: 22 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Workforce Overview');
      saveXLSX(wb, `Overview_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      setSnackbar({ open: true, message: 'âœ… Overview Excel downloaded!', severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: `Export failed: ${e}`, severity: 'error' });
    }
  };



  const downloadIndividualExcel = () => {
    if (!selectedUser) {
      setSnackbar({ open: true, message: 'âš  Select an employee first.', severity: 'error' });
      return;
    }
    try {
      const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const day = String(d.getDate()).padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[d.getMonth()];
        const year = String(d.getFullYear()).slice(-2);
        return `${day}-${month}-${year}`;
      };

      const parseMins = (val: any) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          const match = val.match(/^(\d+)/);
          if (match) return parseInt(match[1], 10);
        }
        return 0;
      };

      // Period label
      const now = new Date();
      const periodLabel = appliedPeriodFilter === 'Custom Date Range'
        ? `${formatDate(appliedFromDate)} to ${formatDate(appliedToDate)}`
        : appliedPeriodFilter === 'All'
          ? 'All Time'
          : `${appliedPeriodFilter} - ${now.toLocaleString('en-IN', { month: 'long' })} ${now.getFullYear()}`;

      const wb = XLSX.utils.book_new();
      const rows: any[][] = [];

      // Title rows (matching Image 2)
      rows.push(['WORKFORCE MANAGEMENT SYSTEM']);
      rows.push(['INDIVIDUAL EMPLOYEE PERFORMANCE REPORT']);
      rows.push([]);
      rows.push(['Employee ID', selectedUser.userId]);
      rows.push(['Employee Name', selectedUser.adminName]);
      rows.push(['Period', periodLabel]);
      rows.push([]);

      // â”€â”€ SECTION 1: Employee Information â”€â”€
      const empDept = selectedUser ? (empLogs[0]?.department || (selectedUser as any).department || 'Coil Winding') : 'Coil Winding';
      rows.push(['SECTION 1: EMPLOYEE INFORMATION']);
      rows.push(['Field', 'Value']);
      rows.push(['Employee ID', selectedUser.userId]);
      rows.push(['Employee Name', selectedUser.adminName]);
      rows.push(['Department', empDept]);
      rows.push(['Role', selectedUser.role]);
      rows.push(['Status', selectedUser.status]);
      rows.push([]);

      // â”€â”€ SECTION 2: Detailed Work History â”€â”€
      rows.push(['SECTION 2: DETAILED WORK HISTORY']);
      rows.push([
        'Date', 'SO Number', 'Department', 'Activity',
        'Start Time', 'End Time', 'Hours Worked', 'Ideal Hours',
        'Productivity %', 'Rework Count', 'Rework Duration',
      ]);

      let totalReworkCount = 0;
      let totalReworkMins = 0;
      const soSet = new Set<string>();
      const deptMap = new Map<string, { activities: number; actualMins: number; idealMins: number }>();
      const soMap = new Map<string, { activities: number; actualMins: number; idealMins: number }>();

      // Filter only completed activities (where actual duration exists)
      const completedActivities = empActivities.filter(a => a.status === 'Completed' || parseMins(a.actualDuration) > 0);

      completedActivities.forEach((a: any) => {
        const logDate = a.rawLog?.createdAt ? formatDate(a.rawLog.createdAt) : (a.rawLog?.date ? formatDate(a.rawLog.date) : '');
        const soNum = a.code || '';
        const dept = a.rawLog?.department || empDept || '';
        const act = a.name || '';
        const startT = a.startTime || '';
        const endT = a.endTime || '';
        const actualMins = parseMins(a.actualDuration);
        const idealMins = parseMins(a.standardTime);
        const actualHrs = Math.round(actualMins / 60 * 100) / 100;
        const idealHrs = Math.round(idealMins / 60 * 100) / 100;
        const productivity = idealMins > 0 ? Math.round((actualMins / idealMins) * 100) : 0;
        const isRework = a.isRework || (a.remarks || '').toLowerCase().includes('rework');
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

      // â”€â”€ SECTION 3: Performance Summary â”€â”€
      const totalActualMins = completedActivities.reduce((s: number, a: any) => s + parseMins(a.actualDuration), 0);
      const totalIdealMins = completedActivities.reduce((s: number, a: any) => s + parseMins(a.standardTime), 0);
      const totalActualHrs = Math.round(totalActualMins / 60 * 10) / 10;

      // Unique days
      const uniqueDays = new Set(completedActivities.map(a => a.rawLog?.createdAt?.split('T')[0] || a.rawLog?.date?.split('T')[0] || '')).size || 1;
      const avgWorkHrs = Math.round((totalActualHrs / uniqueDays) * 10) / 10;
      const expectedHrs = uniqueDays * 8;
      const utilization = Math.round((totalActualHrs / expectedHrs) * 100);
      const avgProductivity = totalIdealMins > 0 ? Math.round((totalActualMins / totalIdealMins) * 100) : 0;
      const totalReworkHrs = Math.round(totalReworkMins / 60 * 10) / 10;

      rows.push(['SECTION 3: PERFORMANCE SUMMARY']);
      rows.push(['Metric', 'Value']);
      rows.push(['Total SOs Worked', soSet.size]);
      rows.push(['Total Activities Completed', completedActivities.length]);
      rows.push(['Total Working Hours', `${totalActualHrs} Hours`]);
      rows.push(['Average Working Hours Per Day', `${avgWorkHrs} Hours`]);
      rows.push(['Expected Hours (8 Hr Shift)', `${expectedHrs} Hours`]);
      rows.push(['Utilization %', `${utilization}%`]);
      rows.push(['Average Productivity %', `${avgProductivity}%`]);
      rows.push(['Total Rework Count', totalReworkCount]);
      rows.push(['Total Rework Duration', `${totalReworkHrs} Hours`]);
      rows.push([]);

      // â”€â”€ SECTION 4: Department-wise Contribution â”€â”€
      rows.push(['SECTION 4: DEPARTMENT-WISE CONTRIBUTION']);
      rows.push(['Department', 'Activities Completed', 'Hours Worked', 'Productivity %']);
      deptMap.forEach((v, dept) => {
        const hrs = Math.round(v.actualMins / 60 * 10) / 10;
        const prod = v.idealMins > 0 ? Math.round((v.actualMins / v.idealMins) * 100) : 0;
        rows.push([dept, v.activities, hrs, `${prod}%`]);
      });
      rows.push([]);

      // â”€â”€ SECTION 5: SO-wise Contribution â”€â”€
      rows.push(['SECTION 5: SO-WISE CONTRIBUTION']);
      rows.push(['SO Number', 'Activities Completed', 'Hours Worked', 'Productivity %']);
      soMap.forEach((v, soNum) => {
        const hrs = Math.round(v.actualMins / 60 * 10) / 10;
        const prod = v.idealMins > 0 ? Math.round((v.actualMins / v.idealMins) * 100) : 0;
        rows.push([soNum, v.activities, hrs, `${prod}%`]);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [
        { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 25 },
        { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
        { wch: 16 }, { wch: 14 }, { wch: 22 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Individual Employee Report');
      saveXLSX(wb, `Individual_Employee_Report_${selectedUser.userId}_${new Date().toISOString().split('T')[0]}.xlsx`);
      setSnackbar({ open: true, message: `âœ… Excel report for ${selectedUser.adminName} downloaded!`, severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: `Export failed: ${e}`, severity: 'error' });
    }
  };

  const downloadEmployeePDF = () => {
    if (!selectedUser) {
      setSnackbar({ open: true, message: 'âš  Select an employee first.', severity: 'error' });
      return;
    }
    try {
      const doc = new jsPDF();
      const now = new Date().toLocaleString();

      const parseMins = (val: any) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          const match = val.match(/^(\d+)/);
          if (match) return parseInt(match[1], 10);
        }
        return 0;
      };

      const indTotalMins = empLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
      const workingHoursStr = `${Math.floor(indTotalMins / 60)}h ${indTotalMins % 60}m`;
      const indSosWorked = new Set(empLogs.map(l => l.soNumber).filter(Boolean)).size;
      const indStdMins = empLogs.reduce((sum, l) => sum + (l.standardManMinutes || 0), 0);
      const indProductivity = indStdMins > 0 ? Math.round((indTotalMins / indStdMins) * 100) : 0;
      const indReworkCount = empLogs.filter(l => l.isRework || (l.remarks || '').toLowerCase().includes('rework')).length;

      // Title Banner
      doc.setFillColor(124, 58, 237);
      doc.rect(0, 0, 210, 32, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Individual Employee Performance Report', 14, 13);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${selectedUser.adminName} | ID: ${selectedUser.userId} | Role: ${selectedUser.role}`, 14, 21);
      doc.text(`Period: ${appliedPeriodFilter} | Generated on: ${now}`, 14, 27);

      doc.setTextColor(30, 30, 30);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Performance Summary Index', 14, 42);

      autoTable(doc, {
        startY: 46,
        head: [['Metric Parameter', 'Value']],
        body: [
          ['Total Sales Orders Worked', String(indSosWorked)],
          ['Total Activities Clocked', String(empLogs.length)],
          ['Total Working Duration', workingHoursStr],
          ['Average Productivity Index', `${indProductivity}%`],
          ['Rework Incidents Count', String(indReworkCount)],
        ],
        headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3.5 },
      });

      const y = (doc as any).lastAutoTable.finalY + 12;

      // Filter only completed activities (where actual duration exists)
      const completedActivities = empActivities.filter(a => a.status === 'Completed' || parseMins(a.actualDuration) > 0);

      if (completedActivities.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Detailed Work Ledger', 14, y);

        autoTable(doc, {
          startY: y + 4,
          head: [['Date', 'SO Number', 'Activity', 'Ideal Hrs', 'Actual Hrs', 'Prod %', 'Rework']],
          body: completedActivities.map(a => {
            const logDate = a.rawLog?.createdAt ? new Date(a.rawLog.createdAt).toLocaleDateString('en-IN') : '';
            const actualMins = parseMins(a.actualDuration);
            const idealMins = parseMins(a.standardTime);
            const actualHrs = Math.round(actualMins / 60 * 100) / 100;
            const idealHrs = Math.round(idealMins / 60 * 100) / 100;
            const prod = idealMins > 0 ? Math.round((actualMins / idealMins) * 100) : 0;
            const isRework = a.isRework || (a.remarks || '').toLowerCase().includes('rework');
            return [
              logDate,
              a.code,
              a.name,
              `${idealHrs}h`,
              `${actualHrs}h`,
              `${prod}%`,
              isRework ? 'Yes' : 'No'
            ];
          }),
          headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
          styles: { fontSize: 8, cellPadding: 3 },
        });
      }

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}  â€¢  Work Management ERP  â€¢  Employee: ${selectedUser.adminName}`, 14, 290);
      }

      savePDF(doc, `Employee_Report_${selectedUser.userId}_${new Date().toISOString().split('T')[0]}.pdf`);
      setSnackbar({ open: true, message: `âœ… PDF report for ${selectedUser.adminName} downloaded!`, severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: `PDF export failed: ${e}`, severity: 'error' });
    }
  };

  // â”€â”€ Stat Cards data â”€â”€
  const statCards = [
    {
      label: 'Total Activities',
      value: loading ? null : String(overallTotal),
      sub: 'All tasks in system',
      color: '#8B5CF6',
      icon: <AnalyticsIcon />,
      gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(124,58,237,0.05) 100%)',
    },
    {
      label: 'Completed',
      value: loading ? null : String(overallCompleted),
      sub: 'Finished activities',
      color: '#10B981',
      icon: <CheckIcon />,
      gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.05) 100%)',
    },
    {
      label: 'Running',
      value: loading ? null : String(overallRunning),
      sub: 'In-progress tasks',
      color: '#3B82F6',
      icon: <ClockIcon />,
      gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.05) 100%)',
    },
    {
      label: 'Assigned',
      value: loading ? null : String(overallAssigned),
      sub: 'Allocated activities',
      color: '#EC4899',
      icon: <ReportIcon />,
      gradient: 'linear-gradient(135deg, rgba(236,72,153,0.15) 0%, rgba(219,39,119,0.05) 100%)',
    },
    {
      label: 'Avg Productivity',
      value: loading ? null : `${avgProductivity}%`,
      sub: 'Standard/Actual ratio',
      color: pctColor(avgProductivity),
      icon: <SpeedIcon />,
      gradient: `linear-gradient(135deg, ${pctColor(avgProductivity)}22 0%, ${pctColor(avgProductivity)}08 100%)`,
      gradientOpacity: 0.13,
    },
  ];

  // â”€â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <Box>
      <Snackbar
        open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: 3, fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* â”€â”€ Page Header â”€â”€ */}
      <Card sx={{
        p: 3, mb: 4,
        border: '1px solid',
        borderColor: 'divider',
        background: isDark
          ? 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(99,102,241,0.04) 100%)'
          : 'linear-gradient(135deg, rgba(139,92,246,0.05) 0%, rgba(99,102,241,0.02) 100%)',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                Reports & Analytics
              </Typography>
              {/* Live indicator */}
              <Chip
                icon={<LiveDotIcon sx={{ fontSize: '10px !important', color: '#10B981 !important', animation: 'pulse 2s infinite' }} />}
                label={refreshing ? 'Refreshingâ€¦' : 'Live'}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  bgcolor: 'rgba(16,185,129,0.1)',
                  color: '#10B981',
                  border: '1px solid rgba(16,185,129,0.3)',
                  height: 22,
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.4 },
                    '100%': { opacity: 1 },
                  },
                }}
              />
            </Box>
            {lastUpdated && (
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ClockIcon sx={{ fontSize: 12 }} />
                Last updated: {fmtTime(lastUpdated)}
              </Typography>
            )}
          </Box>

        </Box>
      </Card>

      {/* â”€â”€ Main Tabs â”€â”€ */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 0 }}>
        <Tabs
          value={mainTab} onChange={(_, v) => setMainTab(v)}
          sx={{ '& .MuiTab-root': { fontWeight: 700, fontSize: '0.9rem', textTransform: 'none', px: 3, py: 1.5 } }}
        >
          <Tab label="ðŸ“Š Overview & Analytics" />
          <Tab label="ðŸ‘¤ Individual Employee Report" />
        </Tabs>
      </Box>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• TAB 0 â€” OVERVIEW â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {mainTab === 0 && (
        <Box sx={{ mt: 4 }}>
          {/* â”€â”€ Overview Export Bar â”€â”€ */}
          <SectionDownloadBar
            label="Overview"
            onDownloadBackend={downloadOverviewExcel}
            onDownloadFrontend={downloadOverviewPDF}
          />

          {/* â”€â”€ KPI Cards â”€â”€ */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {statCards.map((c) => (
              <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={c.label}>
                {loading ? <StatCardSkeleton /> : (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5, borderRadius: 3,
                      background: c.gradient,
                      border: `1px solid ${c.color}`,
                      borderColor: `${c.color}`,
                      opacity: 1,
                      outline: `1px solid ${c.color}`,
                      outlineOffset: '-1px',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 25px ${c.color}`,
                        outline: `1px solid ${c.color}`,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {c.label}
                      </Typography>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: c.color, opacity: 0.15, color: c.color, '& *': { opacity: 1 / 0.15 } }}>
                        {React.cloneElement(c.icon, { sx: { fontSize: 15 } })}
                      </Avatar>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: c.color, letterSpacing: '-0.02em', lineHeight: 1 }}>
                      {c.value}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, display: 'block', mt: 0.5 }}>
                      {c.sub}
                    </Typography>
                  </Paper>
                )}
              </Grid>
            ))}
          </Grid>

          {/* â”€â”€ Productivity Formula Banner â”€â”€ */}
          <Card sx={{
            p: 2.5, mb: 4,
            border: '1px dashed',
            borderColor: 'rgba(139,92,246,0.4)',
            bgcolor: isDark ? 'rgba(139,92,246,0.04)' : 'rgba(139,92,246,0.02)',
            borderRadius: 3,
          }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Avatar sx={{ bgcolor: 'rgba(139,92,246,0.1)', color: '#8B5CF6', width: 40, height: 40 }}>
                <FormulaIcon />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.3 }}>Productivity Formula</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Used across all charts and tables
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                <Paper variant="outlined" sx={{ px: 2.5, py: 1, borderRadius: 2, borderStyle: 'dashed', borderColor: 'rgba(139,92,246,0.4)' }}>
                  <Typography sx={{ fontWeight: 800, color: 'primary.main', fontFamily: 'ui-monospace, monospace', fontSize: '0.82rem' }}>
                    Productivity % = (Actual Time Ã· Standard Duration) Ã— 100
                  </Typography>
                </Paper>
                {[
                  { label: 'â‰¤85%', color: '#10B981', text: 'Excellent' },
                  { label: 'â‰¤100%', color: '#3B82F6', text: 'Good' },
                  { label: 'â‰¤120%', color: '#F59E0B', text: 'Average' },
                  { label: '>120%', color: '#EF4444', text: 'Below' },
                ].map(b => (
                  <Box key={b.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: b.color }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: b.color }}>{b.label}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{b.text}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Card>

          {/* â”€â”€ Charts Row â”€â”€ */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Productivity Trend */}
            <Grid size={{ xs: 12, lg: 7 }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: 420, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 3, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.2 }}>Productivity Trends</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {trendTab === 0 ? 'Hourly breakdown (today)' : trendTab === 1 ? 'Daily breakdown (this week)' : 'Monthly breakdown'}
                    </Typography>
                  </Box>
                  <Tabs
                    value={trendTab} onChange={(_, v) => setTrendTab(v)}
                    sx={{ minHeight: 34, '& .MuiTab-root': { py: 0.5, minHeight: 34, fontSize: '0.78rem', fontWeight: 700, textTransform: 'none', px: 2 } }}
                  >
                    <Tab label="Hourly" icon={<DailyIcon sx={{ fontSize: 14 }} />} iconPosition="start" />
                    <Tab label="Weekly" icon={<WeeklyIcon sx={{ fontSize: 14 }} />} iconPosition="start" />
                    <Tab label="Monthly" icon={<MonthlyIcon sx={{ fontSize: 14 }} />} iconPosition="start" />
                  </Tabs>
                </Box>

                <Box sx={{ flexGrow: 1, p: 2, pt: 1 }}>
                  {loading ? (
                    <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 2 }} />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      {trendTab === 0 ? (
                        <AreaChart data={trendSource} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                          <XAxis dataKey="time" tick={{ fontSize: 10, fontWeight: 600 }} />
                          <YAxis tick={{ fontSize: 10, fontWeight: 600 }} domain={[0, 120]} />
                          <ChartTooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, 'Productivity']} />
                          <Area type="monotone" dataKey="productivity" name="Productivity %" stroke="#8B5CF6" strokeWidth={3} fill="url(#grad1)" dot={{ r: 3, fill: '#8B5CF6' }} />
                        </AreaChart>
                      ) : trendTab === 1 ? (
                        weeklyData.length === 0 ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <Typography color="text.disabled" sx={{ fontWeight: 600 }}>No weekly data from backend yet</Typography>
                          </Box>
                        ) : (
                          <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                            <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 600 }} />
                            <YAxis tick={{ fontSize: 10, fontWeight: 600 }} domain={[0, 120]} />
                            <ChartTooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, 'Productivity']} />
                            <Line type="monotone" dataKey="productivity" stroke="#6366F1" strokeWidth={3.5} dot={{ r: 5, fill: '#6366F1' }} />
                          </LineChart>
                        )
                      ) : (
                        monthlyData.length === 0 ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <Typography color="text.disabled" sx={{ fontWeight: 600 }}>No monthly data from backend yet</Typography>
                          </Box>
                        ) : (
                          <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#EC4899" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                            <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 600 }} />
                            <YAxis tick={{ fontSize: 10, fontWeight: 600 }} domain={[0, 120]} />
                            <ChartTooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, 'Productivity']} />
                            <Area type="monotone" dataKey="productivity" stroke="#EC4899" strokeWidth={3} fill="url(#grad2)" dot={{ r: 3, fill: '#EC4899' }} />
                          </AreaChart>
                        )
                      )}
                    </ResponsiveContainer>
                  )}
                </Box>
              </Card>
            </Grid>

            {/* Department Scores */}
            <Grid size={{ xs: 12, lg: 5 }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: 420, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 3, pb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.2 }}>Department Productivity</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {deptData.length > 0 ? `${deptData.length} departments from live data` : 'No department data yet'}
                  </Typography>
                </Box>
                <Box sx={{ flexGrow: 1, p: 2, pt: 1 }}>
                  {loading ? (
                    <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 2 }} />
                  ) : deptData.length === 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1 }}>
                      <DeptIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                      <Typography color="text.disabled" sx={{ fontWeight: 600 }}>No department logs yet</Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                        <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 600 }} />
                        <YAxis tick={{ fontSize: 10, fontWeight: 600 }} domain={[0, 120]} />
                        <ChartTooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, 'Productivity']} />
                        <Bar dataKey="productivity" name="Productivity %" radius={[8, 8, 0, 0]} maxBarSize={36}>
                          {deptData.map((_, i) => (
                            <Cell key={i} fill={['#8B5CF6', '#6366F1', '#3B82F6', '#10B981', '#EC4899', '#F59E0B'][i % 6]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </Card>
            </Grid>
          </Grid>

          {/* â”€â”€ Rework Analysis Chart â”€â”€ */}
          <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 4, height: 320, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 3, pb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.2 }}>Completed vs Rework by Department</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Live breakdown from all activity logs
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1, p: 2, pt: 1 }}>
              {loading ? (
                <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 2 }} />
              ) : reworkData.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography color="text.disabled" sx={{ fontWeight: 600 }}>No rework data yet</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reworkData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                    <XAxis dataKey="department" tick={{ fontSize: 10, fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 10, fontWeight: 600 }} />
                    <ChartTooltip contentStyle={tooltipStyle} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar dataKey="completed" name="Completed" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="rework" name="Rework Cases" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Card>

          {/* â”€â”€ Summary Tables â”€â”€ */}
          <Grid container spacing={3}>
            {/* Top Performers */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
                <Box sx={{ p: 2.5, pb: 1.5, display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10B981', width: 36, height: 36 }}>
                    <TrophyIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Top Performers</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Highest productivity score</Typography>
                  </Box>
                </Box>
                <CardContent sx={{ p: 2, pt: 0 }}>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={48} sx={{ borderRadius: 2, mb: 0.5 }} />)
                  ) : topPerformers.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography color="text.disabled" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>No performer data yet</Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', py: 1, color: 'text.secondary' }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>Score</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {topPerformers.map((row, i) => (
                            <TableRow key={row.name} sx={{ '&:hover': { bgcolor: 'rgba(16,185,129,0.04)' } }}>
                              <TableCell sx={{ py: 1.2 }}>
                                <Avatar sx={{ width: 22, height: 22, fontSize: '0.7rem', fontWeight: 800, bgcolor: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : i === 2 ? '#CD7F32' : 'rgba(16,185,129,0.1)', color: i < 3 ? '#fff' : '#10B981' }}>
                                  {i + 1}
                                </Avatar>
                              </TableCell>
                              <TableCell sx={{ py: 1.2 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.8rem' }}>{row.name}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{row.department}</Typography>
                              </TableCell>
                              <TableCell>
                                <Box>
                                  <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: pctColor(row.score) }}>{row.score}%</Typography>
                                  <LinearProgress variant="determinate" value={Math.min(row.score, 100)} sx={{ mt: 0.3, height: 3, borderRadius: 2, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: pctColor(row.score) } }} />
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Lowest Performers */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
                <Box sx={{ p: 2.5, pb: 1.5, display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'rgba(245,158,11,0.1)', color: '#F59E0B', width: 36, height: 36 }}>
                    <PerformersIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Needs Attention</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Lowest productivity score</Typography>
                  </Box>
                </Box>
                <CardContent sx={{ p: 2, pt: 0 }}>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={48} sx={{ borderRadius: 2, mb: 0.5 }} />)
                  ) : lowestPerformers.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography color="text.disabled" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>No performer data yet</Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', py: 1, color: 'text.secondary' }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>Score</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {lowestPerformers.map((row, i) => (
                            <TableRow key={row.name} sx={{ '&:hover': { bgcolor: 'rgba(245,158,11,0.04)' } }}>
                              <TableCell sx={{ py: 1.2 }}>
                                <Avatar sx={{ width: 22, height: 22, fontSize: '0.7rem', fontWeight: 800, bgcolor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                                  {i + 1}
                                </Avatar>
                              </TableCell>
                              <TableCell sx={{ py: 1.2 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.8rem' }}>{row.name}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{row.department}</Typography>
                              </TableCell>
                              <TableCell>
                                <Box>
                                  <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: pctColor(row.score) }}>{row.score}%</Typography>
                                  <LinearProgress variant="determinate" value={Math.min(row.score, 100)} sx={{ mt: 0.3, height: 3, borderRadius: 2, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: pctColor(row.score) } }} />
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Most Rework */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
                <Box sx={{ p: 2.5, pb: 1.5, display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: '#EF4444', width: 36, height: 36 }}>
                    <ReworkIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Most Rework Tasks</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Activities needing rework</Typography>
                  </Box>
                </Box>

                <CardContent sx={{ p: 2, pt: 0 }}>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={48} sx={{ borderRadius: 2, mb: 0.5 }} />)
                  ) : mostRework.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <CheckIcon sx={{ fontSize: 36, color: '#10B981', mb: 1 }} />
                      <Typography color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>No rework cases! ðŸŽ‰</Typography>
                      <Typography color="text.disabled" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>All activities within efficiency threshold</Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', py: 1, color: 'text.secondary' }}>Activity</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>Cases</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {mostRework.map((row) => (
                            <TableRow key={row.activity} sx={{ '&:hover': { bgcolor: 'rgba(239,68,68,0.04)' } }}>
                              <TableCell sx={{ py: 1.2 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.79rem' }}>{row.activity}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{row.department}</Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={row.reworkCount}
                                  size="small"
                                  sx={{ fontWeight: 800, fontSize: '0.75rem', height: 22, bgcolor: 'rgba(239,68,68,0.12)', color: '#EF4444', minWidth: 32 }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* â”€â”€ Recent Activity Logs Table â”€â”€ */}
          {logs.length > 0 && (
            <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mt: 4 }}>
              <Box sx={{ p: 2.5, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Recent Activity Logs</Typography>
                </Box>
                <Chip label={`${logs.length} total`} size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }} />
              </Box>
              <CardContent sx={{ p: 2, pt: 0 }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)' }}>
                      <TableRow>
                        {['Worker', 'SO Number', 'Department', 'Activity', 'Duration', 'Productivity', 'Worker Remark', 'Manager Review', 'Actions'].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.2 }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {logs.slice(0, 10).map((log) => {
                        const pct = log.standardManMinutes > 0 ? Math.round((log.durationMinutes / log.standardManMinutes) * 100) : null;
                        return (
                          <TableRow key={log.id} sx={{ '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' } }}>
                            <TableCell sx={{ py: 1.2, fontWeight: 700, fontSize: '0.82rem' }}>{log.workerName}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'primary.main', fontWeight: 700 }}>{log.soNumber}</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600 }}>{log.department}</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{log.activity}</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600 }}>{log.durationMinutes} min</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: pctColor(pct) }}>
                                  {pct !== null ? `${pct}%` : '--'}
                                </Typography>
                                {pct !== null && (
                                  <LinearProgress variant="determinate" value={Math.min(pct, 100)} sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: pctColor(pct) } }} />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              {log.remarks ? (
                                <Tooltip title={log.remarks}>
                                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'text.secondary', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {log.remarks}
                                  </Typography>
                                </Tooltip>
                              ) : (
                                <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.disabled', fontStyle: 'italic' }}>
                                  No remark
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {log.isRework && (
                                  <Chip
                                    label={`Rework: ${log.reworkAssignedToName || 'Unassigned'}`}
                                    color="error"
                                    size="small"
                                    sx={{ fontWeight: 800, fontSize: '0.7rem', height: 20, width: 'fit-content' }}
                                  />
                                )}
                                {log.managerRemarks ? (
                                  <Tooltip title={log.managerRemarks}>
                                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 650, color: 'text.primary', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {log.managerRemarks}
                                    </Typography>
                                  </Tooltip>
                                ) : (
                                  !log.isRework && (
                                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.disabled', fontStyle: 'italic' }}>
                                      Not reviewed
                                    </Typography>
                                  )
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Tooltip title="Review Activity Log">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => {
                                    setSelectedReviewLog(log);
                                    setManagerRemarksInput(log.managerRemarks || '');
                                    setIsReworkInput(log.isRework || false);
                                    setReworkAssignedToIdInput(log.reworkAssignedToId || '');
                                    setReviewModalOpen(true);
                                  }}
                                  sx={{
                                    border: '1px solid',
                                    borderColor: 'primary.light',
                                    borderRadius: 2,
                                    '&:hover': { bgcolor: 'rgba(139,92,246,0.08)' },
                                  }}
                                >
                                  <ReviewIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• TAB 1 â€” INDIVIDUAL EMPLOYEE â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {mainTab === 1 && (() => {
        const indTotalMins = empLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
        const workingHoursStr = `${Math.floor(indTotalMins / 60)}h ${indTotalMins % 60}m`;
        const indSosWorked = new Set(empLogs.map(l => l.soNumber).filter(Boolean)).size;
        const indActivitiesCount = empLogs.length;
        const indStdMins = empLogs.reduce((sum, l) => sum + (l.standardManMinutes || 0), 0);
        const indProductivity = indStdMins > 0 ? Math.round((indTotalMins / indStdMins) * 100) : 0;
        const indReworkCount = empLogs.filter(l => l.isRework || (l.remarks || '').toLowerCase().includes('rework')).length;

        const dateOfJoining = (selectedUser as any)?.createdAt ? (() => {
          const d = new Date((selectedUser as any).createdAt);
          if (isNaN(d.getTime())) return '15-Jan-2024';
          const day = String(d.getDate()).padStart(2, '0');
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
        })() : '15-Jan-2024';

        const empDept = selectedUser ? (empLogs[0]?.department || (selectedUser as any).department || 'Coil Winding') : 'Coil Winding';

        // Filter search options by employee status filter
        const filteredEmpOptions = displayUsers.filter(u => {
          if (indStatusFilter === 'All') return true;
          if (indStatusFilter === 'Active') {
            return u.status === 'Working' || u.status === 'Idle' || u.status === 'Away' || u.status === 'Active';
          }
          if (indStatusFilter === 'Inactive') {
            return u.status === 'Inactive';
          }
          return u.status.toLowerCase() === indStatusFilter.toLowerCase();
        });

        // Sorted recent activity (last 5 records)
        const recentLogs = [...empLogs]
          .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
          .slice(0, 5);

        // Format dates in table as DD-MMM-YYYY
        const formatActivityDate = (dateStr?: string) => {
          if (!dateStr) return '';
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return dateStr;
          const day = String(d.getDate()).padStart(2, '0');
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
        };

        const handleApplyIndFilters = () => {
          setAppliedEmpId(selectedEmpId);
          setAppliedPeriodFilter(indPeriodFilter);
          setAppliedFromDate(indFromDate);
          setAppliedToDate(indToDate);
        };

        const handleClearIndFilters = () => {
          setIndPeriodFilter('Custom Date Range');
          setIndFromDate('2026-05-01');
          setIndToDate('2026-05-31');
          setIndStatusFilter('All');
          const displayUsers = liveUsers.length > 0 ? liveUsers : users;
          const firstUserId = displayUsers.length > 0 ? displayUsers[0].userId : '';
          setSelectedEmpId(firstUserId);
          setAppliedEmpId(firstUserId);
          setAppliedPeriodFilter('Custom Date Range');
          setAppliedFromDate('2026-05-01');
          setAppliedToDate('2026-05-31');
        };

        return (
          <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            
            {/* Report Filters Card */}
            <Card sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                Report Filters
              </Typography>
              <Grid container spacing={2.5} sx={{ alignItems: 'center' }}>
                {/* Employee Search */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Autocomplete
                    size="small"
                    options={filteredEmpOptions}
                    getOptionLabel={(option) => `${option.userId} - ${option.adminName}`}
                    value={displayUsers.find(u => u.userId === selectedEmpId) || null}
                    onChange={(_, newValue) => {
                      if (newValue) {
                        setSelectedEmpId(newValue.userId);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Employee Search"
                        placeholder="Search by Employee ID or Name"
                        slotProps={{
                          ...params.slotProps,
                          input: {
                            ...params.slotProps?.input,
                            startAdornment: (
                              <>
                                <InputAdornment position="start">
                                  <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                </InputAdornment>
                                {params.slotProps?.input?.startAdornment}
                              </>
                            ),
                            sx: { borderRadius: 2.5, fontWeight: 600, fontSize: '0.85rem' }
                          }
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Report Period */}
                <Grid size={{ xs: 12, sm: 6, md: 2.25 }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Report Period"
                    value={indPeriodFilter}
                    onChange={(e) => setIndPeriodFilter(e.target.value)}
                    slotProps={{ input: { sx: { borderRadius: 2.5, fontWeight: 600 } } }}
                  >
                    {['All', 'Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom Date Range'].map(o => (
                      <MenuItem key={o} value={o}>{o}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* From Date */}
                <Grid size={{ xs: 12, sm: 6, md: 2.25 }}>
                  <TextField
                    fullWidth
                    type="date"
                    size="small"
                    label="From Date"
                    value={indFromDate}
                    disabled={indPeriodFilter !== 'Custom Date Range'}
                    onChange={(e) => setIndFromDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true }, input: { sx: { borderRadius: 2.5, fontWeight: 600 } } }}
                  />
                </Grid>

                {/* To Date */}
                <Grid size={{ xs: 12, sm: 6, md: 2.25 }}>
                  <TextField
                    fullWidth
                    type="date"
                    size="small"
                    label="To Date"
                    value={indToDate}
                    disabled={indPeriodFilter !== 'Custom Date Range'}
                    onChange={(e) => setIndToDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true }, input: { sx: { borderRadius: 2.5, fontWeight: 600 } } }}
                  />
                </Grid>

                {/* Employee Status */}
                <Grid size={{ xs: 12, sm: 6, md: 2.25 }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Employee Status"
                    value={indStatusFilter}
                    onChange={(e) => setIndStatusFilter(e.target.value)}
                    slotProps={{ input: { sx: { borderRadius: 2.5, fontWeight: 600 } } }}
                  >
                    {['All', 'Active', 'Inactive'].map(o => (
                      <MenuItem key={o} value={o}>{o}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              {/* Action Buttons Row */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<PreviewIcon />}
                    onClick={handleApplyIndFilters}
                    disabled={!selectedEmpId}
                    sx={{
                      borderRadius: 2.5,
                      fontWeight: 700,
                      textTransform: 'none',
                      px: 3,
                      py: 1,
                      background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                      boxShadow: '0 4px 12px rgba(124,58,237,0.25)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%)',
                      }
                    }}
                  >
                    Preview Report
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleClearIndFilters}
                    sx={{
                      borderRadius: 2.5,
                      fontWeight: 700,
                      textTransform: 'none',
                      px: 3,
                      py: 1,
                      color: 'text.secondary',
                      borderColor: 'divider',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        borderColor: 'text.secondary',
                      }
                    }}
                  >
                    Clear Filters
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon sx={{ color: '#10B981' }} />}
                    onClick={downloadIndividualExcel}
                    disabled={!selectedUser}
                    sx={{
                      borderRadius: 2.5,
                      fontWeight: 700,
                      textTransform: 'none',
                      borderColor: 'rgba(16,185,129,0.4)',
                      color: '#10B981',
                      '&:hover': {
                        borderColor: '#10B981',
                        bgcolor: 'rgba(16,185,129,0.04)'
                      }
                    }}
                  >
                    Download Excel
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PdfIcon sx={{ color: '#EF4444' }} />}
                    onClick={downloadEmployeePDF}
                    disabled={!selectedUser}
                    sx={{
                      borderRadius: 2.5,
                      fontWeight: 700,
                      textTransform: 'none',
                      borderColor: 'rgba(239,68,68,0.4)',
                      color: '#EF4444',
                      '&:hover': {
                        borderColor: '#EF4444',
                        bgcolor: 'rgba(239,68,68,0.04)'
                      }
                    }}
                  >
                    Download PDF
                  </Button>
                </Box>
              </Box>
            </Card>

            {!selectedUser ? (
              <Paper variant="outlined" sx={{ borderRadius: 3, py: 10, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <PersonIcon sx={{ fontSize: 50, color: 'text.disabled' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary' }}>Select an Employee to Preview Report</Typography>
                <Typography variant="body2" color="text.disabled" sx={{ fontWeight: 600 }}>
                  Choose an employee from the filters and click "Preview Report".
                </Typography>
              </Paper>
            ) : (
              <>
                {/* Employee Info & Performance Summary Card */}
                <Card sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                  <Grid container spacing={3}>
                    {/* Left: Employee Info */}
                    <Grid size={{ xs: 12, md: 5, lg: 4 }} sx={{ display: 'flex', alignItems: 'center', gap: 2.5, borderRight: { md: '1px solid' }, borderColor: { md: 'divider' }, pr: { md: 3 } }}>
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          fontSize: '1.25rem',
                          fontWeight: 'bold',
                          bgcolor: 'rgba(124,58,237,0.1)',
                          color: '#7C3AED',
                          border: '2px solid rgba(124,58,237,0.2)'
                        }}
                      >
                        {selectedUser.adminName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                          {selectedUser.adminName}
                        </Typography>
                        <Grid container spacing={0.5} sx={{ '& .MuiTypography-root': { fontSize: '0.8rem' } }}>
                          <Grid size={{ xs: 5 }}>
                            <Typography color="text.secondary" sx={{ fontWeight: 600 }}>Employee ID</Typography>
                          </Grid>
                          <Grid size={{ xs: 7 }}>
                            <Typography sx={{ fontWeight: 700 }}>: {selectedUser.userId}</Typography>
                          </Grid>

                          <Grid size={{ xs: 5 }}>
                            <Typography color="text.secondary" sx={{ fontWeight: 600 }}>Department</Typography>
                          </Grid>
                          <Grid size={{ xs: 7 }}>
                            <Typography sx={{ fontWeight: 700 }}>: {empDept}</Typography>
                          </Grid>

                          <Grid size={{ xs: 5 }}>
                            <Typography color="text.secondary" sx={{ fontWeight: 600 }}>Role</Typography>
                          </Grid>
                          <Grid size={{ xs: 7 }}>
                            <Typography sx={{ fontWeight: 700 }}>: {selectedUser.role}</Typography>
                          </Grid>

                          <Grid size={{ xs: 5 }}>
                            <Typography color="text.secondary" sx={{ fontWeight: 600 }}>Date of Joining</Typography>
                          </Grid>
                          <Grid size={{ xs: 7 }}>
                            <Typography sx={{ fontWeight: 700 }}>: {dateOfJoining}</Typography>
                          </Grid>

                          <Grid size={{ xs: 5 }} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography color="text.secondary" sx={{ fontWeight: 600 }}>Status</Typography>
                          </Grid>
                          <Grid size={{ xs: 7 }} sx={{ display: 'flex', alignItems: 'center', mt: 0.2 }}>
                            <Typography component="span" sx={{ fontWeight: 700, mr: 0.5 }}>: </Typography>
                            <Chip
                              label={selectedUser.status}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: '0.68rem',
                                height: 18,
                                bgcolor: (selectedUser.status === 'Working' || selectedUser.status === 'Active') ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                color: (selectedUser.status === 'Working' || selectedUser.status === 'Active') ? '#10B981' : '#F59E0B',
                                border: `1px solid ${(selectedUser.status === 'Working' || selectedUser.status === 'Active') ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`
                              }}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    </Grid>

                    {/* Right: Performance Summary */}
                    <Grid size={{ xs: 12, md: 7, lg: 8 }} sx={{ pl: { md: 2 } }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: 'text.secondary' }}>
                        Performance Summary {appliedPeriodFilter === 'Custom Date Range' ? `(${formatActivityDate(appliedFromDate)} - ${formatActivityDate(appliedToDate)})` : `(${appliedPeriodFilter})`}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        {[
                          { label: 'Total SOs Worked', value: indSosWorked, color: '#3B82F6', bg: 'rgba(59,130,246,0.04)', border: 'rgba(59,130,246,0.15)', icon: <PerformersIcon sx={{ fontSize: 20 }} /> },
                          { label: 'Total Activities', value: indActivitiesCount, color: '#10B981', bg: 'rgba(16,185,129,0.04)', border: 'rgba(16,185,129,0.15)', icon: <CheckIcon sx={{ fontSize: 20 }} /> },
                          { label: 'Working Hours', value: workingHoursStr, color: '#F59E0B', bg: 'rgba(245,158,11,0.04)', border: 'rgba(245,158,11,0.15)', icon: <ClockIcon sx={{ fontSize: 20 }} /> },
                          { label: 'Productivity', value: `${indProductivity}%`, color: '#8B5CF6', bg: 'rgba(139,92,246,0.04)', border: 'rgba(139,92,246,0.15)', icon: <TrendIcon sx={{ fontSize: 20 }} /> },
                          { label: 'Rework Count', value: indReworkCount, color: '#EF4444', bg: 'rgba(239,68,68,0.04)', border: 'rgba(239,68,68,0.15)', icon: <RefreshIcon sx={{ fontSize: 20 }} /> },
                        ].map((card, idx) => (
                          <Paper
                            key={idx}
                            variant="outlined"
                            sx={{
                              flex: '1 1 120px',
                              p: 2,
                              borderRadius: 3,
                              textAlign: 'center',
                              bgcolor: card.bg,
                              borderColor: card.border,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 0.5,
                              minWidth: 110,
                            }}
                          >
                            <Box sx={{ color: card.color, mb: 0.5 }}>
                              {card.icon}
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: card.color, lineHeight: 1.1 }}>
                              {card.value}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', fontSize: '0.72rem' }}>
                              {card.label}
                            </Typography>
                          </Paper>
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </Card>

                {/* Recent Activity Table */}
                <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                  <Box sx={{ p: 2.5, pb: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      Recent Activity (Last 5 Records)
                    </Typography>
                  </Box>
                  <CardContent sx={{ p: 2, pt: 0 }}>
                    <TableContainer>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)' }}>
                          <TableRow>
                            {['Date', 'SO Number', 'Activity', 'Department', 'Standard Time', 'Actual Time', 'Productivity', 'Status'].map(h => (
                              <TableCell key={h} sx={{ fontWeight: 800, py: 1.5, fontSize: '0.75rem' }}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {recentLogs.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                  No activity logs found for this period.
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            recentLogs.map((log) => {
                              const pct = log.standardManMinutes > 0 ? (log.durationMinutes / log.standardManMinutes * 100) : null;
                              return (
                                <TableRow key={log.id} sx={{ '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' } }}>
                                  <TableCell sx={{ py: 1.3, fontWeight: 700, fontSize: '0.8rem' }}>
                                    {formatActivityDate(log.createdAt || (log as any).date)}
                                  </TableCell>
                                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'primary.main', fontWeight: 700 }}>
                                    {log.soNumber}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                    {log.activity}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600 }}>
                                    {log.department}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600 }}>
                                    {log.standardManMinutes} min
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600 }}>
                                    {log.durationMinutes} min
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={pct !== null ? `${pct.toFixed(2)}%` : '--'}
                                      size="small"
                                      sx={{
                                        fontWeight: 800,
                                        fontSize: '0.74rem',
                                        bgcolor: pct !== null ? `${pctColor(pct)}12` : 'action.hover',
                                        color: pct !== null ? pctColor(pct) : 'text.disabled',
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label="Completed"
                                      size="small"
                                      sx={{
                                        fontWeight: 800,
                                        fontSize: '0.72rem',
                                        bgcolor: 'rgba(16,185,129,0.1)',
                                        color: '#10B981',
                                        border: '1px solid rgba(16,185,129,0.3)',
                                      }}
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Centered Link */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 1 }}>
                      <Typography
                        variant="body2"
                        onClick={downloadIndividualExcel}
                        sx={{
                          fontWeight: 700,
                          color: '#7C3AED',
                          cursor: 'pointer',
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        View Full Report After Download
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>

                {/* Footer Info Alert */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 2,
                    borderRadius: 3,
                    border: '1px solid rgba(59,130,246,0.15)',
                    bgcolor: isDark ? 'rgba(59,130,246,0.03)' : 'rgba(59,130,246,0.012)'
                  }}
                >
                  <InfoIcon sx={{ color: '#3B82F6', fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    The full report contains detailed activity records, rework details, department-wise breakup and performance analytics.
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        );
      })()}
      {/* â”€â”€ Log Review & Rework Assignment Dialog â”€â”€ */}
      <Dialog
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 4, px: 2, py: 1 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ReviewIcon color="primary" />
          Review Workforce Activity Log
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {selectedReviewLog && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              {/* Activity Details Summary */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: 'action.hover' }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Worker Name</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedReviewLog.workerName}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Sales Order</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{selectedReviewLog.soNumber}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Activity</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 750 }}>{selectedReviewLog.activity}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Productivity</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: pctColor(selectedReviewLog.standardManMinutes > 0 ? Math.round((selectedReviewLog.durationMinutes / selectedReviewLog.standardManMinutes) * 100) : null) }}>
                      {selectedReviewLog.standardManMinutes > 0 ? `${Math.round((selectedReviewLog.durationMinutes / selectedReviewLog.standardManMinutes) * 100)}%` : '--'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Worker Remarks */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                  Worker Remarks (Submitted at log completion)
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, borderStyle: 'dashed' }}>
                  <Typography variant="body2" sx={{ fontStyle: 'italic', fontWeight: 600, color: selectedReviewLog.remarks ? 'text.primary' : 'text.disabled' }}>
                    {selectedReviewLog.remarks ? `"${selectedReviewLog.remarks}"` : 'No remarks submitted by the worker.'}
                  </Typography>
                </Paper>
              </Box>

              {/* Manager Remarks */}
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Manager Review Remarks"
                placeholder="Type your observations, instructions, or approval notes..."
                value={managerRemarksInput}
                onChange={(e) => setManagerRemarksInput(e.target.value)}
                slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 600 } } }}
              />

              {/* Rework Toggles */}
              <Box sx={{ border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isReworkInput}
                      onChange={(e) => setIsReworkInput(e.target.checked)}
                      color="error"
                    />
                  }
                  label={
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: isReworkInput ? 'error.main' : 'text.primary' }}>
                        Assign as Rework Case
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                        Flag this activity log as failing efficiency or quality criteria and assign to worker to redo.
                      </Typography>
                    </Box>
                  }
                />

                {isReworkInput && (
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel id="rework-worker-select-label" sx={{ fontWeight: 600 }}>Assign Rework To</InputLabel>
                    <Select
                      labelId="rework-worker-select-label"
                      value={reworkAssignedToIdInput}
                      onChange={(e) => setReworkAssignedToIdInput(e.target.value)}
                      label="Assign Rework To"
                      sx={{ borderRadius: 3, fontWeight: 700 }}
                    >
                      {(() => {
                        const allUsers = liveUsers.length > 0 ? liveUsers : users;
                        return allUsers.map((u: any) => (
                          <MenuItem key={u.id} value={u.id} sx={{ fontWeight: 600 }}>
                            {u.adminName} ({u.userId}) Â· {u.role}
                          </MenuItem>
                        ));
                      })()}
                    </Select>
                  </FormControl>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ pb: 3, px: 3, mt: 1, gap: 1 }}>
          <Button onClick={() => setReviewModalOpen(false)} sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveReview}
            variant="contained"
            disabled={refreshing}
            sx={{
              fontWeight: 800,
              borderRadius: 2.5,
              px: 3.5,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
              boxShadow: '0 4px 14px rgba(139,92,246,0.3)',
            }}
          >
            {refreshing ? 'Savingâ€¦' : 'Save Review'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
