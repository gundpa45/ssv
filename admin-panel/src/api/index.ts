/**
 * api/index.ts
 * Central export barrel — import everything from here
 *
 * Usage:
 *   import { authApi, usersApi, departmentsApi, rolesApi } from '../api';
 *
 * ─── Backend: d:\ME\Intern\project\1-copy  (NestJS, port 3000) ───
 * ─── Prefix: /api/v1 ─────────────────────────────────────────────
 */

export { apiClient } from './client';
export { authApi } from './auth';
export { usersApi } from './users';
export { rolesApi } from './roles';
export { activitiesApi } from './activities';
export { departmentsApi } from './departments';
export { salesOrdersApi } from './salesOrders';
export { activityLogsApi } from './activityLogs';
export { notificationsApi } from './notifications';
export { dashboardApi } from './dashboard';

// Type exports
export type { LoginResponse, LoginPayload } from './auth';
export type { ApiUser, CreateUserPayload, UpdateUserPayload } from './users';
export type { ApiRole } from './roles';
export type { ApiActivity, CreateActivityPayload } from './activities';
export type { ApiDepartment, CreateDepartmentPayload } from './departments';
export type { ApiSalesOrder, CreateSOPayload, UpdateSOPayload } from './salesOrders';
export type { ApiActivityLog, CreateActivityLogPayload, UpdateActivityLogPayload } from './activityLogs';
export type { ApiNotification } from './notifications';
export type { DashboardSummary } from './dashboard';

