/**
 * api/notifications.ts
 * Notification endpoints
 * Backend: /api/v1/notifications
 *
 * GET  /notifications           → user's notifications (JWT - reads from req.user.userId)
 * PATCH /notifications/:id/read → mark one as read
 * POST /notifications/read-all  → mark all as read
 */

import { apiClient } from './client';

export interface ApiNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  referenceId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = {
  getAll: () =>
    apiClient.get<ApiNotification[]>('/notifications'),

  markRead: (id: string) =>
    apiClient.patch<{ message: string }>(`/notifications/${id}/read`, {}),

  markAllRead: () =>
    apiClient.post<{ message: string }>('/notifications/read-all', {}),
};
