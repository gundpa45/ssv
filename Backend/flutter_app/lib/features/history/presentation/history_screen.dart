import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../daily_report/data/mock_data.dart';
import '../../daily_report/domain/daily_report_notifier.dart';
import '../../daily_report/domain/daily_report_state.dart';
import '../domain/history_provider.dart';
import '../../../app/router.dart';
import '../../auth/domain/auth_notifier.dart';

/// Screen for viewing previously submitted activity reports.
///
/// Features:
/// - Reactive reports list using [historyProvider]
/// - Dynamic status-based filtering (All, Approved, Pending, Rework Assigned)
/// - Premium dark theme visual aesthetics consistent with dashboard
/// - Expandable detail cards showing duration, coworker support, and warnings
/// - Tap to rework assignment flow (sends user back to Daily Log tab)
class HistoryScreen extends ConsumerStatefulWidget {
  const HistoryScreen({super.key});

  @override
  ConsumerState<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends ConsumerState<HistoryScreen> {
  String _selectedFilter = 'All';
  final Set<String> _expandedIds = {};

  final List<String> _filters = ['All', 'Approved', 'Pending', 'Rework Assigned'];

  void _toggleExpanded(String id) {
    setState(() {
      if (_expandedIds.contains(id)) {
        _expandedIds.remove(id);
      } else {
        _expandedIds.add(id);
      }
    });
  }

  IconData _getIconForActivity(String title) {
    final lowercaseTitle = title.toLowerCase();
    if (lowercaseTitle.contains('assembly') || lowercaseTitle.contains('harness')) {
      return Icons.precision_manufacturing;
    } else if (lowercaseTitle.contains('inspect') || lowercaseTitle.contains('check') || lowercaseTitle.contains('quality')) {
      return Icons.fact_check;
    } else if (lowercaseTitle.contains('maintenance') || lowercaseTitle.contains('cleanup') || lowercaseTitle.contains('calibration')) {
      return Icons.build;
    } else if (lowercaseTitle.contains('prep') || lowercaseTitle.contains('sanding') || lowercaseTitle.contains('paint')) {
      return Icons.brush;
    }
    return Icons.assignment_outlined;
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Approved':
        return const Color(0xFF5C7862); // Sage green
      case 'Rework Assigned':
        return const Color(0xFFFF735D); // Coral / Red
      case 'Pending':
      default:
        return Colors.blueGrey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'Approved':
        return Icons.check_circle_outlined;
      case 'Rework Assigned':
        return Icons.warning_amber_rounded;
      case 'Pending':
      default:
        return Icons.schedule_outlined;
    }
  }

  Color _getProductivityColor(double percent) {
    if (percent >= 90) return const Color(0xFF2E7D32); // green
    if (percent >= 70) return const Color(0xFFF57F17); // amber
    return const Color(0xFFC62828); // red
  }

  String _formatDate(DateTime date) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final historyAsync = ref.watch(historyProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Activity History'),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: Column(
          children: [
            // ─── Filter Section ──────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _filters.map((filter) {
                    final isSelected = _selectedFilter == filter;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: ChoiceChip(
                        label: Text(
                          filter,
                          style: TextStyle(
                            color: isSelected ? Colors.black : Colors.white70,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                        selected: isSelected,
                        onSelected: (selected) {
                          if (selected) {
                            setState(() {
                              _selectedFilter = filter;
                            });
                          }
                        },
                        selectedColor: theme.colorScheme.primary,
                        backgroundColor: const Color(0xFF262628),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                        showCheckmark: false,
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
            const SizedBox(height: 12),

            // ─── Content List ───────────────────────────────────────────────
            Expanded(
              child: historyAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, _) => Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32.0),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.cloud_off_outlined,
                          size: 64,
                          color: theme.colorScheme.error.withOpacity(0.5),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Could not load history.',
                          style: theme.textTheme.titleMedium?.copyWith(
                            color: theme.colorScheme.onSurface.withOpacity(0.7),
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 12),
                        TextButton.icon(
                          onPressed: () => ref.invalidate(historyProvider),
                          icon: const Icon(Icons.refresh),
                          label: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
                data: (reports) {
                  // Apply user and status filtering logic
                  final authState = ref.watch(authProvider);
                  final filteredReports = reports.where((report) {
                    if (report.workerEmployeeId != authState.employeeId) return false;
                    if (_selectedFilter == 'All') return true;
                    return report.status == _selectedFilter;
                  }).toList();

                  if (filteredReports.isEmpty) {
                    return _buildEmptyState(theme);
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                    itemCount: filteredReports.length,
                    itemBuilder: (context, index) {
                      final report = filteredReports[index];
                      final isExpanded = _expandedIds.contains(report.reportId);
                      final statusColor = _getStatusColor(report.status);
                      final statusIcon = _getStatusIcon(report.status);
                      final icon = _getIconForActivity(report.activity);
                      final isRework = report.status == 'Rework Assigned';

                      final cardChild = Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF262628),
                          borderRadius: BorderRadius.circular(16),
                          border: isRework
                              ? Border.all(color: const Color(0xFFFF735D).withOpacity(0.4), width: 1.2)
                              : null,
                        ),
                        child: InkWell(
                          onTap: isRework
                              ? null // Rework wraps in GestureDetector for navigation
                              : () => _toggleExpanded(report.reportId),
                          borderRadius: BorderRadius.circular(16),
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // --- Top Row: Icon + Title & Department + Status Badge ---
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: statusColor.withOpacity(0.15),
                                        shape: BoxShape.circle,
                                      ),
                                      child: Icon(
                                        icon,
                                        color: statusColor,
                                        size: 24,
                                      ),
                                    ),
                                    const SizedBox(width: 16),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            report.activity,
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 16,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            report.department,
                                            style: TextStyle(
                                              color: theme.colorScheme.primary.withOpacity(0.8),
                                              fontWeight: FontWeight.w500,
                                              fontSize: 12,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    // Status Badge
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: statusColor.withOpacity(0.15),
                                        borderRadius: BorderRadius.circular(20),
                                        border: Border.all(color: statusColor.withOpacity(0.3), width: 1),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            statusIcon,
                                            color: statusColor,
                                            size: 14,
                                          ),
                                          const SizedBox(width: 6),
                                          Text(
                                            report.status,
                                            style: TextStyle(
                                              color: statusColor,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 11,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                // --- Middle Row: Time Info + Expand Arrow ---
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Row(
                                      children: [
                                        Icon(
                                          Icons.access_time_filled_rounded,
                                          size: 14,
                                          color: Colors.grey.shade500,
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          '${_formatDate(report.submittedDate)}  •  ${report.startTime} - ${report.endTime}',
                                          style: TextStyle(
                                            color: Colors.grey.shade400,
                                            fontSize: 13,
                                          ),
                                        ),
                                      ],
                                    ),
                                    if (!isRework)
                                      Icon(
                                        isExpanded
                                            ? Icons.keyboard_arrow_up_rounded
                                            : Icons.keyboard_arrow_down_rounded,
                                        color: Colors.grey.shade500,
                                      ),
                                  ],
                                ),
                                // --- Expandable Details Container ---
                                AnimatedSize(
                                  duration: const Duration(milliseconds: 200),
                                  curve: Curves.easeInOut,
                                  child: (isExpanded || isRework)
                                      ? Container(
                                          margin: const EdgeInsets.only(top: 16),
                                          padding: const EdgeInsets.only(top: 16),
                                          decoration: BoxDecoration(
                                            border: Border(
                                              top: BorderSide(color: Colors.grey.shade800, width: 1),
                                            ),
                                          ),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              // Sales Order
                                              _buildDetailRow(
                                                context,
                                                'Sales Order ID',
                                                report.salesOrder,
                                                Icons.receipt_long_outlined,
                                              ),
                                              const SizedBox(height: 10),
                                              // Activity ID
                                              _buildDetailRow(
                                                context,
                                                'Activity ID',
                                                report.activityId,
                                                Icons.tag_rounded,
                                              ),
                                              const SizedBox(height: 10),
                                              // Coworker
                                              if (report.coworkerName != null && report.coworkerName!.isNotEmpty) ...[
                                                _buildDetailRow(
                                                  context,
                                                  'Coworker Support',
                                                  report.coworkerName!,
                                                  Icons.group_outlined,
                                                ),
                                                const SizedBox(height: 10),
                                              ],
                                              // Remarks
                                              if (report.remarks != null && report.remarks!.isNotEmpty) ...[
                                                _buildDetailRow(
                                                  context,
                                                  'Remarks',
                                                  report.remarks!,
                                                  Icons.comment_outlined,
                                                ),
                                                const SizedBox(height: 10),
                                              ],
                                              // Manager Remarks
                                              if (report.managerRemarks != null && report.managerRemarks!.isNotEmpty) ...[
                                                _buildDetailRow(
                                                  context,
                                                  'Manager Remarks',
                                                  report.managerRemarks!,
                                                  Icons.rate_review_outlined,
                                                ),
                                                const SizedBox(height: 10),
                                              ],
                                              // Warning banner for other activities
                                              if (report.otherActivityReason != null && report.otherActivityReason!.isNotEmpty) ...[
                                                _buildWarningBlock(
                                                  context,
                                                  report.otherActivityReason!,
                                                ),
                                                const SizedBox(height: 12),
                                              ],
                                              // Duration & Productivity Details
                                              const SizedBox(height: 6),
                                              Row(
                                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                children: [
                                                  Text(
                                                    'Duration: ${report.durationMinutes} min',
                                                    style: const TextStyle(
                                                      color: Colors.white70,
                                                      fontSize: 13,
                                                    ),
                                                  ),
                                                  Text(
                                                    'Productivity: ${report.productivityPercent.toStringAsFixed(1)}%',
                                                    style: TextStyle(
                                                      color: _getProductivityColor(report.productivityPercent),
                                                      fontWeight: FontWeight.bold,
                                                      fontSize: 13,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              const SizedBox(height: 8),
                                              ClipRRect(
                                                borderRadius: BorderRadius.circular(4),
                                                child: LinearProgressIndicator(
                                                  value: (report.productivityPercent / 100).clamp(0.0, 1.0),
                                                  minHeight: 6,
                                                  backgroundColor: Colors.grey.shade800,
                                                  valueColor: AlwaysStoppedAnimation<Color>(
                                                    _getProductivityColor(report.productivityPercent),
                                                  ),
                                                ),
                                              ),
                                              // Actionable Rework Banner
                                              if (isRework) ...[
                                                const SizedBox(height: 16),
                                                Container(
                                                  padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                                                  decoration: BoxDecoration(
                                                    color: const Color(0xFFFF735D).withOpacity(0.1),
                                                    borderRadius: BorderRadius.circular(8),
                                                    border: Border.all(color: const Color(0xFFFF735D).withOpacity(0.3)),
                                                  ),
                                                  child: const Row(
                                                    mainAxisAlignment: MainAxisAlignment.center,
                                                    children: [
                                                      Icon(Icons.edit_note, size: 20, color: Color(0xFFFF735D)),
                                                      SizedBox(width: 8),
                                                      Text(
                                                        'Tap anywhere on card to edit and resubmit',
                                                        style: TextStyle(
                                                          color: Color(0xFFFF735D),
                                                          fontWeight: FontWeight.bold,
                                                          fontSize: 12,
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              ],
                                            ],
                                          ),
                                        )
                                      : const SizedBox.shrink(),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );

                      if (isRework) {
                        return GestureDetector(
                          onTap: () {
                            ref.read(dailyReportProvider.notifier).loadReportForRework(report);
                            context.go(AppRoutes.newActivity);
                          },
                          child: cardChild,
                        );
                      }

                      return cardChild;
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.history_toggle_off_rounded,
            size: 72,
            color: Colors.grey.shade700,
          ),
          const SizedBox(height: 16),
          Text(
            'No activities found',
            style: theme.textTheme.titleMedium?.copyWith(
              color: Colors.grey.shade500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Try changing the status filter above.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: Colors.grey.shade600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(BuildContext context, String label, String value, IconData icon) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 2.0),
          child: Icon(icon, size: 16, color: Colors.grey.shade500),
        ),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13),
          ),
        ),
      ],
    );
  }

  Widget _buildWarningBlock(BuildContext context, String reason) {
    const warningColor = Color(0xFFFF735D);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: warningColor.withOpacity(0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: warningColor.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: warningColor, size: 16),
              SizedBox(width: 6),
              Text(
                'Outside assigned role',
                style: TextStyle(
                  color: warningColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            reason,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 12,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}
