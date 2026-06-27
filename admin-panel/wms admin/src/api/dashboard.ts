/**
 * api/dashboard.ts
 * Dashboard summary endpoint
 * Backend: GET /api/v1/dashboard/summary
 */

import { apiClient } from './client';

export interface DashboardSummary {
  totalUsers: number;
  activeUsers: number;
  workingUsers: number;
  idleUsers: number;
  activitiesToday: number;
  completedActivities: number;
  pendingActivities: number;
  averageProductivity: number;
}

export const dashboardApi = {
  getSummary: () =>
    apiClient.get<DashboardSummary>('/dashboard/summary'),
};
