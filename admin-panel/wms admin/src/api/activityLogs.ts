/**
 * api/activityLogs.ts
 * Activity Log endpoints
 * Backend: /api/v1/activity-logs
 *
 * CreateActivityLogDto: soId, departmentId, activityId, durationMinutes,
 *                       remarks?, coworkerEmployeeIds?, startTime?, endTime?
 */

import { apiClient } from './client';

export interface ApiActivityLog {
  id: string;
  userId: string;
  soId: string;
  departmentId: string;
  activityId: string;
  activityDate: string;
  status: string;            // ActivityStatus: PENDING | IN_PROGRESS | COMPLETED | REWORK_ASSIGNED
  remarks?: string;
  isRework?: boolean;
  managerRemarks?: string;
  createdAt?: string;
  updatedAt?: string;
  // Joined fields
  user?: { firstName: string; lastName: string; employeeId: string };
  SalesOrder?: { soNumber: string };
  department?: { name: string };
  activity?: { activityName: string; standardManMinutes: number };
  slots?: { id: string; startTime: string; endTime: string; durationMinutes: number }[];
}

// POST /activity-logs — exactly matches CreateActivityLogDto
export interface CreateActivityLogPayload {
  soId: string;
  departmentId: string;
  activityId: string;
  durationMinutes: number;
  remarks?: string;
  coworkerEmployeeIds?: string[];   // ← backend field name
  startTime?: string;
  endTime?: string;
}

// PATCH /activity-logs/:id — matches UpdateActivityLogDto
export interface UpdateActivityLogPayload {
  status?: string;
  remarks?: string;
  isRework?: boolean;
  managerRemarks?: string;
  durationMinutes?: number;
  coworkerEmployeeIds?: string[];
}

export const activityLogsApi = {
  getAll: () =>
    apiClient.get<ApiActivityLog[]>('/activity-logs'),

  create: (payload: CreateActivityLogPayload) =>
    apiClient.post<ApiActivityLog>('/activity-logs', payload),

  update: (id: string, payload: UpdateActivityLogPayload) =>
    apiClient.patch<ApiActivityLog>(`/activity-logs/${id}`, payload),
};

