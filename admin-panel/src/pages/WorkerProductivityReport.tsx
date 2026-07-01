import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Grid,
  Card,
  Typography,
  Box,
  Avatar,
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
  TextField,
  MenuItem,
  Collapse,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
} from '@mui/material';
import {
  GetApp as ExcelIcon,
  PictureAsPdf as PdfIcon,
  Search as SearchIcon,
  People as WorkersIcon,
  Percent as ProgressIcon,
  TrendingUp as TrendIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
  AccountCircle as ProfileIcon,
  Assignment as SOIcon,
  Business as DeptIcon,
  WatchLater as ClockIcon,
  WorkOutlined as ActivityIcon,
  KeyboardArrowLeft,
  KeyboardArrowRight,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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

// â”€â”€ PDF: output as blob URL and open in new tab
const savePDF = (doc: jsPDF, filename: string) => {
  const blob = doc.output('blob');
  triggerDownloadAndOpen(blob, filename);
};

// â”€â”€ XLSX: export and open
const saveXLSX = (wb: XLSX.WorkBook, filename: string) => {
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  triggerDownloadAndOpen(blob, filename);
};

// Shift baseline configuration
const SHIFT_MINUTES = 480; // 8 Hours

export const WorkerProductivityReport: React.FC = () => {
  const { themeMode, activityLogs, users, salesOrders } = useApp();

  // Dialog & Notification states
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [dialogTab, setDialogTab] = useState(0); // 0=SO, 1=Dept, 2=Activity
  
  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Filter states
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterSO, setFilterSO] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [filterStartDate, filterEndDate, filterEmployeeId, filterDepartment, filterRole, filterSO, filterStatus]);

  // Transform/normalize logs to support both local mock logs and live backend logs
  const normalizedLogs = useMemo(() => {
    return activityLogs.map((log: any) => {
      if (log.workerName) {
        return log;
      }

      const firstName = log.user?.firstName || '';
      const lastName = log.user?.lastName || '';
      const workerName = `${firstName} ${lastName}`.trim() || 'Unknown Worker';
      const employeeId = log.user?.employeeId || log.userId || 'EMP-UNKNOWN';

      const soNumber = log.SalesOrder?.soNumber || log.soId || 'SO-UNKNOWN';
      const departmentName = log.department?.name || log.departmentId || 'Unknown Dept';
      const activityName = log.activity?.activityName || log.activityId || 'Unknown Activity';

      const firstSlot = log.slots?.[0];
      let startTime = '';
      let endTime = '';
      if (firstSlot?.startTime) {
        const sDate = new Date(firstSlot.startTime);
        startTime = !isNaN(sDate.getTime()) ? sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
      }
      if (firstSlot?.endTime) {
        const eDate = new Date(firstSlot.endTime);
        endTime = !isNaN(eDate.getTime()) ? eDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
      }

      const standardManMinutes = log.activity?.standardManMinutes || log.standardManMinutes || 0;
      const durationMinutes = firstSlot?.durationMinutes || log.durationMinutes || 0;

      const coworkers = (firstSlot?.coworkers || []).map((c: any) => {
        const cFirst = c.coworker?.firstName || '';
        const cLast = c.coworker?.lastName || '';
        return `${cFirst} ${cLast}`.trim();
      }).filter(Boolean);

      const attachments = (log.attachments || []).map((a: any) => a.fileName || a);

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
        coworkers: coworkers.length > 0 ? coworkers : undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
        createdAt: log.createdAt,
      };
    });
  }, [activityLogs]);

  // â”€â”€ Helper: Productivity Status Chip â”€â”€
  const getProductivityStatus = (pct: number) => {
    if (pct <= 75) return { label: 'Excellent', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' };
    if (pct <= 90) return { label: 'Very Good', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)' };
    if (pct <= 100) return { label: 'Good', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' };
    if (pct <= 120) return { label: 'Average', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' };
    return { label: 'Needs Improvement', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' };
  };

  // â”€â”€ Helper: Matches Status Filter â”€â”€
  const checkStatusFilter = (pct: number, filter: string): boolean => {
    if (!filter) return true;
    const status = getProductivityStatus(pct).label;
    return status.toLowerCase() === filter.toLowerCase();
  };

  // Unique lists for filters
  const rolesList = useMemo(() => Array.from(new Set(users.map((u) => u.role))), [users]);
  const deptsList = useMemo(() => (Array.from(new Set(users.map((u) => u.role === 'Admin' ? 'Management' : u.status === 'Working' || u.status === 'Idle' ? 'Production' : 'QA'))) as string[]).concat(['Production', 'QA', 'Engineering', 'Design', 'Support']), [users]);
  const uniqueDepts = useMemo(() => Array.from(new Set(deptsList.filter(Boolean))), [deptsList]);

  // â”€â”€ Filtering Logic â”€â”€
  const filteredLogs = useMemo(() => {
    return normalizedLogs.filter((log) => {
      // 1. Employee filter
      if (filterEmployeeId && log.userId !== filterEmployeeId) return false;
      
      // 2. Department filter
      if (filterDepartment && log.department.toLowerCase() !== filterDepartment.toLowerCase()) return false;
      
      // 3. Role filter
      if (filterRole) {
        const workerUser = users.find((u) => u.userId === log.userId);
        if (!workerUser || workerUser.role.toLowerCase() !== filterRole.toLowerCase()) return false;
      }
      
      // 4. Sales Order filter
      if (filterSO && log.soNumber !== filterSO) return false;

      // 5. Simulated Date Range Filter
      // Matches the log start date using Sales Order reference dates or direct ranges
      if (filterStartDate || filterEndDate) {
        const activeSO = salesOrders.find((so) => so.soNumber === log.soNumber);
        if (activeSO) {
          if (filterStartDate && activeSO.startDate < filterStartDate) return false;
          if (filterEndDate && activeSO.endDate > filterEndDate) return false;
        }
      }

      return true;
    });
  }, [normalizedLogs, users, salesOrders, filterEmployeeId, filterDepartment, filterRole, filterSO, filterStartDate, filterEndDate]);

  // â”€â”€ Workers Aggregated Productivity Computations â”€â”€
  const workersData = useMemo(() => {
    const grouped: Record<string, {
      employeeId: string;
      employeeName: string;
      department: string;
      role: string;
      uniqueSOs: Set<string>;
      totalLogs: number;
      actualMinutes: number;
      idealMinutes: number;
      activityDetails: Record<string, { department: string; count: number; actualTime: number; idealTime: number }>;
      soBreakdown: Record<string, { actualTime: number; idealTime: number; count: number; activityNames: Set<string> }>;
      deptBreakdown: Record<string, { actualTime: number; idealTime: number; count: number; activityNames: Set<string> }>;
      actBreakdown: Record<string, { actualTime: number; idealTime: number; count: number; standardTime: number }>;
      deptActivitiesBreakdown: Record<string, Record<string, number>>;
    }> = {};

    filteredLogs.forEach((log) => {
      const userMeta = users.find((u) => u.userId === log.userId);
      const userRole = userMeta?.role || 'Worker';
      
      if (!grouped[log.userId]) {
        grouped[log.userId] = {
          employeeId: log.userId,
          employeeName: log.workerName,
          department: log.department,
          role: userRole,
          uniqueSOs: new Set<string>(),
          totalLogs: 0,
          actualMinutes: 0,
          idealMinutes: 0,
          activityDetails: {},
          soBreakdown: {},
          deptBreakdown: {},
          actBreakdown: {},
          deptActivitiesBreakdown: {},
        };
      }

      const g = grouped[log.userId];
      g.uniqueSOs.add(log.soNumber);
      g.totalLogs += 1;
      
      // Sum actual and standard ideal times
      g.actualMinutes += log.durationMinutes;
      g.idealMinutes += log.standardManMinutes;

      // Inline activity counts
      const actKey = `${log.department} - ${log.activity}`;
      if (!g.activityDetails[actKey]) {
        g.activityDetails[actKey] = { department: log.department, count: 0, actualTime: 0, idealTime: 0 };
      }
      g.activityDetails[actKey].count += 1;
      g.activityDetails[actKey].actualTime += log.durationMinutes;
      g.activityDetails[actKey].idealTime += log.standardManMinutes;

      // SO breakdown
      if (!g.soBreakdown[log.soNumber]) {
        g.soBreakdown[log.soNumber] = { actualTime: 0, idealTime: 0, count: 0, activityNames: new Set<string>() };
      }
      g.soBreakdown[log.soNumber].actualTime += log.durationMinutes;
      g.soBreakdown[log.soNumber].idealTime += log.standardManMinutes;
      g.soBreakdown[log.soNumber].count += 1;
      g.soBreakdown[log.soNumber].activityNames.add(log.activity);

      // Dept breakdown
      if (!g.deptBreakdown[log.department]) {
        g.deptBreakdown[log.department] = { actualTime: 0, idealTime: 0, count: 0, activityNames: new Set<string>() };
      }
      g.deptBreakdown[log.department].actualTime += log.durationMinutes;
      g.deptBreakdown[log.department].idealTime += log.standardManMinutes;
      g.deptBreakdown[log.department].count += 1;
      g.deptBreakdown[log.department].activityNames.add(log.activity);

      // Act breakdown
      if (!g.actBreakdown[log.activity]) {
        g.actBreakdown[log.activity] = { actualTime: 0, idealTime: 0, count: 0, standardTime: log.standardManMinutes };
      }
      g.actBreakdown[log.activity].actualTime += log.durationMinutes;
      g.actBreakdown[log.activity].idealTime += log.standardManMinutes;
      g.actBreakdown[log.activity].count += 1;

      // Dept-wise activity count
      if (!g.deptActivitiesBreakdown[log.department]) {
        g.deptActivitiesBreakdown[log.department] = {};
      }
      if (!g.deptActivitiesBreakdown[log.department][log.activity]) {
        g.deptActivitiesBreakdown[log.department][log.activity] = 0;
      }
      g.deptActivitiesBreakdown[log.department][log.activity] += 1;
    });

    return Object.values(grouped)
      .map((w) => {
        const prodPercentage = w.idealMinutes > 0 ? Math.round((w.actualMinutes / w.idealMinutes) * 100) : 0;
        const utilization = Math.round((w.actualMinutes / SHIFT_MINUTES) * 100);
        return {
          ...w,
          productivity: prodPercentage,
          utilization,
        };
      })
      .filter((w) => checkStatusFilter(w.productivity, filterStatus));
  }, [filteredLogs, users, filterStatus]);

  // â”€â”€ Executive Summary Metrics calculations â”€â”€
  const summaryMetrics = useMemo(() => {
    const totalWorkers = workersData.length;
    const avgProductivity = totalWorkers > 0 
      ? Math.round(workersData.reduce((sum, w) => sum + w.productivity, 0) / totalWorkers)
      : 0;
    
    // Highest & Lowest
    let highest: (typeof workersData)[0] | null = null;
    let lowest: (typeof workersData)[0] | null = null;

    workersData.forEach((w) => {
      if (!highest || w.productivity > highest.productivity) highest = w;
      if (!lowest || w.productivity < lowest.productivity) lowest = w;
    });

    const totalActualMinutes = workersData.reduce((sum, w) => sum + w.actualMinutes, 0);
    const totalHours = Math.round((totalActualMinutes / 60) * 10) / 10;
    
    const uniqueSOList = new Set<string>();
    filteredLogs.forEach(l => uniqueSOList.add(l.soNumber));

    return {
      totalWorkers,
      avgProductivity,
      highestWorkerName: highest ? (highest as any).employeeName : 'N/A',
      highestWorkerScore: highest ? (highest as any).productivity : 0,
      lowestWorkerName: lowest ? (lowest as any).employeeName : 'N/A',
      lowestWorkerScore: lowest ? (lowest as any).productivity : 0,
      totalHours,
      totalSOs: uniqueSOList.size,
      totalActivities: filteredLogs.length,
    };
  }, [workersData, filteredLogs]);

  // Selected worker details for full modal audit profile
  const selectedWorkerDetails = useMemo(() => {
    if (!selectedWorkerId) return null;
    return workersData.find((w) => w.employeeId === selectedWorkerId) || null;
  }, [workersData, selectedWorkerId]);

  // â”€â”€ Toggle Accordion Details â”€â”€
  const handleToggleRow = (empId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [empId]: !prev[empId],
    }));
  };

  const handleOpenProfile = (empId: string) => {
    setSelectedWorkerId(empId);
    setDialogTab(0);
    setProfileDialogOpen(true);
  };

  // â”€â”€ Excel Export (.xlsx format) â”€â”€
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      const headerRows: any[][] = [
        ['WORKFORCE MANAGEMENT SYSTEM'],
        ['WORKER PRODUCTIVITY & PERFORMANCE REPORT'],
        [],
        ['Generated On', new Date().toLocaleString('en-IN')],
        ['Active Filters', `Dept[${filterDepartment || 'All'}] SO[${filterSO || 'All'}] Status[${filterStatus || 'All'}]`],
        [],
        ['Employee ID', 'Employee Name', 'Department', 'Total SOs Worked', 'Total Activities', 'Total Working Time (min)', 'Total Working Time (hrs)', 'Ideal Time (min)', 'Ideal Time (hrs)', 'Productivity %', 'Status'],
      ];

      const dataRows = workersData.map((w) => {
        const hours = Math.round((w.actualMinutes / 60) * 10) / 10;
        const idealHours = Math.round((w.idealMinutes / 60) * 10) / 10;
        const status = getProductivityStatus(w.productivity).label;
        return [
          w.employeeId,
          w.employeeName,
          w.department,
          w.uniqueSOs.size,
          w.totalLogs,
          w.actualMinutes,
          hours,
          w.idealMinutes,
          idealHours,
          `${w.productivity}%`,
          status,
        ];
      });

      const allRows = [...headerRows, ...dataRows];
      const ws = XLSX.utils.aoa_to_sheet(allRows);

      ws['!cols'] = [
        { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 18 }, { wch: 16 }, 
        { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 15 }
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Productivity Report');
      saveXLSX(wb, `Worker_Productivity_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

      setSnackbar({
        open: true,
        message: 'âœ… Productivity spreadsheet downloaded successfully!',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Error exporting Excel: ${err instanceof Error ? err.message : String(err)}`,
        severity: 'error',
      });
    }
  };

  // â”€â”€ jsPDF Export (Interactive PDF Report) â”€â”€
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const now = new Date().toLocaleString();

      // Premium header block
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 32, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Worker Productivity & Performance Report', 14, 13);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Corporate Analytics Suite  |  Generated: ${now}`, 14, 22);
      doc.text(`Active Filters: Dept[${filterDepartment || 'All'}] SO[${filterSO || 'All'}] Status[${filterStatus || 'All'}]`, 14, 28);

      doc.setTextColor(30, 30, 30);
      
      // Cards stats summary block
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Performance Telemetry Index Rollup', 14, 42);

      autoTable(doc, {
        startY: 46,
        head: [['Statistical Parameter', 'Current Value', 'Parameter Description']],
        body: [
          ['Total Employees Evaluated', `${summaryMetrics.totalWorkers} Operators`, 'Personnel logged in filtered activity sheets.'],
          ['Average Productivity score', `${summaryMetrics.avgProductivity}%`, 'Sum of ideal standard times divided by actual duration.'],
          ['Highest Productivity Employee', `${summaryMetrics.highestWorkerName} (${summaryMetrics.highestWorkerScore}%)`, 'Top performing employee in active shift roster.'],
          ['Lowest Productivity Employee', `${summaryMetrics.lowestWorkerName} (${summaryMetrics.lowestWorkerScore}%)`, 'Needs performance and training supervision.'],
          ['Total Work Hours Logged', `${summaryMetrics.totalHours} Hours`, 'Cumulative duration clocked against Sales Orders.'],
          ['Unique SOs Worked', `${summaryMetrics.totalSOs} Sales Orders`, 'Unique SOs logged within filtered telemetry bounds.'],
        ],
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 246, 255] },
        styles: { fontSize: 8.5, cellPadding: 3 },
      });

      const nextY = (doc as any).lastAutoTable.finalY + 12;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Granular Employee Performance Ledger', 14, nextY);

      autoTable(doc, {
        startY: nextY + 4,
        head: [['Employee ID', 'Employee Name', 'Department', 'Total SOs Worked', 'Total Activities', 'Total Working Time', 'Ideal Time', 'Productivity %', 'Status']],
        body: workersData.map((w) => {
          const hours = Math.round((w.actualMinutes / 60) * 10) / 10;
          const idealHours = Math.round((w.idealMinutes / 60) * 10) / 10;
          const status = getProductivityStatus(w.productivity).label;
          return [
            w.employeeId,
            w.employeeName,
            w.department,
            `${w.uniqueSOs.size} Orders`,
            `${w.totalLogs} Activities`,
            `${w.actualMinutes} mins (${hours} hrs)`,
            `${w.idealMinutes} mins (${idealHours} hrs)`,
            `${w.productivity}%`,
            status,
          ];
        }),
        headStyles: { fillColor: [8, 145, 178], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 252, 252] },
        styles: { fontSize: 6.8, cellPadding: 2 },
      });

      // Pagination details
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}  •  Workforce Productivity Telemetry  •  Workforce Management System`, 14, 290);
      }

      savePDF(doc, `Worker_Productivity_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      setSnackbar({
        open: true,
        message: 'âœ… High-fidelity PDF report downloaded successfully!',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Error exporting PDF: ${err instanceof Error ? err.message : String(err)}`,
        severity: 'error',
      });
    }
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: 3, fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* â”€â”€ Page Header â”€â”€ */}
      <Card sx={{ p: 3, mb: 4, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5 }}>
              Worker Productivity & Performance Report
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<ExcelIcon />}
              onClick={handleExportExcel}
              sx={{ borderRadius: 3, py: 1.1, px: 2.5, fontWeight: 700, borderColor: 'divider', textTransform: 'none' }}
            >
              Export Excel
            </Button>
            <Button
              variant="contained"
              startIcon={<PdfIcon />}
              onClick={handleExportPDF}
              sx={{
                borderRadius: 3,
                py: 1.1,
                px: 2.5,
                fontWeight: 700,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              }}
            >
              Download PDF Report
            </Button>
          </Box>
        </Box>
      </Card>

      {/* â”€â”€ KPI Summary Cards Grid â”€â”€ */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Total Employees', value: `${summaryMetrics.totalWorkers} Operators`, subText: 'Clocking active logs', color: '#2563EB', icon: <WorkersIcon /> },
          { label: 'Avg Productivity', value: `${summaryMetrics.avgProductivity}%`, subText: 'Ideal vs Actual Time ratio', color: '#10B981', icon: <ProgressIcon /> },
          { label: 'Top Productivity Employee', value: summaryMetrics.highestWorkerName, subText: `Score: ${summaryMetrics.highestWorkerScore}%`, color: '#06B6D4', icon: <TrendIcon /> },
          { label: 'Lowest Productivity Employee', value: summaryMetrics.lowestWorkerName, subText: `Score: ${summaryMetrics.lowestWorkerScore}%`, color: '#EF4444', icon: <TrendIcon /> },
          { label: 'Total Clocked Hours', value: `${summaryMetrics.totalHours} Hours`, subText: 'Logged actual time', color: '#8B5CF6', icon: <ClockIcon /> },
          { label: 'Unique SOs Worked', value: `${summaryMetrics.totalSOs} SOs`, subText: 'Unique Sales Orders', color: '#EC4899', icon: <SOIcon /> },
          { label: 'Total Tasks Completed', value: `${summaryMetrics.totalActivities} Completed`, subText: 'Workforce activities logged', color: '#F59E0B', icon: <ActivityIcon /> },
        ].map((card, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 3, lg: idx === 6 ? 12 : 2 }} key={idx}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3.5, display: 'flex', gap: 1.5, alignItems: 'center', height: '100%' }}>
              <Avatar sx={{ bgcolor: 'action.hover', color: card.color, width: 38, height: 38 }}>
                {card.icon}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  {card.label}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {card.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  {card.subText}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* â”€â”€ Selection Filters Bar â”€â”€ */}
      <Card sx={{ p: 2.5, mb: 4, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SearchIcon sx={{ fontSize: 18, color: 'primary.main' }} /> Dynamic Report Query Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              fullWidth size="small" type="date" label="Start Date"
              value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true }, input: { sx: { borderRadius: 3 } } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              fullWidth size="small" type="date" label="End Date"
              value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true }, input: { sx: { borderRadius: 3 } } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              select fullWidth size="small" label="Employee"
              value={filterEmployeeId} onChange={(e) => setFilterEmployeeId(e.target.value)}
              slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 600 } } }}
            >
              <MenuItem value="" sx={{ fontWeight: 600 }}>All Employees</MenuItem>
              {users.map((u) => (
                <MenuItem key={u.userId} value={u.userId} sx={{ fontWeight: 600 }}>{u.adminName}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              select fullWidth size="small" label="Department"
              value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}
              slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 600 } } }}
            >
              <MenuItem value="" sx={{ fontWeight: 600 }}>All Departments</MenuItem>
              {uniqueDepts.map((d) => (
                <MenuItem key={d} value={d} sx={{ fontWeight: 600 }}>{d}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 1.5 }}>
            <TextField
              select fullWidth size="small" label="Role"
              value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
              slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 600 } } }}
            >
              <MenuItem value="" sx={{ fontWeight: 600 }}>All Roles</MenuItem>
              {rolesList.map((r) => (
                <MenuItem key={r} value={r} sx={{ fontWeight: 600 }}>{r}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 1.25 }}>
            <TextField
              select fullWidth size="small" label="Sales Order"
              value={filterSO} onChange={(e) => setFilterSO(e.target.value)}
              slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 600 } } }}
            >
              <MenuItem value="" sx={{ fontWeight: 600 }}>All SOs</MenuItem>
              {salesOrders.map((so) => (
                <MenuItem key={so.soNumber} value={so.soNumber} sx={{ fontWeight: 600 }}>{so.soNumber}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 1.25 }}>
            <TextField
              select fullWidth size="small" label="Prod Status"
              value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 600 } } }}
            >
              <MenuItem value="" sx={{ fontWeight: 600 }}>All Scores</MenuItem>
              {['Excellent', 'Very Good', 'Good', 'Average', 'Needs Improvement'].map((s) => (
                <MenuItem key={s} value={s} sx={{ fontWeight: 600 }}>{s}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Card>

      {/* â”€â”€ Report Aggregation Grid Table â”€â”€ */}
      <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
              <TableRow sx={{ height: 48 }}>
                <TableCell sx={{ width: 45 }} />
                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem' }}>Employee ID</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem' }}>Employee Name</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem' }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem' }}>Total SOs Worked</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem' }}>Total Activities</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem' }}>Total Working Time</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem' }}>Ideal Time</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem' }}>Productivity %</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.78rem' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.78rem', pr: 3 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workersData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      No productivity logs found matching active selection queries.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                workersData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((worker) => {
                  const isExpanded = !!expandedRows[worker.employeeId];
                  const hours = Math.round((worker.actualMinutes / 60) * 10) / 10;
                  const idealHours = Math.round((worker.idealMinutes / 60) * 10) / 10;
                  const status = getProductivityStatus(worker.productivity);

                  return (
                    <React.Fragment key={worker.employeeId}>
                      <TableRow
                        sx={{
                          height: 48,
                          '&:hover': { bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)' },
                          borderBottom: isExpanded ? 'none' : '1px solid rgba(224, 224, 224, 0.15)',
                        }}
                      >
                        <TableCell sx={{ py: 1 }}>
                          <IconButton size="small" onClick={() => handleToggleRow(worker.employeeId)} color="primary">
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600, fontSize: '0.8rem' }}>
                          {worker.employeeId}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem' }}>{worker.employeeName}</TableCell>
                        <TableCell>
                          <Chip label={worker.department} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{worker.uniqueSOs.size} Orders</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{worker.totalLogs} Activities</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.82rem' }}>
                          {hours} hrs ({worker.actualMinutes} min)
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.82rem' }}>
                          {idealHours} hrs ({worker.idealMinutes} min)
                        </TableCell>
                        <TableCell sx={{ fontWeight: 900, color: status.color, pl: 3 }}>
                          {worker.productivity}%
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={status.label}
                            size="small"
                            sx={{
                              height: 20,
                              fontWeight: 850,
                              fontSize: '0.75rem',
                              bgcolor: status.bg,
                              color: status.color,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ pr: 3 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ProfileIcon />}
                            onClick={() => handleOpenProfile(worker.employeeId)}
                            sx={{ borderRadius: 2, textTransform: 'none', py: 0.4, fontWeight: 700 }}
                          >
                            Audit Profile
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Section showing department-wise details and utilization */}
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={11}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ py: 2.5, px: 3, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.005)', borderBottom: '1px solid', borderColor: 'divider' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                ðŸ“‹ Inline Activity & Shift Performance Breakdown
                              </Typography>
                              
                              <Grid container spacing={3}>
                                <Grid size={{ xs: 12, md: 7 }}>
                                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 850, mb: 1, display: 'block', textTransform: 'uppercase', color: 'primary.main' }}>
                                      Department-wise Activity Incident Roster
                                    </Typography>
                                    <Grid container spacing={2}>
                                      {Object.entries(worker.deptActivitiesBreakdown).map(([dept, activities]) => (
                                        <Grid size={{ xs: 6 }} key={dept}>
                                          <Box sx={{ border: '1px dashed', borderColor: 'divider', p: 1.5, borderRadius: 2 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 850, display: 'block', mb: 0.8, color: 'primary.main' }}>
                                              {dept}
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                                              {Object.entries(activities).map(([act, count]) => (
                                                <Typography key={act} variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'text.secondary', fontSize: '0.72rem' }}>
                                                  â€¢ {act} = {count}
                                                </Typography>
                                              ))}
                                            </Box>
                                          </Box>
                                        </Grid>
                                      ))}
                                    </Grid>
                                  </Paper>
                                </Grid>

                                <Grid size={{ xs: 12, md: 5 }}>
                                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', boxSizing: 'border-box' }}>
                                    <Box>
                                      <Typography variant="caption" sx={{ fontWeight: 850, display: 'block', textTransform: 'uppercase', color: 'secondary.main' }}>
                                        8-Hour Shift Utilization Rate
                                      </Typography>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                          Utilization = {worker.utilization}%
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                                          {worker.actualMinutes} / {SHIFT_MINUTES} Minutes
                                        </Typography>
                                      </Box>
                                    </Box>
                                    <LinearProgress
                                      variant="determinate"
                                      value={Math.min(worker.utilization, 100)}
                                      sx={{
                                        height: 6,
                                        borderRadius: 3,
                                        mt: 1.5,
                                        bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                        '& .MuiLinearProgress-bar': {
                                          background: worker.utilization >= 90 
                                            ? 'linear-gradient(90deg, #10B981, #059669)'
                                            : worker.utilization >= 75
                                            ? 'linear-gradient(90deg, #3B82F6, #1D4ED8)'
                                            : 'linear-gradient(90deg, #F59E0B, #D97706)',
                                          borderRadius: 3,
                                        }
                                      }}
                                    />
                                  </Paper>
                                </Grid>
                              </Grid>
                            </Box>
                          </Collapse>
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
            px: 3,
            pb: 2.5,
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
              Showing {workersData.length > 0 ? page * rowsPerPage + 1 : 0}-{Math.min(workersData.length, (page + 1) * rowsPerPage)} of {workersData.length}
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
                const totalPages = Math.ceil(workersData.length / rowsPerPage);
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
              disabled={page >= Math.ceil(workersData.length / rowsPerPage) - 1 || workersData.length === 0}
              onClick={() => setPage(page + 1)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                color: (page >= Math.ceil(workersData.length / rowsPerPage) - 1 || workersData.length === 0) ? 'text.disabled' : 'text.primary',
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

      {/* â”€â”€ Employee Detailed Audit Profile Dialog â”€â”€ */}
      <Dialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              boxShadow: themeMode === 'dark' ? '0 10px 40px rgba(0,0,0,0.4)' : '0 10px 30px rgba(37,99,235,0.08)',
              border: '1px solid',
              borderColor: 'divider',
            }
          }
        }}
      >
        {selectedWorkerDetails && (
          <>
            <DialogTitle sx={{ p: 3, bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.015)' : 'rgba(37,99,235,0.01)', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'rgba(37,99,235,0.1)', color: '#2563EB', width: 44, height: 44, fontWeight: 'bold' }}>
                  {selectedWorkerDetails.employeeName.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 850, lineHeight: 1.2 }}>
                    {selectedWorkerDetails.employeeName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    Worker Performance Audit Profile  Â·  {selectedWorkerDetails.employeeId}  Â·  {selectedWorkerDetails.role}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
              {/* Profile KPI Cards */}
              <Grid container spacing={2.5} sx={{ mb: 3, mt: 0.2 }}>
                {[
                  { label: 'Productivity Rate', value: `${selectedWorkerDetails.productivity}%`, color: getProductivityStatus(selectedWorkerDetails.productivity).color, icon: <ProgressIcon /> },
                  { label: 'Shift Utilization Rate', value: `${selectedWorkerDetails.utilization}%`, color: '#3B82F6', icon: <ClockIcon /> },
                  { label: 'Unique SOs Worked', value: `${selectedWorkerDetails.uniqueSOs.size} SOs`, color: '#EC4899', icon: <SOIcon /> },
                  { label: 'Total Logging Acts', value: `${selectedWorkerDetails.totalLogs} Incidents`, color: '#F59E0B', icon: <ActivityIcon /> },
                  { label: 'Working Hours', value: `${Math.round((selectedWorkerDetails.actualMinutes / 60) * 10) / 10} hrs`, color: '#8B5CF6', icon: <ClockIcon /> },
                  { label: 'Ideal Hours', value: `${Math.round((selectedWorkerDetails.idealMinutes / 60) * 10) / 10} hrs`, color: '#10B981', icon: <ClockIcon /> },
                ].map((card, idx) => (
                  <Grid size={{ xs: 6, sm: 4, md: 2 }} key={idx}>
                    <Paper variant="outlined" sx={{ p: 1.8, borderRadius: 2.5, textAlign: 'center', height: '100%' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', fontSize: '0.75rem' }}>{card.label}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900, color: card.color, mt: 0.5 }}>{card.value}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Tabs for breakdowns */}
              <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 2 }}>
                <Tabs value={dialogTab} onChange={(_, val) => setDialogTab(val)} sx={{ minHeight: 36, '& .MuiTab-root': { py: 0.5, minHeight: 36, fontSize: '0.82rem', fontWeight: 700 } }}>
                  <Tab label="Sales Orders Breakdowns" icon={<SOIcon sx={{ fontSize: 14 }} />} iconPosition="start" />
                  <Tab label="Departments Breakdowns" icon={<DeptIcon sx={{ fontSize: 14 }} />} iconPosition="start" />
                  <Tab label="Activities Breakdown" icon={<ActivityIcon sx={{ fontSize: 14 }} />} iconPosition="start" />
                </Tabs>
              </Box>

              {/* Tab Content 1: SO Breakdown */}
              <Collapse in={dialogTab === 0}>
                <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
                   <Table size="small">
                     <TableHead sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                       <TableRow>
                         <TableCell sx={{ fontWeight: 700, py: 1.2 }}>SO Number</TableCell>
                         <TableCell sx={{ fontWeight: 700 }}>Activities</TableCell>
                         <TableCell sx={{ fontWeight: 700 }}>Actual Time</TableCell>
                         <TableCell sx={{ fontWeight: 700 }}>Ideal Time</TableCell>
                         <TableCell sx={{ fontWeight: 700 }}>Productivity %</TableCell>
                       </TableRow>
                     </TableHead>
                     <TableBody>
                       {Object.entries(selectedWorkerDetails.soBreakdown).map(([soNum, data]) => {
                         const pct = data.actualTime > 0 ? Math.round((data.idealTime / data.actualTime) * 100) : 0;
                         const status = getProductivityStatus(pct);
                         const activitiesList = Array.from(data.activityNames).join(', ');
                         return (
                           <TableRow key={soNum} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                             <TableCell sx={{ fontWeight: 800, fontFamily: 'ui-monospace, monospace', color: 'primary.main' }}>{soNum}</TableCell>
                             <TableCell sx={{ fontWeight: 700 }}>{data.count} ({activitiesList})</TableCell>
                             <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{data.actualTime} mins ({Math.round((data.actualTime / 60) * 10) / 10} hrs)</TableCell>
                             <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{data.idealTime} mins ({Math.round((data.idealTime / 60) * 10) / 10} hrs)</TableCell>
                             <TableCell sx={{ fontWeight: 950, color: status.color }}>{pct}%</TableCell>
                           </TableRow>
                         );
                       })}
                     </TableBody>
                   </Table>
                </TableContainer>
              </Collapse>

              {/* Tab Content 2: Dept Breakdown */}
              <Collapse in={dialogTab === 1}>
                <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
                   <Table size="small">
                     <TableHead sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                       <TableRow>
                         <TableCell sx={{ fontWeight: 700, py: 1.2 }}>Department</TableCell>
                         <TableCell sx={{ fontWeight: 700 }}>Activities</TableCell>
                         <TableCell sx={{ fontWeight: 700 }}>Actual Time</TableCell>
                         <TableCell sx={{ fontWeight: 700 }}>Ideal Time</TableCell>
                         <TableCell sx={{ fontWeight: 700 }}>Productivity %</TableCell>
                       </TableRow>
                     </TableHead>
                     <TableBody>
                       {Object.entries(selectedWorkerDetails.deptBreakdown).map(([dept, data]) => {
                         const pct = data.actualTime > 0 ? Math.round((data.idealTime / data.actualTime) * 100) : 0;
                         const status = getProductivityStatus(pct);
                         const activitiesList = Array.from(data.activityNames).join(', ');
                         return (
                           <TableRow key={dept} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                             <TableCell sx={{ fontWeight: 800 }}>{dept}</TableCell>
                             <TableCell sx={{ fontWeight: 700 }}>{data.count} ({activitiesList})</TableCell>
                             <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{data.actualTime} mins ({Math.round((data.actualTime / 60) * 10) / 10} hrs)</TableCell>
                             <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{data.idealTime} mins ({Math.round((data.idealTime / 60) * 10) / 10} hrs)</TableCell>
                             <TableCell sx={{ fontWeight: 950, color: status.color }}>{pct}%</TableCell>
                           </TableRow>
                         );
                       })}
                     </TableBody>
                   </Table>
                </TableContainer>
              </Collapse>

              {/* Tab Content 3: Activity Breakdown */}
              <Collapse in={dialogTab === 2}>
                <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
                   <Table size="small">
                     <TableHead sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                       <TableRow>
                         <TableCell sx={{ fontWeight: 700, py: 1.2 }}>Activity</TableCell>
                         <TableCell sx={{ fontWeight: 700 }}>Count</TableCell>
                         <TableCell sx={{ fontWeight: 700 }}>Standard Time</TableCell>
                         <TableCell sx={{ fontWeight: 700 }}>Actual Time</TableCell>
                         <TableCell sx={{ fontWeight: 700 }}>Productivity %</TableCell>
                       </TableRow>
                     </TableHead>
                     <TableBody>
                       {Object.entries(selectedWorkerDetails.actBreakdown).map(([act, data]) => {
                         const pct = data.actualTime > 0 ? Math.round((data.idealTime / data.actualTime) * 100) : 0;
                         const status = getProductivityStatus(pct);
                         return (
                           <TableRow key={act} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                             <TableCell sx={{ fontWeight: 800 }}>{act}</TableCell>
                             <TableCell sx={{ fontWeight: 700 }}>{data.count} Logs</TableCell>
                             <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{data.standardTime} mins</TableCell>
                             <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{data.actualTime} mins</TableCell>
                             <TableCell sx={{ fontWeight: 950, color: status.color }}>{pct}%</TableCell>
                           </TableRow>
                         );
                       })}
                     </TableBody>
                   </Table>
                </TableContainer>
              </Collapse>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};
