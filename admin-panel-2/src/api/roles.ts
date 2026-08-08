/**
 * api/roles.ts
 * Roles endpoints
 * Backend: GET /api/v1/roles  (JWT protected, returns active non-deleted roles)
 */

import { apiClient } from './client';

export interface ApiRole {
  id: string;
  name: string;
}

export const rolesApi = {
  getAll: () =>
    apiClient.get<ApiRole[]>('/roles'),
};
