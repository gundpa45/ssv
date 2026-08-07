import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

import '../../../app/config.dart';

class AppNotification {
  final String id;
  final String userId;
  final String title;
  final String message;
  final String type;
  final String? referenceId;
  final bool isRead;
  final DateTime createdAt;

  AppNotification({
    required this.id,
    required this.userId,
    required this.title,
    required this.message,
    required this.type,
    this.referenceId,
    required this.isRead,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id']?.toString() ?? '',
      userId: json['userId']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
      type: json['type']?.toString() ?? 'SYSTEM',
      referenceId: json['referenceId']?.toString(),
      isRead: json['isRead'] as bool? ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : DateTime.now(),
    );
  }

  AppNotification copyWith({
    String? id,
    String? userId,
    String? title,
    String? message,
    String? type,
    String? referenceId,
    bool? isRead,
    DateTime? createdAt,
  }) {
    return AppNotification(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      title: title ?? this.title,
      message: message ?? this.message,
      type: type ?? this.type,
      referenceId: referenceId ?? this.referenceId,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

class NotificationsState {
  final bool isLoading;
  final List<AppNotification> notifications;
  final String? error;

  NotificationsState({
    this.isLoading = false,
    this.notifications = const [],
    this.error,
  });

  NotificationsState copyWith({
    bool? isLoading,
    List<AppNotification>? notifications,
    String? error,
  }) {
    return NotificationsState(
      isLoading: isLoading ?? this.isLoading,
      notifications: notifications ?? this.notifications,
      error: error,
    );
  }
}

class NotificationsNotifier extends StateNotifier<NotificationsState> {
  NotificationsNotifier() : super(NotificationsState()) {
    fetchNotifications();
  }

  String? _getToken() {
    try {
      return Hive.box('authBox').get('token') as String?;
    } catch (_) {
      return null;
    }
  }

  Map<String, String> _getHeaders() {
    final token = _getToken();
    return (token != null && token.isNotEmpty)
        ? {'Authorization': 'Bearer $token'}
        : <String, String>{};
  }

  Future<void> fetchNotifications() async {
    state = state.copyWith(isLoading: true);
    try {
      final dio = Dio(BaseOptions(
        connectTimeout: const Duration(seconds: 45),
        receiveTimeout: const Duration(seconds: 45),
      ));

      final response = await dio.get(
        '${AppConfig.baseUrl}/notifications',
        options: Options(headers: _getHeaders()),
      );

      final data = response.data;
      if (data is List) {
        final list = data.map((json) => AppNotification.fromJson(json)).toList();
        state = state.copyWith(isLoading: false, notifications: list);
      } else {
        state = state.copyWith(isLoading: false, error: 'Invalid response type');
      }
    } catch (e) {
      debugPrint('Error fetching notifications: $e');
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      // Optimistic update
      final updated = state.notifications.map((n) {
        if (n.id == id) {
          return n.copyWith(isRead: true);
        }
        return n;
      }).toList();
      state = state.copyWith(notifications: updated);

      final dio = Dio();
      await dio.patch(
        '${AppConfig.baseUrl}/notifications/$id/read',
        options: Options(headers: _getHeaders()),
      );
    } catch (e) {
      debugPrint('Error marking notification as read: $e');
      // Re-fetch in case of failure to align state
      fetchNotifications();
    }
  }

  Future<void> markAllAsRead() async {
    try {
      // Optimistic update
      final updated = state.notifications.map((n) {
        return n.copyWith(isRead: true);
      }).toList();
      state = state.copyWith(notifications: updated);

      final dio = Dio();
      await dio.post(
        '${AppConfig.baseUrl}/notifications/read-all',
        options: Options(headers: _getHeaders()),
      );
    } catch (e) {
      debugPrint('Error marking all notifications as read: $e');
      fetchNotifications();
    }
  }
}

final notificationsProvider =
    StateNotifierProvider<NotificationsNotifier, NotificationsState>((ref) {
  return NotificationsNotifier();
});
