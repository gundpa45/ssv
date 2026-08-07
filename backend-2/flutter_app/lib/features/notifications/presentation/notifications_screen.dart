import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../domain/notifications_provider.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  Color _getNotificationColor(String type) {
    switch (type.toUpperCase()) {
      case 'APPROVED':
        return const Color(0xFF5C7862); // Sage green
      case 'REWORK':
        return const Color(0xFFFF735D); // Coral
      default:
        return Colors.blueGrey;
    }
  }

  IconData _getNotificationIcon(String type) {
    switch (type.toUpperCase()) {
      case 'APPROVED':
        return Icons.check_circle_outline_rounded;
      case 'REWORK':
        return Icons.warning_amber_rounded;
      default:
        return Icons.notifications_active_outlined;
    }
  }

  String _formatTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else {
      return '${difference.inDays}d ago';
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final state = ref.watch(notificationsProvider);
    final notifier = ref.read(notificationsProvider.notifier);

    final unreadCount = state.notifications.where((n) => !n.isRead).length;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Notification Center'),
        elevation: 0,
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => context.pop(),
        ),
        actions: [
          if (unreadCount > 0)
            TextButton.icon(
              icon: const Icon(Icons.done_all_rounded, size: 18),
              label: const Text('Read all'),
              style: TextButton.styleFrom(
                foregroundColor: theme.colorScheme.primary,
              ),
              onPressed: () => notifier.markAllAsRead(),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => notifier.fetchNotifications(),
        color: theme.colorScheme.primary,
        child: state.isLoading && state.notifications.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : state.notifications.isEmpty
                ? _buildEmptyState(context)
                : _buildNotificationsList(context, state.notifications, notifier),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.notifications_none_rounded,
                size: 80,
                color: theme.colorScheme.onSurface.withOpacity(0.2),
              ),
              const SizedBox(height: 16),
              Text(
                'All caught up!',
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.onSurface.withOpacity(0.8),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'You will see notifications here when a manager reviews your logged activities.',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurface.withOpacity(0.5),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNotificationsList(
    BuildContext context,
    List<AppNotification> list,
    NotificationsNotifier notifier,
  ) {
    final theme = Theme.of(context);
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final item = list[index];
        final typeColor = _getNotificationColor(item.type);
        final icon = _getNotificationIcon(item.type);
        final timeText = _formatTimeAgo(item.createdAt);

        return GestureDetector(
          onTap: () {
            if (!item.isRead) {
              notifier.markAsRead(item.id);
            }
            // Show detailed alert modal
            showDialog(
              context: context,
              builder: (ctx) => AlertDialog(
                backgroundColor: theme.cardTheme.color ?? theme.colorScheme.surface,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
                title: Row(
                  children: [
                    Icon(icon, color: typeColor),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        item.title,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                content: Text(
                  item.message,
                  style: theme.textTheme.bodyMedium?.copyWith(fontSize: 15),
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.of(ctx).pop(),
                    child: const Text('Close'),
                  ),
                ],
              ),
            );
          },
          child: Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: item.isRead
                  ? (theme.cardTheme.color ?? theme.colorScheme.surface).withOpacity(0.6)
                  : (theme.cardTheme.color ?? theme.colorScheme.surface),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: item.isRead
                    ? Colors.transparent
                    : typeColor.withOpacity(0.4),
                width: 1.5,
              ),
              boxShadow: item.isRead
                  ? null
                  : [
                      BoxShadow(
                        color: typeColor.withOpacity(0.06),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: typeColor.withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    icon,
                    color: typeColor,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              item.title,
                              style: TextStyle(
                                color: theme.colorScheme.onSurface,
                                fontWeight: item.isRead ? FontWeight.w600 : FontWeight.bold,
                                fontSize: 15,
                              ),
                            ),
                          ),
                          Text(
                            timeText,
                            style: TextStyle(
                              color: theme.colorScheme.onSurface.withOpacity(0.4),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        item.message,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: theme.colorScheme.onSurface.withOpacity(item.isRead ? 0.5 : 0.75),
                          fontSize: 13.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
