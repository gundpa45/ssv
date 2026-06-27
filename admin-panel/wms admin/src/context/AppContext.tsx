import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi, usersApi, rolesApi, salesOrdersApi, activityLogsApi, departmentsApi } from '../api';

export interface User {
  id: string;
  adminName: string;
  userId: string;
  mobile: string;
  email: string;
  role: string;
  status: 'Working' | 'Inactive' | 'Idle' | 'Active' | 'Away';
  roleId?: string;
  isDeleted?: boolean;
}
import { mockUsers } from '../mock/users';
export interface SalesOrder {
  id: string;
  soNumber: string;
  customerName: string;
  projectName: string;
  startDate: string;
  endDate: string;
  description?: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Delayed';
  isActive: boolean;
  workers?: any[];
  activities?: any[];
  allowedDepartments?: string[];
  allowedActivities?: string[];
}
import { mockSalesOrders } from '../mock/salesOrders';
export interface ActivityLog {
  id: string;
  userId: string;
  soNumber: string;
  department: string;
  activity: string;
  durationMinutes: number;
  remarks: string;
  workerName?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
  user?: any;
  createdAt?: string;
  activityDate?: string;
  slots?: any[];
  isRework?: boolean;
  standardManMinutes?: number;
}
import { mockActivityLogs } from '../mock/activityLogs';
export interface Department {
  id: string;
  name: string;
  status: string;
  createdDate: string;
  description?: string;
  activities?: any[];
}
import { mockDepartments } from '../mock/departments';
import { mockRoles } from '../mock/roles';

type ThemeMode = 'light' | 'dark';

export interface Activity {
  id: string;
  timestamp: string;
  adminName: string;
  userId: string;
  activity: string;
  status: string;
  details: string;
  department: string;
  duration: string;
}

export interface DeptActivity {
  id: string;
  name: string;
  standardMinutes: number;
  status: string;
}

export interface ErpActivity {
  id: string;
  activityName: string;
  departmentId: string;
  standardTime: string;
  standardManMinutes?: number;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  startTime?: string;
  endTime?: string;
  status: 'Pending' | 'Assigned' | 'Running' | 'Completed' | 'Paused';
  completionDate?: string;
  actualDuration?: string;
  isActive: boolean;
  name?: string;
  code?: string;
  department?: string;
}

export interface Metrics {
  totalUsers: number;
  activeUsers: number;
  workingUsers: number;
  idleUsers: number;
  activitiesToday: number;
  completedActivities: number;
  pendingActivities: number;
  averageProductivity: number;
}

export interface ChartData {
  time: string;
  productivity: number;
}

export interface DeptPerformance {
  department: string;
  score: number;
  tasksCompleted: number;
  reworkTasks: number;
}

export interface UserProductivity {
  name: string;
  role: string;
  score: number;
  avatarColor: string;
}

interface AppContextType {
  themeMode: ThemeMode;
  toggleTheme: () => void;
  isAuthenticated: boolean;
  user: any | null;
  login: (userId: string, password?: string) => Promise<boolean>;
  logout: () => void;

  roles: { id: string; name: string }[];
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;

  salesOrders: SalesOrder[];
  addNewSalesOrder: (so: SalesOrder) => Promise<boolean>;
  updateSalesOrder: (id: string, so: SalesOrder) => Promise<boolean>;
  toggleSOStatus: (id: string, isActive: boolean) => Promise<boolean>;
  deleteSalesOrder: (id: string) => Promise<boolean>;

  erpActivities: ErpActivity[];
  addErpActivity: (act: Omit<ErpActivity, 'id'>) => void;
  updateErpActivity: (act: ErpActivity) => void;
  deleteErpActivity: (id: string) => void;
  assignEmployeeToActivity: (actId: string, empId: string, empName: string) => void;
  changeActivityStatus: (actId: string, status: ErpActivity['status']) => void;

  users: User[];
  addNewUser: (u: any) => Promise<any>;
  updateUser: (id: string, fields: any) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;

  activityLogs: ActivityLog[];
  addNewActivityLog: (log: any) => Promise<boolean>;
  updateActivityLog: (id: string, log: any) => Promise<boolean>;

  metrics: Metrics;
  productivityTrend: ChartData[];
  deptPerformance: DeptPerformance[];
  userPerformance: UserProductivity[];
  recentActivity: Activity[];
  currentUserRole: string;
  soPermissions: any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [erpActivities, setErpActivities] = useState<ErpActivity[]>([]);
  
  const [metrics, setMetrics] = useState<Metrics>({
    totalUsers: 0, activeUsers: 0, workingUsers: 0, idleUsers: 0,
    activitiesToday: 0, completedActivities: 0, pendingActivities: 0, averageProductivity: 0
  });
  const [productivityTrend, setProductivityTrend] = useState<ChartData[]>([]);
  const [deptPerformance, setDeptPerformance] = useState<DeptPerformance[]>([]);
  const [userPerformance, setUserPerformance] = useState<UserProductivity[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);

  const loadInitialData = async () => {
    try {
      const [r, u, s, l, d] = await Promise.all([
        rolesApi.getAll().catch(() => []),
        usersApi.getAll().catch(() => []),
        salesOrdersApi.getAll().catch(() => []),
        activityLogsApi.getAll().catch(() => []),
        departmentsApi.getAll().catch(() => []),
      ]);
      
      setRoles(r as any);
      
      const userList = Array.isArray(u) ? u : (u as any).users || [];
      const mappedUsers = userList.map((x: any) => ({
        id: x.id,
        adminName: `${x.firstName || ''} ${x.lastName || ''}`.trim(),
        userId: x.employeeId,
        mobile: x.mobile || '',
        email: x.email || '',
        role: x.role?.name || x.role || 'Skilled Worker',
        status: x.status || 'Active',
        roleId: x.roleId,
      }));
      setUsers(mappedUsers as any);
      
      const soList = Array.isArray(s) ? s : (s as any).salesOrders || [];
      setSalesOrders(soList as any);
      
      const logList = Array.isArray(l) ? l : (l as any).activityLogs || [];
      const mappedLogs = logList.map((log: any) => ({
          id: log.id,
          userId: log.userId || log.user?.id || '',
          workerName: `${log.user?.firstName || ''} ${log.user?.lastName || ''}`.trim() || '',
          soNumber: log.SalesOrder?.soNumber || log.soNumber || '',
          department: log.department?.name || log.departmentName || '',
          activity: log.activity?.activityName || log.activityName || '',
          durationMinutes: log.slots?.reduce((sum: number, s: any) => sum + (s.durationMinutes || 0), 0) || log.durationMinutes || 0,
          remarks: log.remarks || '',
          createdAt: log.createdAt,
          activityDate: log.activityDate,
          status: log.status || 'PENDING',
          isRework: log.isRework || false,
          standardManMinutes: log.activity?.standardManMinutes || log.standardManMinutes || 60,
      }));
      setActivityLogs(mappedLogs as any);
      
      setDepartments(d as any);
    } catch (err) {
      console.error("Failed to load initial data", err);
    }
  };

  useEffect(() => {
    const authUser = localStorage.getItem('authUser');
    if (authUser) {
      setUser(JSON.parse(authUser));
      setIsAuthenticated(true);
      loadInitialData();
    }
  }, []);

  const toggleTheme = () => setThemeMode(p => p === 'dark' ? 'light' : 'dark');

  const login = async (userId: string, password?: string): Promise<boolean> => {
    try {
      // Backend expects: { employeeId, password }
      // Backend returns: { accessToken, employeeId, firstName, lastName, role }
      const response = await authApi.login({ employeeId: userId, password: password || '' });
      const { accessToken, employeeId, firstName, lastName, role } = response;

      const userObj = {
        userId: employeeId,
        name: `${firstName} ${lastName}`.trim(),
        role,
        employeeId,
      };

      setUser(userObj);
      setIsAuthenticated(true);
      localStorage.setItem('authUser', JSON.stringify(userObj));
      localStorage.setItem('accessToken', accessToken);

      // Load initial data after login 
      await loadInitialData();

      return true;
    } catch {
      return false;
    }
  };



  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('authUser');
    localStorage.removeItem('accessToken');
  };

  const addNewSalesOrder = async (so: SalesOrder) => {
    so.id = 'SO' + Date.now();
    setSalesOrders(p => [so, ...p]);
    return true;
  };
  const updateSalesOrder = async (id: string, so: SalesOrder) => {
    setSalesOrders(p => p.map(x => x.id === id ? { ...x, ...so } : x));
    return true;
  };
  const toggleSOStatus = async (id: string, isActive: boolean) => {
    setSalesOrders(p => p.map(x => x.id === id ? { ...x, isActive } : x));
    return true;
  };
  const deleteSalesOrder = async (id: string) => {
    setSalesOrders(p => p.filter(x => x.id !== id));
    return true;
  };

  const addErpActivity = (act: any) => setErpActivities(p => [...p, { ...act, id: 'ACT' + Date.now() }]);
  const updateErpActivity = (act: any) => setErpActivities(p => p.map(x => x.id === act.id ? act : x));
  const deleteErpActivity = (id: string) => setErpActivities(p => p.filter(x => x.id !== id));
  const assignEmployeeToActivity = (id: string, empId: string, empName: string) => {
    setErpActivities(p => p.map(x => x.id === id ? { ...x, assignedEmployeeId: empId, assignedEmployeeName: empName, status: 'Assigned' } : x));
  };
  const changeActivityStatus = (id: string, status: any) => {
    setErpActivities(p => p.map(x => x.id === id ? { ...x, status } : x));
  };

  const addNewUser = async (u: any) => {
    try {
      const response: any = await usersApi.create({
        employeeId: u.userId,
        firstName: u.firstName,
        lastName: u.lastName,
        mobile: u.mobile,
        email: u.email,
        roleId: u.roleId,
      });
      await loadInitialData();
      return { success: true, employeeId: response.user?.employeeId || u.userId, generatedPassword: response.generatedPassword || 'password123' };
    } catch (err: any) {
      console.error(err);
      return { success: false, error: err.message || 'Failed to create user' };
    }
  };

  const updateUser = async (id: string, fields: any) => {
    try {
      const targetUser = users.find(x => x.id === id || x.userId === id);
      if (!targetUser) return false;
      const realId = targetUser.id;
      
      const updatePayload: any = {};
      if (fields.firstName) updatePayload.firstName = fields.firstName;
      if (fields.lastName) updatePayload.lastName = fields.lastName;
      if (fields.mobile) updatePayload.mobile = fields.mobile;
      if (fields.email !== undefined) updatePayload.email = fields.email;
      if (fields.status) {
        updatePayload.status = fields.status === 'Working' || fields.status === 'Active' ? 'ACTIVE' : 'INACTIVE';
      }
      if (fields.isActive !== undefined) updatePayload.isActive = fields.isActive;
      if (fields.roleId) updatePayload.roleId = fields.roleId;

      await usersApi.update(realId, updatePayload);
      await loadInitialData();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const targetUser = users.find(x => x.id === id || x.userId === id);
      if (!targetUser) return false;
      const realId = targetUser.id;
      
      await usersApi.delete(realId);
      await loadInitialData();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const addNewActivityLog = async (log: any) => {
    setActivityLogs(p => [{ ...log, id: 'LOG' + Date.now() }, ...p]);
    return true;
  };
  const updateActivityLog = async (id: string, log: any) => {
    setActivityLogs(p => p.map(x => x.id === id ? { ...x, ...log } : x));
    return true;
  };

  const currentUserRole = user?.role || 'Admin';
  const soPermissions = { canCreate: true, canEdit: true, canToggleStatus: true, canViewDashboard: true, canDelete: true };

  return (
    <AppContext.Provider value={{
      themeMode, toggleTheme, isAuthenticated, user, login, logout,
      roles, departments, setDepartments,
      salesOrders, addNewSalesOrder, updateSalesOrder, toggleSOStatus, deleteSalesOrder,
      erpActivities, addErpActivity, updateErpActivity, deleteErpActivity, assignEmployeeToActivity, changeActivityStatus,
      users, addNewUser, updateUser, deleteUser,
      activityLogs, addNewActivityLog, updateActivityLog,
      metrics, productivityTrend, deptPerformance, userPerformance, recentActivity,
      currentUserRole, soPermissions
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
