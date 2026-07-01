/**
 * api/users.ts
 * User CRUD endpoints
 * Backend: /api/v1/users
 *
 * Backend fields use: employeeId, firstName, lastName (NOT adminName/userId/name)
 */

import { apiClient } from './client';

// Shape returned by GET /users and GET /users/:id
export interface ApiUser {
  id: string;
  employeeId: string;        // ← "employeeId" (e.g. "EMP-001")
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string;
  status: string;            // EmployeeStatus enum: ACTIVE | INACTIVE | ON_LEAVE | RESIGNED | SUSPENDED
  role: string;              // role name string (from include: { role: true })
  isActive: boolean;
  createdAt?: string;
}

// POST /users body — matches CreateUserDto
export interface CreateUserPayload {
  employeeId: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string;
  roleId: string;            // UUID of the Role
}

// PATCH /users/:id body — matches UpdateUserDto
export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  mobile?: string;
  email?: string;
  status?: string;
  isActive?: boolean;
  roleId?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const usersApi = {
  getAll: () =>
    apiClient.get<ApiUser[]>('/users'),

  getById: (id: string) =>
    apiClient.get<ApiUser>(`/users/${id}`),

  create: (payload: CreateUserPayload) =>
    apiClient.post<{ message: string; generatedPassword: string; user: ApiUser }>('/users', payload),

  update: (id: string, payload: UpdateUserPayload) =>
    apiClient.patch<{ message: string; user: ApiUser }>(`/users/${id}`, payload),

  changePassword: (id: string, payload: ChangePasswordPayload) =>
    apiClient.patch<{ message: string }>(`/users/${id}/change-password`, payload),

  delete: (id: string) =>
    apiClient.delete<{ message: string }>(`/users/${id}`),
};

