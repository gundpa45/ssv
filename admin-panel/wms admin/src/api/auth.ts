/**
 * api/auth.ts
 * Auth endpoints — login, profile
 * Backend: POST /api/v1/auth/login
 *
 * Backend LoginDto expects:  { employeeId: string, password: string }
 * Backend AuthResponseDto returns: { accessToken, employeeId, firstName, lastName, role }
 */

import { apiClient } from './client';

export interface LoginResponse {
  accessToken: string;       // ← backend returns "accessToken" not "access_token"
  employeeId: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface LoginPayload {
  employeeId: string;        // ← backend field is "employeeId" not "userId"
  password: string;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<LoginResponse>('/auth/login', payload),

  getProfile: () =>
    apiClient.get<{ user: LoginResponse }>('/auth/profile'),
};

