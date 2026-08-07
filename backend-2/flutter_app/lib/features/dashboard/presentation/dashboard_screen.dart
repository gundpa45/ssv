import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router.dart';
import '../../auth/domain/auth_notifier.dart';
import '../../daily_report/domain/daily_report_notifier.dart';
import '../../daily_report/data/mock_data.dart';
import '../../history/domain/history_provider.dart';
import '../../notifications/domain/notifications_provider.dart';

/// The new home screen dashboard for the user.
/// Displays daily activity stats, pie chart, and the customized activity log list.
class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final authState = ref.watch(authProvider);
    final userName = (authState.firstName != null && authState.firstName!.isNotEmpty)
        ? "${authState.firstName} ${authState.lastName ?? ''}".trim()
        : (authState.employeeId ?? 'User');
    final employeeId = authState.employeeId ?? 'EMP001';

    final historyAsync = ref.watch(historyProvider);

    return Scaffold(
      body: SafeArea(
        child: historyAsync.when(
          data: (activities) {
            // Filter all statistics by logged-in user's employeeId
            final userActivities = activities.where((act) => act.workerEmployeeId == authState.employeeId).toList();

            // Filter daily list to only show today's activities (local device timezone)
            final now = DateTime.now();
            final todayLocal = DateTime(now.year, now.month, now.day);

            final todayActivities = userActivities.where((act) {
              final actDate = DateTime(act.submittedDate.year, act.submittedDate.month, act.submittedDate.day);
              return actDate.isAtSameMomentAs(todayLocal);
            }).toList();

            // Format date string
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            final dateStr = "${now.day.toString().padLeft(2, '0')} ${months[now.month - 1]} ${now.year} (Today)";

            // Calculate total minutes/hours
            final totalMinutes = todayActivities.fold(0, (sum, act) => sum + act.durationMinutes);
            final hrs = totalMinutes ~/ 60;
            final mins = totalMinutes % 60;
            final totalHoursStr = "${hrs.toString().padLeft(2, '0')}:${mins.toString().padLeft(2, '0')} hrs";

            return SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // ─── Header ───────────────────────────────────────────────────
                  _CustomHeader(userName: userName),
                  const SizedBox(height: 24),

                  // ─── Time Distribution Pie Chart ──────────────────────────────
                  Text(
                    'Time Distribution',
                    style: theme.textTheme.titleMedium?.copyWith(fontSize: 18),
                  ),
                  const SizedBox(height: 16),
                  _TimeDistributionPieCard(activities: todayActivities),
                  const SizedBox(height: 24),

                  // ─── Date & Employee Info Cards ───────────────────────────────
                  _HeaderCards(
                    dateStr: dateStr,
                    employeeName: userName,
                    employeeId: employeeId,
                  ),
                  const SizedBox(height: 24),

                  // ─── Activities Header Row ────────────────────────────────────
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Activities (${todayActivities.length})',
                        style: theme.textTheme.titleMedium?.copyWith(fontSize: 18),
                      ),
                      OutlinedButton.icon(
                        onPressed: () {
                          // Clear form state before adding new activity
                          ref.read(dailyReportProvider.notifier).selectSalesOrder(null);
                          context.push(AppRoutes.newActivity);
                        },
                        icon: const Icon(Icons.add, size: 16),
                        label: const Text('Add Activity'),
                        style: OutlinedButton.styleFrom(
                          side: BorderSide(color: theme.colorScheme.primary, width: 1.5),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                          foregroundColor: theme.colorScheme.primary,
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // ─── Today's Custom Activity Cards List ───────────────────────
                  if (todayActivities.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: theme.cardTheme.color ?? theme.colorScheme.surface,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        'No activities logged yet.',
                        style: TextStyle(color: theme.colorScheme.onSurface.withOpacity(0.54)),
                      ),
                    )
                  else
                    ...List.generate(todayActivities.length, (index) {
                      return _ActivityCard(
                        index: index + 1,
                        act: todayActivities[index],
                      );
                    }),
                  const SizedBox(height: 24),

                  // ─── Summary Stats Boxes ──────────────────────────────────────
                  _SummaryStats(
                    totalActivities: todayActivities.length,
                    totalHoursStr: totalHoursStr,
                  ),
                  const SizedBox(height: 24),

                  // ─── Bottom Actions ───────────────────────────────────────────
                  _BottomActionButtons(
                    onSaveDraft: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: const Text('Draft saved successfully!'),
                          behavior: SnackBarBehavior.floating,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          backgroundColor: theme.colorScheme.primary,
                        ),
                      );
                    },
                    onSubmit: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: const Text('Activity log submitted successfully!'),
                          behavior: SnackBarBehavior.floating,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          backgroundColor: theme.colorScheme.primary,
                        ),
                      );
                    },
                  ),
                ],
              ),
            );
          },
          loading: () => const Center(
            child: CircularProgressIndicator(),
          ),
          error: (err, stack) => Center(
            child: Text('Error loading dashboard: $err'),
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Custom Header
// ══════════════════════════════════════════════════════════════════════════
class _CustomHeader extends ConsumerWidget {
  const _CustomHeader({required this.userName});
  final String userName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final notificationsState = ref.watch(notificationsProvider);
    final unreadCount = notificationsState.notifications.where((n) => !n.isRead).length;

    return Row(
      children: [
        CircleAvatar(
          radius: 24,
          backgroundColor: theme.brightness == Brightness.dark
              ? Colors.grey.shade800
              : Colors.grey.shade300,
          backgroundImage: const NetworkImage('https://i.pravatar.cc/150?img=11'),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Welcome back',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.brightness == Brightness.dark
                      ? Colors.grey.shade400
                      : Colors.grey.shade600,
                  fontSize: 14,
                ),
              ),
              Text(
                userName,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontSize: 18,
                ),
              ),
            ],
          ),
        ),
        Stack(
          clipBehavior: Clip.none,
          children: [
            IconButton(
              icon: const Icon(Icons.notifications_none),
              color: theme.colorScheme.onSurface,
              onPressed: () => context.push(AppRoutes.notifications),
            ),
            if (unreadCount > 0)
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: Color(0xFFFF735D), // Coral
                    shape: BoxShape.circle,
                  ),
                  constraints: const BoxConstraints(
                    minWidth: 16,
                    minHeight: 16,
                  ),
                  child: Text(
                    '$unreadCount',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Time Distribution Pie Chart (fl_chart)
// ══════════════════════════════════════════════════════════════════════════
class _TimeDistributionPieCard extends StatelessWidget {
  const _TimeDistributionPieCard({required this.activities});
  final List<SubmittedReport> activities;

  List<PieChartSectionData> _getPieSections(List<SubmittedReport> list, ThemeData theme) {
    if (list.isEmpty) {
      return [
        PieChartSectionData(
          color: theme.brightness == Brightness.dark ? Colors.grey.shade800 : Colors.grey.shade300,
          value: 100,
          title: '',
          radius: 35,
        ),
      ];
    }

    final Map<String, double> deptDurations = {};
    double totalDuration = 0;
    for (final act in list) {
      final dept = act.department.isEmpty ? 'Other' : act.department;
      final duration = act.durationMinutes.toDouble();
      deptDurations[dept] = (deptDurations[dept] ?? 0.0) + duration;
      totalDuration += duration;
    }

    if (totalDuration == 0) {
      return [
        PieChartSectionData(
          color: theme.brightness == Brightness.dark ? Colors.grey.shade800 : Colors.grey.shade300,
          value: 100,
          title: '',
          radius: 35,
        )
      ];
    }

    final colors = [
      const Color(0xFF5C7862),
      const Color(0xFFFF735D),
      Colors.blueAccent,
      Colors.amber,
      Colors.purple,
      Colors.teal,
    ];

    int colorIdx = 0;
    return deptDurations.entries.map((entry) {
      final pct = (entry.value / totalDuration) * 100;
      final color = colors[colorIdx % colors.length];
      colorIdx++;
      return PieChartSectionData(
        color: color,
        value: pct,
        title: '${pct.toStringAsFixed(0)}%',
        radius: 35,
        titleStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
      );
    }).toList();
  }

  Widget _buildLegend(List<SubmittedReport> list, ThemeData theme) {
    if (list.isEmpty) {
      return Center(
        child: Text(
          'No activities logged today',
          style: TextStyle(
            color: theme.brightness == Brightness.dark ? Colors.grey.shade400 : Colors.grey.shade600,
            fontSize: 13,
            fontStyle: FontStyle.italic,
          ),
          textAlign: TextAlign.center,
        ),
      );
    }

    final Map<String, double> deptDurations = {};
    for (final act in list) {
      final dept = act.department.isEmpty ? 'Other' : act.department;
      deptDurations[dept] = (deptDurations[dept] ?? 0.0) + act.durationMinutes.toDouble();
    }

    final colors = [
      const Color(0xFF5C7862),
      const Color(0xFFFF735D),
      Colors.blueAccent,
      Colors.amber,
      Colors.purple,
      Colors.teal,
    ];

    int colorIdx = 0;
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: deptDurations.keys.map((dept) {
        final color = colors[colorIdx % colors.length];
        colorIdx++;
        return Padding(
          padding: const EdgeInsets.only(bottom: 8.0),
          child: _LegendItem(color: color, text: dept),
        );
      }).toList(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final sections = _getPieSections(activities, theme);

    return Container(
      height: 200,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.cardTheme.color ?? theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: theme.brightness == Brightness.dark ? Colors.grey.shade800 : Colors.grey.shade200,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 1,
            child: PieChart(
              PieChartData(
                sectionsSpace: 2,
                centerSpaceRadius: 30,
                sections: sections,
              ),
            ),
          ),
          const SizedBox(width: 16),
          // Legend
          Expanded(
            flex: 1,
            child: _buildLegend(activities, theme),
          )
        ],
      ),
    );
  }
}

class _LegendItem extends StatelessWidget {
  const _LegendItem({required this.color, required this.text});
  final Color color;
  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Container(width: 12, height: 12, decoration: BoxDecoration(shape: BoxShape.circle, color: color)),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: theme.colorScheme.onSurface.withOpacity(0.8),
              fontSize: 13,
            ),
          ),
        ),
      ],
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Header Cards (Date & Employee)
// ══════════════════════════════════════════════════════════════════════════
class _HeaderCards extends StatelessWidget {
  const _HeaderCards({
    required this.dateStr,
    required this.employeeName,
    required this.employeeId,
  });

  final String dateStr;
  final String employeeName;
  final String employeeId;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Row(
      children: [
        // Date card
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF262628) : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isDark ? Colors.grey.shade800 : Colors.grey.shade200,
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.calendar_today_outlined,
                    color: theme.colorScheme.primary,
                    size: 16,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Date',
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark ? Colors.grey.shade500 : Colors.grey.shade600,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        dateStr,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: theme.colorScheme.primary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        // Employee card
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF262628) : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isDark ? Colors.grey.shade800 : Colors.grey.shade200,
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.person_outline,
                    color: theme.colorScheme.primary,
                    size: 16,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Employee',
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark ? Colors.grey.shade500 : Colors.grey.shade600,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        "$employeeName ($employeeId)",
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: theme.colorScheme.primary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Custom Activity Card
// ══════════════════════════════════════════════════════════════════════════
class _ActivityCard extends ConsumerWidget {
  const _ActivityCard({
    required this.index,
    required this.act,
  });

  final int index;
  final SubmittedReport act;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    // Status colors
    Color statusBgColor;
    Color statusTextColor;
    switch (act.status.toLowerCase()) {
      case 'approved':
      case 'completed':
        statusBgColor = isDark ? const Color(0xFF1B5E20).withOpacity(0.2) : const Color(0xFFE8F5E9);
        statusTextColor = isDark ? const Color(0xFF81C784) : const Color(0xFF2E7D32);
        break;
      case 'rework assigned':
        statusBgColor = isDark ? const Color(0xFFB71C1C).withOpacity(0.2) : const Color(0xFFFFEBEE);
        statusTextColor = isDark ? const Color(0xFFE57373) : const Color(0xFFC62828);
        break;
      case 'pending':
      case 'in progress':
      default:
        statusBgColor = isDark ? const Color(0xFF0D47A1).withOpacity(0.2) : const Color(0xFFE3F2FD);
        statusTextColor = isDark ? const Color(0xFF64B5F6) : const Color(0xFF1565C0);
        break;
    }

    final hrs = act.durationMinutes ~/ 60;
    final mins = act.durationMinutes % 60;
    final durationStr = "${hrs.toString().padLeft(2, '0')}:${mins.toString().padLeft(2, '0')} hrs";

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF262628) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.grey.shade800 : Colors.grey.shade200,
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Header Row ──────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Index badge
                Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    '$index',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                // Sales Order
                Expanded(
                  child: Text(
                    act.salesOrder.isNotEmpty ? act.salesOrder : 'SO-No-Label',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
                // Status Badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusBgColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    act.status,
                    style: TextStyle(
                      color: statusTextColor,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                // Edit
                IconButton(
                  icon: const Icon(Icons.edit_outlined, size: 20),
                  onPressed: () {
                    ref.read(dailyReportProvider.notifier).loadReportForRework(act);
                    context.push(AppRoutes.newActivity);
                  },
                  constraints: const BoxConstraints(),
                  padding: EdgeInsets.zero,
                  visualDensity: VisualDensity.compact,
                ),
                const SizedBox(width: 8),
                // Delete
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: const Text('Delete Activity'),
                        content: const Text('Are you sure you want to delete this activity log?'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context),
                            child: const Text('Cancel'),
                          ),
                          TextButton(
                            onPressed: () {
                              mockSubmittedReports.removeWhere((r) => r.reportId == act.reportId);
                              ref.invalidate(historyProvider);
                              Navigator.pop(context);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Activity deleted.')),
                              );
                            },
                            child: const Text('Delete', style: TextStyle(color: Colors.redAccent)),
                          ),
                        ],
                      ),
                    );
                  },
                  constraints: const BoxConstraints(),
                  padding: EdgeInsets.zero,
                  visualDensity: VisualDensity.compact,
                ),
              ],
            ),
          ),
          
          Divider(color: isDark ? Colors.grey.shade800 : Colors.grey.shade100, height: 1),

          // ── Department & Activity Row ───────────────────────────────
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: _DetailItem(
                    icon: Icons.business_outlined,
                    label: 'Department',
                    value: act.department,
                  ),
                ),
                Expanded(
                  child: _DetailItem(
                    icon: Icons.task_alt_outlined,
                    label: 'Activity',
                    value: act.activity,
                  ),
                ),
              ],
            ),
          ),

          Divider(color: isDark ? Colors.grey.shade800 : Colors.grey.shade100, height: 1),

          // ── Time Slot & Duration Row ────────────────────────────────
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: _DetailItem(
                    icon: Icons.access_time_outlined,
                    label: 'Time Slot',
                    value: "${act.startTime} - ${act.endTime}",
                  ),
                ),
                Expanded(
                  child: _DetailItem(
                    icon: Icons.hourglass_empty_outlined,
                    label: 'Duration',
                    value: durationStr,
                  ),
                ),
              ],
            ),
          ),

          Divider(color: isDark ? Colors.grey.shade800 : Colors.grey.shade100, height: 1),

          // ── Review / Remarks Row ────────────────────────────────────
          Padding(
            padding: const EdgeInsets.all(16),
            child: _DetailItem(
              icon: Icons.comment_outlined,
              label: 'Review / Remarks',
              value: (act.remarks != null && act.remarks!.isNotEmpty)
                  ? act.remarks!
                  : (act.otherActivityReason != null && act.otherActivityReason!.isNotEmpty
                      ? act.otherActivityReason!
                      : 'No remarks entered.'),
            ),
          ),

          Divider(color: isDark ? Colors.grey.shade800 : Colors.grey.shade100, height: 1),

          // ── Coworker Present Row ────────────────────────────────────
          Padding(
            padding: const EdgeInsets.all(16),
            child: _DetailItem(
              icon: Icons.people_outline,
              label: 'Coworker Present',
              value: (act.coworkerName != null && act.coworkerName!.isNotEmpty)
                  ? "Yes • ${act.coworkerName} (${act.coworkerId})"
                  : "No",
              valueColor: (act.coworkerName != null && act.coworkerName!.isNotEmpty)
                  ? Colors.green
                  : Colors.redAccent,
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailItem extends StatelessWidget {
  const _DetailItem({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          icon,
          size: 16,
          color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  color: isDark ? Colors.grey.shade500 : Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: valueColor ?? (isDark ? Colors.white : Colors.black87),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Summary Stats Row
// ══════════════════════════════════════════════════════════════════════════
class _SummaryStats extends StatelessWidget {
  const _SummaryStats({
    required this.totalActivities,
    required this.totalHoursStr,
  });

  final int totalActivities;
  final String totalHoursStr;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Row(
      children: [
        // Total Activities
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF262628) : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isDark ? Colors.grey.shade800 : Colors.grey.shade200,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.list_alt,
                  color: theme.colorScheme.primary,
                  size: 24,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Total Activities',
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark ? Colors.grey.shade500 : Colors.grey.shade600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '$totalActivities',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white : Colors.black87,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        // Total Working Hours
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF262628) : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isDark ? Colors.grey.shade800 : Colors.grey.shade200,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.hourglass_empty,
                  color: theme.colorScheme.primary,
                  size: 24,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Total Working Hours',
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark ? Colors.grey.shade500 : Colors.grey.shade600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        totalHoursStr,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white : Colors.black87,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Bottom Action Buttons (Save Draft & Submit)
// ══════════════════════════════════════════════════════════════════════════
class _BottomActionButtons extends StatelessWidget {
  const _BottomActionButtons({
    required this.onSaveDraft,
    required this.onSubmit,
  });

  final VoidCallback onSaveDraft;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      children: [
        // Save Draft
        Expanded(
          child: OutlinedButton.icon(
            onPressed: onSaveDraft,
            icon: Icon(
              Icons.save_outlined,
              color: theme.colorScheme.primary,
            ),
            label: const Text('Save Draft'),
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: theme.colorScheme.primary, width: 1.5),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              foregroundColor: theme.colorScheme.primary,
              textStyle: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        // Submit Activity Log
        Expanded(
          child: ElevatedButton.icon(
            onPressed: onSubmit,
            icon: const Icon(
              Icons.send_rounded,
              color: Colors.white,
            ),
            label: const Text('Submit Activity Log'),
            style: ElevatedButton.styleFrom(
              backgroundColor: theme.colorScheme.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              textStyle: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
