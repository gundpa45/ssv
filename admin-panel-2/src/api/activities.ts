/**
 * api/activities.ts
 * Activities endpoints (department-level activities catalog)
 * Backend: /api/v1/activities
 *
 * GET  /activities       → all activities with department info
 * POST /activities       → create new activity (Admin only)
 */

import { apiClient } from './client';

export interface ApiActivity {
  id: string;
  activityName: string;
  standardManMinutes: number;
  departmentId: string;
  department?: { id: string; name: string; code: string };
  restrictedRoleId?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface CreateActivityPayload {
  activityName: string;
  standardManMinutes: number;
  departmentId: string;
  restrictedRoleId?: string;
}

export const activitiesApi = {
  getAll: () =>
    apiClient.get<ApiActivity[]>('/activities'),

  create: (payload: CreateActivityPayload) =>
    apiClient.post<ApiActivity>('/activities', payload),
};
