import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  PendingActions as PendingIcon,
  CheckCircle as ApprovedIcon,
  HighlightOff as RejectedIcon,
  BuildCircleOutlined as ReworkIcon,
  ArrowForward as ArrowForwardIcon,
  Group as WorkforceIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as ViewIcon,
  FiberManualRecord as DotIcon,
  Schedule as ClockIcon,
  Assignment as ActivityIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
} from 'recharts';

// ─── Productivity trend mock data (last 7 days) ─────────────────
const productivityTrend = [
  { day: 'Mon', productivity: 89 },
  { day: 'Tue', productivity: 94 },
  { day: 'Wed', productivity: 78 },
  { day: 'Thu', productivity: 102 },
  { day: 'Fri', productivity: 97 },
  { day: 'Sat', productivity: 88 },
  { day: 'Sun', productivity: 108 },
];

// ─── Custom recharts tooltip ─────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          px: 1.5,
          py: 1,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        }}
      >
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', mb: 0.2 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#2563EB' }}>
          {payload[0].value}%
        </Typography>
      </Box>
    );
  }
  return null;
};

export const Dashboard: React.FC = () => {
  const { dashboardKPIs, activityLogs, users, user, checkoutActivityForReview } = useApp();
  const navigate = useNavigate();

  // ── Data derivations ─────────────────────────────────────────
  const activeWorkers = useMemo(
    () => users.filter(u => u.role !== 'Supervisor' && (u.status === 'Active' || u.status === 'Working')).length,
    [users]
  );
  const totalWorkers = useMemo(
    () => users.filter(u => u.role !== 'Supervisor').length,
    [users]
  );

  // Latest 8 pending/under-review items for the queue
  const pendingQueue = useMemo(() => {
    return activityLogs
      .filter(log => log.status === 'Pending' || log.status === 'Under Review')
      .sort((a, b) => {
        const pw: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
        return (pw[b.reworkPriority || 'Medium'] || 2) - (pw[a.reworkPriority || 'Medium'] || 2);
      })
      .slice(0, 8);
  }, [activityLogs]);

  // Live feed — last 20 recently reviewed or submitted
  const liveFeed = useMemo(() => {
    return activityLogs
      .filter(log => log.timeline && log.timeline.length > 0)
      .sort((a, b) => {
        const ta = new Date(a.timeline[a.timeline.length - 1]?.timestamp || 0).getTime();
        const tb = new Date(b.timeline[b.timeline.length - 1]?.timestamp || 0).getTime();
        return tb - ta;
      })
      .slice(0, 20);
  }, [activityLogs]);

  const avgProductivity = useMemo(() => {
    const workers = users.filter(u => u.role !== 'Supervisor');
    if (!workers.length) return 0;
    return Math.round(workers.reduce((sum, u) => sum + u.productivity, 0) / workers.length);
  }, [users]);

  const handleReview = (id: string, status: string) => {
    if (status === 'Pending') checkoutActivityForReview(id, user?.name || 'Supervisor');
    navigate(`/review/${id}`);
  };

  // ── Helper renderers ─────────────────────────────────────────
  const priorityDot = (priority: string) => {
    const colors: Record<string, string> = { High: '#DC2626', Medium: '#D97706', Low: '#16A34A' };
    return (
      <DotIcon sx={{ fontSize: 8, color: colors[priority] || colors.Medium, flexShrink: 0 }} />
    );
  };

  const statusBadge = (status: string) => {
    const cfg: Record<string, { label: string; bg: string; color: string }> = {
      'Pending':      { label: 'Pending',    bg: '#FFFBEB', color: '#D97706' },
      'Under Review': { label: 'In Review',  bg: '#EFF6FF', color: '#2563EB' },
      'Approved':     { label: 'Approved',   bg: '#F0FDF4', color: '#16A34A' },
      'Rejected':     { label: 'Rejected',   bg: '#FEF2F2', color: '#DC2626' },
      'Rework':       { label: 'Rework',     bg: '#F5F3FF', color: '#7C3AED' },
    };
    const c = cfg[status] || { label: status, bg: '#F3F4F6', color: '#6B7280' };
    return (
      <Box
        sx={{
          display: 'inline-block',
          px: 1,
          py: 0.2,
          borderRadius: 1,
          bgcolor: c.bg,
          color: c.color,
          fontWeight: 700,
          fontSize: '0.68rem',
          whiteSpace: 'nowrap',
        }}
      >
        {c.label}
      </Box>
    );
  };

  const feedActionColor = (action: string) => {
    if (action === 'Approved') return '#16A34A';
    if (action === 'Rejected') return '#DC2626';
    if (action === 'Rework Assigned') return '#7C3AED';
    if (action === 'Under Review') return '#2563EB';
    return '#6B7280';
  };

  const timeAgo = (ts: string) => {
    if (!ts) return '—';
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  };

  return (
    <Box>

      {/* ── Banner ──────────────────────────────────────────────── */}
      <Box
        sx={{
          width: '100%',
          height: { xs: 120, md: 180 },
          borderRadius: 3,
          overflow: 'hidden',
          mb: 3,
          position: 'relative',
          bgcolor: '#0F172A',
        }}
      >
        <Box
          component="img"
          src="/factory_banner.png"
          alt="Factory Operations"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            opacity: 0.85,
          }}
          onError={(e: any) => { e.target.style.display = 'none'; }}
        />
        {/* Gradient overlay with text */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.3) 60%, transparent 100%)',
            display: 'flex',
            alignItems: 'center',
            px: { xs: 2.5, md: 4 },
          }}
        >
          <Box>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.1rem', md: '1.5rem' },
                color: '#F1F5F9',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                mb: 0.5,
              }}
            >
              Activity Overview
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '0.72rem', md: '0.82rem' },
                color: 'rgba(241,245,249,0.7)',
                fontWeight: 500,
              }}
            >
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── 4 KPI Stat Cards ────────────────────────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          {
            label: 'Active Workforce',
            value: `${activeWorkers} / ${totalWorkers}`,
            icon: <WorkforceIcon sx={{ fontSize: 22 }} />,
            color: '#2563EB',
            bg: '#EFF6FF',
            path: '/monitoring',
          },
          {
            label: 'Pending Verification',
            value: dashboardKPIs.pendingVerification,
            icon: <PendingIcon sx={{ fontSize: 22 }} />,
            color: '#D97706',
            bg: '#FFFBEB',
            path: '/verification',
          },
          {
            label: 'Completed Today',
            value: dashboardKPIs.approvedToday,
            icon: <ApprovedIcon sx={{ fontSize: 22 }} />,
            color: '#16A34A',
            bg: '#F0FDF4',
            path: null,
          },
          {
            label: 'Avg Productivity',
            value: `${avgProductivity}%`,
            icon: <TrendingUpIcon sx={{ fontSize: 22 }} />,
            color: '#7C3AED',
            bg: '#F5F3FF',
            path: '/reports',
          },
        ].map((kpi, i) => (
          <Card
            key={i}
            onClick={() => kpi.path && navigate(kpi.path)}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              boxShadow: 'none',
              cursor: kpi.path ? 'pointer' : 'default',
              transition: 'all 0.18s ease',
              '&:hover': kpi.path
                ? {
                    borderColor: kpi.color,
                    boxShadow: `0 4px 20px ${kpi.color}1A`,
                    transform: 'translateY(-2px)',
                  }
                : {},
            }}
          >
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2.5,
                    bgcolor: kpi.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: kpi.color,
                  }}
                >
                  {kpi.icon}
                </Box>
                {kpi.path && (
                  <ArrowForwardIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                )}
              </Box>
              <Typography
                sx={{
                  fontSize: { xs: '1.6rem', md: '1.9rem' },
                  fontWeight: 800,
                  color: 'text.primary',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  mb: 0.4,
                }}
              >
                {kpi.value}
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'text.secondary' }}>
                {kpi.label}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* ── Main Body: Left + Right ──────────────────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: '1fr 380px' },
          gap: 2.5,
          alignItems: 'start',
        }}
      >

        {/* ════ LEFT COLUMN ══════════════════════════════════════ */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* ── Productivity Cockpit Trend ──────────────────────── */}
          <Card
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              boxShadow: 'none',
            }}
          >
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              {/* Header */}
              <Box
                sx={{
                  px: 3,
                  pt: 2.5,
                  pb: 2,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Box sx={{ width: 4, height: 18, bgcolor: '#2563EB', borderRadius: 1, flexShrink: 0 }} />
                    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'text.primary' }}>
                      Productivity Cockpit Trend
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 500, pl: 1.5 }}>
                    Aggregate daily-average worker productivity (%) over the last 7 days. Values ≥ 100% indicate tasks met or exceeded standard time targets.
                  </Typography>
                </Box>
                <Button
                  onClick={() => navigate('/reports')}
                  size="small"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 12 }} />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    color: 'primary.main',
                    minWidth: 0,
                    flexShrink: 0,
                    ml: 2,
                  }}
                >
                  Full Report
                </Button>
              </Box>

              {/* Chart */}
              <Box sx={{ px: 2, pt: 2.5, pb: 2 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={productivityTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fontWeight: 600, fill: '#94A3B8', fontFamily: 'Outfit, Inter, sans-serif' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      domain={[60, 120]}
                      tick={{ fontSize: 11, fontWeight: 600, fill: '#94A3B8', fontFamily: 'Outfit, Inter, sans-serif' }}
                      tickFormatter={(v) => `${v}%`}
                      width={44}
                    />
                    <ReTooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="productivity"
                      stroke="#2563EB"
                      strokeWidth={2.5}
                      dot={{ r: 5, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          {/* ── Pending Verification Queue ──────────────────────── */}
          <Card
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              boxShadow: 'none',
            }}
          >
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              {/* Header */}
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 4, height: 18, bgcolor: '#D97706', borderRadius: 1, flexShrink: 0 }} />
                  <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'text.primary' }}>
                    Active Verification Queue
                  </Typography>
                  <Chip
                    label={`${pendingQueue.length} pending`}
                    size="small"
                    sx={{
                      bgcolor: '#FFFBEB',
                      color: '#D97706',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      height: 20,
                      borderRadius: 1,
                      border: '1px solid #FDE68A',
                    }}
                  />
                </Box>
                <Button
                  size="small"
                  onClick={() => navigate('/verification')}
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 12 }} />}
                  sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', color: 'primary.main' }}
                >
                  View All
                </Button>
              </Box>

              {/* Queue Items */}
              <Box sx={{ p: 0 }}>
                {pendingQueue.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <ApprovedIcon sx={{ fontSize: 36, color: '#16A34A', mb: 1 }} />
                    <Typography sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.875rem' }}>
                      All Clear! Queue is empty.
                    </Typography>
                  </Box>
                ) : (
                  pendingQueue.map((log, idx) => {
                    const isLast = idx === pendingQueue.length - 1;
                    const idNum = log.id.replace('LOG-PEND-', '').replace('LOG-HIST-', '');
                    const activityId = `ACT-${idNum.padStart(4, '0')}`;
                    const isLocked = log.status === 'Under Review' && log.reviewedBy !== user?.name;
                    const progressVal = log.status === 'Approved' ? 100 : log.status === 'Under Review' ? 60 : 20;
                    const progressColor = log.status === 'Under Review' ? '#2563EB' : '#D97706';

                    return (
                      <Box
                        key={log.id}
                        sx={{
                          px: 3,
                          py: 2,
                          borderBottom: isLast ? 'none' : '1px solid',
                          borderColor: 'divider',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          transition: 'background 0.15s',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        {/* Left: Icon + info */}
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4 }}>
                            {priorityDot(log.reworkPriority || 'Medium')}
                            <Typography
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                color: 'text.primary',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {log.activity}
                            </Typography>
                            <Box sx={{ ml: 'auto', flexShrink: 0 }}>
                              {statusBadge(log.status)}
                            </Box>
                          </Box>

                          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mb: 0.8 }}>
                            {activityId} · {log.workerName} · {log.department} · SO: {log.soNumber}
                          </Typography>

                          {/* Progress bar */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <LinearProgress
                              variant="determinate"
                              value={progressVal}
                              sx={{
                                flexGrow: 1,
                                height: 5,
                                borderRadius: 3,
                                bgcolor: 'action.hover',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: progressColor,
                                  borderRadius: 3,
                                },
                              }}
                            />
                            <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', fontWeight: 700, flexShrink: 0, width: 32 }}>
                              {progressVal}%
                            </Typography>
                          </Box>
                        </Box>

                        {/* Right: Actions */}
                        <Box sx={{ display: 'flex', gap: 0.8, flexShrink: 0 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleReview(log.id, log.status)}
                              sx={{
                                width: 30,
                                height: 30,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1.5,
                                '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
                              }}
                            >
                              <ViewIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={isLocked ? 'Locked by another supervisor' : 'Review Now'}>
                            <span>
                              <IconButton
                                size="small"
                                disabled={isLocked}
                                onClick={() => handleReview(log.id, log.status)}
                                sx={{
                                  width: 30,
                                  height: 30,
                                  bgcolor: '#2563EB',
                                  color: '#fff',
                                  borderRadius: 1.5,
                                  '&:hover': { bgcolor: '#1D4ED8' },
                                  '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' },
                                }}
                              >
                                <ArrowForwardIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Box>
            </CardContent>
          </Card>

        </Box>
        {/* ════ END LEFT COLUMN ══════════════════════════════════ */}

        {/* ════ RIGHT COLUMN: Live Operations Feed ══════════════ */}
        <Card
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            boxShadow: 'none',
            position: { xl: 'sticky' },
            top: { xl: 88 },
          }}
        >
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            {/* Feed Header */}
            <Box
              sx={{
                px: 2.5,
                py: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: 'text.primary' }}>
                  Live Operations Feed
                </Typography>
              </Box>
              <Chip
                label="LIVE"
                size="small"
                sx={{
                  bgcolor: '#DC2626',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.6rem',
                  height: 18,
                  borderRadius: 1,
                  letterSpacing: '0.06em',
                  animation: 'pulseGlow 2s infinite',
                }}
              />
            </Box>

            {/* Date label */}
            <Box sx={{ px: 2.5, py: 1.2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                {' · '}
                {dashboardKPIs.approvedToday} completed today
              </Typography>
            </Box>

            {/* Feed list */}
            <Box
              sx={{
                maxHeight: { xs: 400, xl: 640 },
                overflowY: 'auto',
              }}
            >
              {liveFeed.map((log, idx) => {
                const lastEvent = log.timeline[log.timeline.length - 1];
                const actionColor = feedActionColor(lastEvent?.action || '');
                const initials = (log.workerName || 'W')
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                // Avatar color based on index
                const avatarColors = ['#EFF6FF:#2563EB', '#F0FDF4:#16A34A', '#FFFBEB:#D97706', '#F5F3FF:#7C3AED', '#FEF2F2:#DC2626', '#ECFEFF:#0891B2'];
                const [avBg, avColor] = avatarColors[idx % avatarColors.length].split(':');

                return (
                  <Box key={log.id}>
                    {idx > 0 && <Divider sx={{ mx: 2.5, borderColor: 'divider' }} />}
                    <Box
                      sx={{
                        px: 2.5,
                        py: 1.5,
                        display: 'flex',
                        gap: 1.5,
                        alignItems: 'flex-start',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => navigate(`/review/${log.id}`)}
                    >
                      {/* Avatar */}
                      <Avatar
                        sx={{
                          width: 34,
                          height: 34,
                          bgcolor: avBg,
                          color: avColor,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          flexShrink: 0,
                          mt: 0.2,
                        }}
                      >
                        {initials}
                      </Avatar>

                      {/* Content */}
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              color: 'text.primary',
                              lineHeight: 1.3,
                            }}
                          >
                            {log.workerName}
                          </Typography>
                          <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', fontWeight: 500, flexShrink: 0, lineHeight: 1.5 }}>
                            {timeAgo(lastEvent?.timestamp || '')}
                          </Typography>
                        </Box>

                        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 500, lineHeight: 1.3, mb: 0.4 }}>
                          {log.userId} · {log.department}
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: '0.7rem',
                            color: actionColor,
                            fontWeight: 700,
                            lineHeight: 1.3,
                          }}
                        >
                          {lastEvent?.action || 'Submitted'} on{' '}
                          <Box
                            component="span"
                            sx={{ color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                          >
                            {log.soNumber}
                          </Box>
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Footer */}
            <Box
              sx={{
                px: 2.5,
                py: 1.5,
                borderTop: '1px solid',
                borderColor: 'divider',
                textAlign: 'center',
              }}
            >
              <Button
                size="small"
                onClick={() => navigate('/monitoring')}
                endIcon={<ArrowForwardIcon sx={{ fontSize: 12 }} />}
                sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', color: 'primary.main' }}
              >
                View All Worker Activity
              </Button>
            </Box>
          </CardContent>
        </Card>
        {/* ════ END RIGHT COLUMN ════════════════════════════════ */}

      </Box>
    </Box>
  );
};

export default Dashboard;
