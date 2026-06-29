import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';

// --- TypeScript Interfaces ---

export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  mobile: string;
  role: 'Supervisor' | 'Admin' | 'Skilled Worker' | 'Technician' | 'Operator';
  department: string;
  status: 'Active' | 'Working' | 'Idle' | 'Away' | 'Inactive';
  productivity: number;
  reworkCount: number;
  hoursWorked: number;
  approvalRate: number;
  activitiesCount: number;
  joinedDate: string;
}

export interface SalesOrder {
  id: string;
  soNumber: string;
  customerName: string;
  projectName: string;
  startDate: string;
  endDate: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Delayed';
  isActive: boolean;
  description: string;
  progress: number;
}

export interface TimelineEvent {
  user: string;
  timestamp: string;
  action: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Rework Assigned' | 'Rework Completed';
  remarks?: string;
}

export interface ActivityLog {
  id: string;
  userId: string; // Employee ID
  workerName: string;
  soNumber: string;
  department: string;
  activity: string;
  durationMinutes: number;
  standardManMinutes: number;
  startTime: string;
  endTime: string;
  activityDate: string;
  status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Rework';
  reviewedBy?: string;
  reviewedAt?: string;
  remarks?: string;
  reworkReason?: string;
  expectedCorrection?: string;
  reworkPriority?: 'Low' | 'Medium' | 'High';
  reworkDueDate?: string;
  coworkers?: string[];
  attachments?: { name: string; type: 'Photo' | 'Document'; url: string }[];
  timeline: TimelineEvent[];
}

export interface Department {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  description: string;
  activities: { name: string; standardMinutes: number }[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'New Submission' | 'High Priority Rework' | 'Pending Alert' | 'Threshold Delay' | 'System';
  priority: 'Low' | 'Medium' | 'High';
  status: 'Unread' | 'Read' | 'Archived';
  timestamp: string;
}

export interface SupervisorProfile {
  name: string;
  supervisorId: string;
  email: string;
  mobile: string;
  lastLogin: string;
  avatarUrl?: string;
}

interface AppContextType {
  themeMode: 'light' | 'dark';
  toggleTheme: () => void;
  isAuthenticated: boolean;
  user: SupervisorProfile | null;
  login: (supervisorId: string, password?: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (fields: Partial<SupervisorProfile>) => void;
  changePassword: (oldPass: string, newPass: string) => Promise<boolean>;

  // Data Lists
  users: User[];
  salesOrders: SalesOrder[];
  departments: Department[];
  activityLogs: ActivityLog[];
  notifications: Notification[];

  // Supervisor Actions
  checkoutActivityForReview: (id: string, supervisorName: string) => void;
  releaseActivityFromReview: (id: string) => void;
  approveActivity: (id: string, remarks?: string) => void;
  rejectActivity: (id: string, reason: string) => void;
  assignRework: (id: string, fields: { reason: string; expectedCorrection: string; priority: 'Low' | 'Medium' | 'High'; dueDate: string }) => void;
  bulkVerifyActivities: (ids: string[], action: 'Approve' | 'Reject', remarksOrReason: string) => void;

  // Notification Operations
  markNotificationRead: (id: string) => void;
  archiveNotification: (id: string) => void;
  markAllNotificationsRead: () => void;

  // KPI Calculations
  dashboardKPIs: {
    pendingVerification: number;
    underReview: number;
    approvedToday: number;
    rejectedToday: number;
    reworkAssignedToday: number;
    activeWorkers: number;
    idleWorkers: number;
    averageProductivity: number;
    overdueActivities: number;
    approvedByMe: number;
    rejectedByMe: number;
    reworksAssignedByMe: number;
    averageReviewTime: number; // in mins
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- Context Provider Implementation ---

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('supThemeMode');
    return (stored as 'light' | 'dark') || 'light';
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('supAccessToken');
  });

  const [user, setUser] = useState<SupervisorProfile | null>(() => {
    const stored = localStorage.getItem('supUser');
    return stored ? JSON.parse(stored) : null;
  });

  // Master Databases (instantiated once and cached in state memory)
  const [users, setUsers] = useState<User[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  
  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('supAccessToken');
    const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    
    return fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  };

  const loadInitialData = async () => {
    try {
      const [usersRes, soRes, deptRes, actRes, logsRes] = await Promise.all([
        fetchWithAuth('/users'),
        fetchWithAuth('/sales-orders'),
        fetchWithAuth('/departments'),
        fetchWithAuth('/activities'),
        fetchWithAuth('/activity-logs')
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        const list = Array.isArray(data) ? data : data.users || [];
        setUsers(list.map((u: any) => ({
          id: u.id,
          employeeId: u.employeeId,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
          email: u.email || '',
          mobile: u.mobile || '',
          role: u.role?.name || u.role || 'Skilled Worker',
          department: '',
          status: u.status || 'Active',
          productivity: 90,
          reworkCount: 0,
          hoursWorked: 0,
          approvalRate: 100,
          activitiesCount: 0,
          joinedDate: u.createdAt || new Date().toISOString(),
        })));
      }

      if (soRes.ok) {
        const data = await soRes.json();
        const list = data.salesOrders || data || [];
        setSalesOrders(list.map((so: any) => ({
          id: so.id,
          soNumber: so.soNumber,
          customerName: so.customerName || '',
          projectName: so.projectName || '',
          startDate: so.startDate || '',
          endDate: so.endDate || '',
          status: so.status || 'In Progress',
          isActive: so.isActive !== false,
          description: so.soDescription || '',
          progress: 50,
        })));
      }

      let fetchedActivities: any[] = [];
      if (actRes.ok) fetchedActivities = await actRes.json();

      if (deptRes.ok) {
        const data = await deptRes.json();
        setDepartments(data.map((d: any) => {
          const acts = fetchedActivities.filter((a: any) => a.department?.id === d.id || a.department?.name === d.name);
          return {
            id: d.id,
            name: d.name,
            status: d.isActive ? 'Active' : 'Inactive',
            description: d.description || '',
            activities: acts.map((a: any) => ({
              name: a.activityName,
              standardMinutes: a.standardManMinutes || 60,
            })),
          };
        }));
      }

      if (logsRes.ok) {
        const data = await logsRes.json();
        setActivityLogs(data.map((log: any) => ({
          id: log.id,
          userId: log.user?.employeeId || log.userId || '',
          workerName: `${log.user?.firstName || ''} ${log.user?.lastName || ''}`.trim(),
          soNumber: log.SalesOrder?.soNumber || '',
          department: log.department?.name || '',
          activity: log.activity?.activityName || '',
          durationMinutes: log.slots?.reduce((sum: number, s: any) => sum + (s.durationMinutes || 0), 0) || 0,
          standardManMinutes: log.activity?.standardManMinutes || 60,
          startTime: log.slots?.[0]?.startTime ? new Date(log.slots[0].startTime).toLocaleTimeString() : '09:00',
          endTime: log.slots?.[0]?.endTime ? new Date(log.slots[0].endTime).toLocaleTimeString() : '17:30',
          activityDate: log.activityDate?.split('T')[0] || new Date().toISOString().split('T')[0],
          status: (() => {
            switch(log.status) {
              case 'PENDING':
              case 'COMPLETED':
              case 'IN_PROGRESS':
                return 'Pending';
              case 'UNDER_REVIEW':
                return 'Under Review';
              case 'APPROVED':
                return 'Approved';
              case 'REJECTED':
                return 'Rejected';
              case 'REWORK_ASSIGNED':
                return 'Rework';
              default:
                return 'Pending';
            }
          })(),
          reviewedBy: log.reviewedBy,
          reviewedAt: log.updatedAt,
          remarks: log.managerRemarks || log.remarks || '',
          reworkReason: log.isRework ? log.managerRemarks : '',
          timeline: [],
          coworkers: log.slots?.[0]?.coworkers?.map((c: any) => c.coworker?.firstName) || [],
        })));
      }

    } catch (e) {
      console.error('Failed to load initial data', e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);


  const toggleTheme = () => {
    setThemeMode(prev => {
      const mode = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('supThemeMode', mode);
      return mode;
    });
  };

  const login = async (supervisorId: string, password?: string): Promise<boolean> => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: supervisorId, password: password || '' }),
      });

      if (response.ok) {
        const data = await response.json();
        // Backend returns: { accessToken, employeeId, firstName, lastName, role }
        const { accessToken, employeeId, firstName, lastName } = data;

        const activeSup: SupervisorProfile = {
          name: `${firstName} ${lastName}`.trim(),
          supervisorId: employeeId,
          email: '',
          mobile: '',
          lastLogin: new Date().toLocaleString(),
        };

        localStorage.setItem('supAccessToken', accessToken);
        localStorage.setItem('supIsAuth', 'true');
        localStorage.setItem('supUser', JSON.stringify(activeSup));
        setUser(activeSup);
        setIsAuthenticated(true);
        return true;
      const err = await response.json().catch(() => ({}));
        console.warn('Backend authentication failed:', err.message || response.statusText);
      }
    } catch (err) {
      console.error('Failed connecting to backend API:', err);
    }
    return false;
  };


  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('supIsAuth');
    localStorage.removeItem('supUser');
    localStorage.removeItem('supAccessToken');
  };

  const updateProfile = (fields: Partial<SupervisorProfile>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...fields };
      localStorage.setItem('supUser', JSON.stringify(updated));
      return updated;
    });
  };

  const changePassword = async (oldPass: string, newPass: string): Promise<boolean> => {
    // Simulated successful update
    return new Promise(resolve => setTimeout(() => resolve(true), 600));
  };

  // --- Supervisor Actions ---

  // Locking mechanism: Open review sets 'Under Review' status
  
  const checkoutActivityForReview = async (id: string, supervisorName: string) => {
    try {
      await fetchWithAuth(`/activity-logs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'UNDER_REVIEW', reviewedBy: supervisorName })
      });
      loadInitialData();
    } catch (e) {
      console.error(e);
    }
  };


  // Unlock logic: Release back to Pending
  
  const releaseActivityFromReview = async (id: string) => {
    try {
      await fetchWithAuth(`/activity-logs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'COMPLETED' })
      });
      loadInitialData();
    } catch (e) {
      console.error(e);
    }
  };


  // Permanently Approve
  
  const approveActivity = async (id: string, remarks?: string) => {
    try {
      await fetchWithAuth(`/activity-logs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'APPROVED', managerRemarks: remarks })
      });
      addNotification('New Submission', `Activity ${id} approved.`, 'Low');
      loadInitialData();
    } catch (e) {
      console.error(e);
    }
  };


  // Permanently Reject
  
  const rejectActivity = async (id: string, reason: string) => {
    try {
      await fetchWithAuth(`/activity-logs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'REJECTED', managerRemarks: reason })
      });
      loadInitialData();
    } catch (e) {
      console.error(e);
    }
  };


  // Assign Rework
  
  const assignRework = async (id: string, fields: { reason: string; expectedCorrection: string; priority: 'Low' | 'Medium' | 'High'; dueDate: string }) => {
    try {
      await fetchWithAuth(`/activity-logs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'REWORK_ASSIGNED', managerRemarks: fields.reason, isRework: true })
      });
      if (fields.priority === 'High') {
        addNotification('High Priority Rework', `High Priority Rework assigned for activity ${id}: ${fields.reason}`, 'High');
      }
      loadInitialData();
    } catch (e) {
      console.error(e);
    }
  };


  // Bulk Verify
  
  const bulkVerifyActivities = async (ids: string[], action: 'Approve' | 'Reject', remarksOrReason: string) => {
    const act = action === 'Approve' ? 'APPROVED' : 'REJECTED';
    for (const id of ids) {
      try {
        await fetchWithAuth(`/activity-logs/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: act, managerRemarks: remarksOrReason })
        });
      } catch (e) {
        console.error(e);
      }
    }
    loadInitialData();
  };


  // Helper to persist state to localStorage
  const syncStateToStorage = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to sync state to localStorage:', e);
    }
  };

  // Helper to adjust live stats for workers in state
  const updateEmployeeKPIs = (employeeId: string, action: 'Approved' | 'Rejected' | 'Rework', stdMins: number, actualMins: number) => {
    setUsers(prev => {
      const updated = prev.map(w => {
        if (w.employeeId === employeeId) {
          const actCount = w.activitiesCount + 1;
          const newHours = w.hoursWorked + (actualMins / 60);
          
          let score = w.productivity;
          let rCount = w.reworkCount;
          let approvedCount = Math.round((w.approvalRate / 100) * w.activitiesCount);

          if (action === 'Approved') {
            approvedCount += 1;
            // Productivity calculation: standard time vs actual duration
            // Simulate gradual productivity score change
            const ratio = stdMins > 0 ? (stdMins / actualMins) * 100 : 100;
            score = Math.round((w.productivity * 9 + Math.min(150, ratio)) / 10);
          } else if (action === 'Rework') {
            rCount += 1;
            score = Math.max(50, w.productivity - 2); // rework penalizes score slightly
          } else if (action === 'Rejected') {
            score = Math.max(50, w.productivity - 5); // rejections penalize score
          }

          const approvalRate = Math.round((approvedCount / actCount) * 100);

          return {
            ...w,
            activitiesCount: actCount,
            hoursWorked: Math.round(newHours * 10) / 10,
            productivity: score,
            reworkCount: rCount,
            approvalRate: Math.min(100, Math.max(10, approvalRate))
          };
        }
        return w;
      });
      syncStateToStorage('supUsers', updated);
      return updated;
    });
  };

  // --- Notifications management ---

  const addNotification = (type: Notification['type'], message: string, priority: Notification['priority']) => {
    setNotifications(prev => {
      const newNotif: Notification = {
        id: `NOT-${Date.now()}`,
        title: type === 'New Submission' ? 'New Activity Submitted' : (type === 'High Priority Rework' ? 'High Priority Rework Assigned' : 'System Notice'),
        message,
        type,
        priority,
        status: 'Unread',
        timestamp: new Date().toISOString(),
      };
      const updated = [newNotif, ...prev];
      syncStateToStorage('supNotifications', updated);
      return updated;
    });
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, status: 'Read' as const } : n);
      syncStateToStorage('supNotifications', updated);
      return updated;
    });
  };

  const archiveNotification = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, status: 'Archived' as const } : n);
      syncStateToStorage('supNotifications', updated);
      return updated;
    });
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => n.status === 'Unread' ? { ...n, status: 'Read' as const } : n);
      syncStateToStorage('supNotifications', updated);
      return updated;
    });
  };

  // --- KPI Calculations (Memoized for High Performance) ---

  const dashboardKPIs = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]!;
    
    // Filter today's reviews
    const todayLogs = activityLogs.filter(log => log.reviewedAt?.split('T')[0] === todayStr);
    
    const pendingVerification = activityLogs.filter(log => log.status === 'Pending').length;
    const underReview = activityLogs.filter(log => log.status === 'Under Review').length;
    
    const approvedToday = todayLogs.filter(log => log.status === 'Approved').length;
    const rejectedToday = todayLogs.filter(log => log.status === 'Rejected').length;
    const reworkAssignedToday = todayLogs.filter(log => log.status === 'Rework').length;

    // Active workers = unique workers who submitted logs today
    const activeWorkersSet = new Set(activityLogs.filter(log => log.activityDate === todayStr).map(log => log.userId));
    const activeWorkers = Math.min(users.length, activeWorkersSet.size);
    const idleWorkers = Math.max(0, users.filter(w => w.role !== 'Supervisor').length - activeWorkers);

    // Productivity metrics (average of approved workers)
    const activeProductiveUsers = users.filter(u => u.role !== 'Supervisor' && u.activitiesCount > 0);
    const totalProd = activeProductiveUsers.reduce((sum, u) => sum + u.productivity, 0);
    const averageProductivity = activeProductiveUsers.length > 0 ? Math.round(totalProd / activeProductiveUsers.length) : 88;

    // Overdue = pending logs submitted more than 4 hours ago
    const nowEpoch = Date.now();
    const overdueActivities = activityLogs.filter(log => {
      if (log.status !== 'Pending') return false;
      const submittedTime = log.timeline[0] ? new Date(log.timeline[0].timestamp).getTime() : 0;
      return (nowEpoch - submittedTime) > 4 * 60 * 60 * 1000;
    }).length;

    // My performance (filtered by logged supervisor)
    const myName = user?.name || 'Amit Verma';
    const myTodayLogs = todayLogs.filter(log => log.reviewedBy === myName);
    
    const approvedByMe = myTodayLogs.filter(log => log.status === 'Approved').length;
    const rejectedByMe = myTodayLogs.filter(log => log.status === 'Rejected').length;
    const reworksAssignedByMe = myTodayLogs.filter(log => log.status === 'Rework').length;

    return {
      pendingVerification,
      underReview,
      approvedToday,
      rejectedToday,
      reworkAssignedToday,
      activeWorkers,
      idleWorkers,
      averageProductivity,
      overdueActivities,
      approvedByMe,
      rejectedByMe,
      reworksAssignedByMe,
      averageReviewTime: 2.4, // Mocked plant metric
    };
  }, [activityLogs, users, user]);

  return (
    <AppContext.Provider value={{
      themeMode,
      toggleTheme,
      isAuthenticated,
      user,
      login,
      logout,
      updateProfile,
      changePassword,
      users,
      salesOrders,
      departments,
      activityLogs,
      notifications,
      checkoutActivityForReview,
      releaseActivityFromReview,
      approveActivity,
      rejectActivity,
      assignRework,
      bulkVerifyActivities,
      markNotificationRead,
      archiveNotification,
      markAllNotificationsRead,
      dashboardKPIs,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
