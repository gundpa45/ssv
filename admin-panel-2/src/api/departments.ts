/**
 * api/departments.ts
 * Department CRUD endpoints
 * Backend: /api/v1/departments
 */

import { apiClient } from './client';

export interface ApiDepartment {
  id: string;
  name: string;
  status: string;
  description?: string;
  createdAt?: string;
  activities?: ApiDeptActivity[];
}

export interface ApiDeptActivity {
  id: string;
  name: string;
  standardMinutes: number;
  status: string;
}

export interface CreateDepartmentPayload {
  name: string;
  description?: string;
  status?: string;
}

export interface UpdateDepartmentPayload {
  name?: string;
  description?: string;
  status?: string;
}

export const departmentsApi = {
  getAll: () =>
    apiClient.get<ApiDepartment[]>('/departments'),

  getById: (id: string) =>
    apiClient.get<ApiDepartment>(`/departments/${id}`),

  create: (payload: CreateDepartmentPayload) =>
    apiClient.post<ApiDepartment>('/departments', payload),

  update: (id: string, payload: UpdateDepartmentPayload) =>
    apiClient.patch<ApiDepartment>(`/departments/${id}`, payload),

  delete: (id: string) =>
    apiClient.delete<{ message: string }>(`/departments/${id}`),
};
