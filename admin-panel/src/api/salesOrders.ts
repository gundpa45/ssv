/**
 * api/salesOrders.ts
 * Sales Order CRUD + reporting endpoints
 * Backend: /api/v1/sales-orders
 */

import { apiClient } from './client';

export interface ApiSalesOrder {
  id: string;
  soNumber: string;
  customerName: string;
  projectName: string;
  startDate: string;
  endDate: string;
  description?: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Delayed';
  isActive: boolean;
  allowedDepartments?: string[];
  allowedActivities?: string[];
}

export interface CreateSOPayload {
  soNumber: string;
  customerName: string;
  projectName: string;
  startDate: string;
  endDate: string;
  description?: string;
  status?: string;
}

export interface UpdateSOPayload {
  customerName?: string;
  projectName?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  status?: string;
  isActive?: boolean;
}

export interface UpdateSODepartmentsPayload {
  departmentIds: string[];
  activityIds?: string[];
}

export const salesOrdersApi = {
  getAll: () =>
    apiClient.get<ApiSalesOrder[]>('/sales-orders'),

  getById: (id: string) =>
    apiClient.get<ApiSalesOrder>(`/sales-orders/${id}`),

  create: (payload: CreateSOPayload) =>
    apiClient.post<ApiSalesOrder>('/sales-orders', payload),

  update: (id: string, payload: UpdateSOPayload) =>
    apiClient.patch<ApiSalesOrder>(`/sales-orders/${id}`, payload),

  delete: (id: string) =>
    apiClient.delete<{ message: string }>(`/sales-orders/${id}`),

  updateDepartments: (id: string, payload: UpdateSODepartmentsPayload) =>
    apiClient.put<ApiSalesOrder>(`/sales-orders/${id}/departments`, payload),

  getDepartmentsBySO: (id: string) =>
    apiClient.get<ApiSalesOrder['allowedDepartments']>(`/sales-orders/${id}/departments`),

  getActivitiesBySODept: (soId: string, deptId: string) =>
    apiClient.get<{ id: string; name: string }[]>(`/sales-orders/${soId}/departments/${deptId}/activities`),

  getOtherActivitiesBySODept: (soId: string, deptId: string) =>
    apiClient.get<{ id: string; name: string }[]>(`/sales-orders/${soId}/departments/${deptId}/other-activities`),

  // Reports
  getSummaryReport: (filters?: Record<string, string>) =>
    apiClient.get<unknown>('/sales-orders/reports/summary', filters),

  getDeptWiseReport: (soId: string, filters?: Record<string, string>) =>
    apiClient.get<unknown>(`/sales-orders/${soId}/reports/department-wise`, filters),

  getEmployeeWiseReport: (soId: string, filters?: Record<string, string>) =>
    apiClient.get<unknown>(`/sales-orders/${soId}/reports/employee-wise`, filters),
};
