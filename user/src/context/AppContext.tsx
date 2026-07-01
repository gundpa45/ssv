import React, { createContext, useState, useContext, useEffect } from 'react';

export interface ActivityLog {
  id: string;
  userId: string;
  workerName: string;
  soNumber: string;
  department: string;
  activity: string;
  startTime?: string;
  endTime?: string;
  standardManMinutes: number;
  durationMinutes: number;
  remarks?: string;
  coworkers?: string[];
  createdAt?: string;
  activityDate?: string;
  status?: string;
  minutesWorked?: number;
  progressPercentage?: number;
  slots?: {
    id: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    userId?: string;
    createdAt?: string;
  }[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  referenceId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface User {
  id?: string;
  adminName: string;
  userId: string;
  role: string;
  status: string;
}

export interface DeptActivity {
  id: string;
  name: string;
  standardMinutes: number;
}

export interface Department {
  id?: string;
  name: string;
  code: string;
  description: string;
  activities: DeptActivity[];
}

export interface SalesOrder {
  id?: string;
  soNumber: string;
  customerName: string;
  projectName: string;
}

interface AppContextType {
  isAuthenticated: boolean;
  user: { id?: string; userId: string; name: string; role?: string } | null;
  login: (userId: string, password?: string) => Promise<boolean>;
  logout: () => void;
  departments: Department[];
  activityLogs: ActivityLog[];
  addNewActivityLog: (newLog: Omit<ActivityLog, 'id'> & { employeeId?: string }) => Promise<boolean>;
  resumeActivityLog: (id: string, updatedFields: { durationMinutes: number; startTime?: string; endTime?: string; progressPercentage?: number; status?: string; remarks?: string; coworkers?: string[] }) => Promise<boolean>;
  notifications: Notification[];
  users: User[];
  salesOrders: SalesOrder[];
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<boolean>;
  markAllNotificationsAsRead: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('userPortalToken');
  });

  const [user, setUser] = useState<{ id?: string; userId: string; name: string; role?: string } | null>(() => {
    const stored = localStorage.getItem('userPortalUser');
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('userPortalToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };
    const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    if (res.status === 401) {
      logout();
    }
    return res;
  };

  const login = async (userId: string, password?: string): Promise<boolean> => {
    try {
      if (!password) return false;

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId: userId, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const token = data.accessToken || data.token;
        if (token) {
          const userRole = data.role || 'Skilled';
          const loggedInUser = {
            id: data.userId || data.id,
            userId,
            name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Worker User',
            role: userRole
          };

          localStorage.setItem('userPortalToken', token);
          localStorage.setItem('userPortalUser', JSON.stringify(loggedInUser));

          setIsAuthenticated(true);
          setUser(loggedInUser);
          return true;
        }
      } else {
        const err = await response.json().catch(() => ({}));
        console.warn('Backend authentication failed:', err.message || response.statusText);
        return false;
      }
    } catch (err) {
      console.error('Failed connecting to backend API:', err);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('userPortalToken');
    localStorage.removeItem('userPortalUser');
  };

  const loadInitialData = async () => {
    try {
      // Fetch departments
      const deptRes = await fetchWithAuth('/departments');
      let deptData: any[] = [];
      if (deptRes.ok) {
        deptData = await deptRes.json();
      }

      // Fetch activities separately (backend doesn't include activities in /departments)
      const actRes = await fetchWithAuth('/activities');
      let activitiesData: any[] = [];
      if (actRes.ok) {
        activitiesData = await actRes.json();
      }

      // Merge activities into departments
      if (deptData.length > 0) {
        const mappedDepts: Department[] = deptData.map((d: any) => {
          // Find activities that belong to this department
          const deptActivities = activitiesData
            .filter((a: any) => a.department?.id === d.id || a.department?.name === d.name)
            .map((a: any) => ({
              id: a.id,
              name: a.activityName,
              standardMinutes: a.standardManMinutes || 60,
            }));

          return {
            id: d.id,
            name: d.name,
            code: d.code,
            description: d.description || '',
            activities: deptActivities,
          };
        });
        setDepartments(mappedDepts);
      } else {
        setDepartments([]);
      }

      // Fetch sales orders
      const soRes = await fetchWithAuth('/sales-orders');
      if (soRes.ok) {
        const soData = await soRes.json();
        const soList = soData.salesOrders || soData || [];
        setSalesOrders(soList.map((so: any) => ({
          id: so.id,
          soNumber: so.soNumber,
          customerName: so.customerName || '',
          projectName: so.projectName || '',
        })));
      }

      // Fetch users
      const userRes = await fetchWithAuth('/users');
      if (userRes.ok) {
        const usersData = await userRes.json();
        const userList = Array.isArray(usersData) ? usersData : (usersData.users || []);
        const mappedUsers = userList.map((u: any) => ({
          id: u.id,
          adminName: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
          userId: u.employeeId,
          role: u.role?.name || u.role || 'Skilled',
          status: u.status || 'Active',
        }));
        setUsers(mappedUsers);
      }

      // Fetch activity logs
      const logsRes = await fetchWithAuth('/activity-logs');
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        const logList = Array.isArray(logsData) ? logsData : [];
        setActivityLogs(logList.map((log: any) => ({
          id: log.id,
          userId: log.userId || log.user?.id || '',
          workerName: `${log.user?.firstName || ''} ${log.user?.lastName || ''}`.trim() || '',
          soNumber: log.SalesOrder?.soNumber || log.soNumber || '',
          department: log.department?.name || log.departmentName || '',
          activity: log.activity?.activityName || log.activityName || '',
          standardManMinutes: log.activity?.standardManMinutes || log.standardManMinutes || 60,
          durationMinutes: log.slots?.reduce((sum: number, s: any) => sum + (s.durationMinutes || 0), 0) || log.durationMinutes || 0,
          remarks: log.remarks || '',
          createdAt: log.createdAt,
          activityDate: log.activityDate,
          status: log.status || 'PENDING',
          minutesWorked: log.minutesWorked || log.durationMinutes || 0,
          progressPercentage: log.progressPercentage || 0,
          startTime: log.startTime,
          endTime: log.endTime,
          slots: log.slots?.map((s: any) => ({
            id: s.id,
            startTime: s.startTime,
            endTime: s.endTime,
            durationMinutes: s.durationMinutes,
            userId: s.userId,
            createdAt: s.createdAt,
          })) || [],
        })));
      }
    } catch (err) {
      console.warn('Backend data fetch failed:', err);
    }
  };



  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const addNewActivityLog = async (newLog: Omit<ActivityLog, 'id'> & { employeeId?: string }): Promise<boolean> => {
    try {
      // Find matching IDs from loaded data
      const matchedSO = salesOrders.find(s => s.soNumber === newLog.soNumber);
      const matchedDept = departments.find(d => d.name === newLog.department);
      const matchedAct = matchedDept?.activities.find(a => a.name === newLog.activity);

      if (!matchedSO?.id || !matchedDept?.id || !matchedAct?.id) {
        console.error('Validation failure: could not match backend IDs', {
          soNumber: newLog.soNumber,
          department: newLog.department,
          activity: newLog.activity,
          matchedSO,
          matchedDept,
          matchedAct,
        });
        // Fall through to mock fallback
        throw new Error('ID matching failed - using mock fallback');
      }

      const payload = {
        soId: matchedSO.id,
        departmentId: matchedDept.id,
        activityId: matchedAct.id,
        durationMinutes: newLog.durationMinutes,
        remarks: newLog.remarks || '',
        coworkerEmployeeIds: newLog.coworkers || [],
        startTime: newLog.startTime || '09:00',
        endTime: newLog.endTime || '17:30',
        progressPercentage: newLog.progressPercentage,
        status: newLog.status,
      };

      const res = await fetchWithAuth('/activity-logs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const responseData = await res.json();
        const fullLog: ActivityLog = {
          id: responseData.activityLogId || `LOG-${Date.now()}`,
          userId: user?.id || user?.userId || '',
          workerName: user?.name || '',
          soNumber: newLog.soNumber,
          department: newLog.department,
          activity: newLog.activity,
          durationMinutes: newLog.durationMinutes,
          standardManMinutes: newLog.standardManMinutes || matchedAct.standardMinutes || 60,
          remarks: newLog.remarks,
          coworkers: newLog.coworkers,
          createdAt: new Date().toISOString(),
          activityDate: new Date().toISOString(),
          status: newLog.status || 'PENDING',
          minutesWorked: newLog.durationMinutes,
          progressPercentage: newLog.progressPercentage || 0,
        };
        setActivityLogs(prev => [fullLog, ...prev]);
        return true;
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('Backend submission rejected:', errData);
        return false;
      }
    } catch (err) {
      console.warn('Backend submit failed:', err);
      return false;
    }
  };

  const resumeActivityLog = async (
    id: string,
    updatedFields: {
      durationMinutes: number;
      startTime?: string;
      endTime?: string;
      progressPercentage?: number;
      status?: string;
      remarks?: string;
      coworkers?: string[];
    }
  ): Promise<boolean> => {
    try {
      const payload = {
        durationMinutes: updatedFields.durationMinutes,
        startTime: updatedFields.startTime || '09:00',
        endTime: updatedFields.endTime || '17:30',
        progressPercentage: updatedFields.progressPercentage,
        status: updatedFields.status,
        remarks: updatedFields.remarks,
        coworkerEmployeeIds: updatedFields.coworkers || [],
        userId: user?.id || user?.userId,
      };

      const res = await fetchWithAuth(`/activity-logs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await loadInitialData();
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Failed to resume activity log:', err);
      return false;
    }
  };



  const fetchNotifications = async () => {
    try {
      const res = await fetchWithAuth('/notifications');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setNotifications(data);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed querying notifications from API');
    }
    setNotifications([]);
  };

  const markNotificationAsRead = async (id: string): Promise<boolean> => {
    try {
      if (id.startsWith('notif-')) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        return true;
      }
      const res = await fetchWithAuth(`/notifications/${id}/read`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    return true;
  };

  const markAllNotificationsAsRead = async (): Promise<boolean> => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      const res = await fetchWithAuth('/notifications/read-all', { method: 'POST' });
      return res.ok;
    } catch (err) {
      console.error(err);
    }
    return true;
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated,
      user,
      login,
      logout,
      departments,
      activityLogs,
      addNewActivityLog,
      resumeActivityLog,
      notifications,
      users,
      salesOrders,
      fetchNotifications,
      markNotificationAsRead,
      markAllNotificationsAsRead
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
