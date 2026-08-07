import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../data/mock_data.dart';
import '../domain/daily_report_notifier.dart';
import '../domain/daily_report_state.dart';
import '../widgets/coworker_section.dart';
import '../widgets/productivity_summary_card.dart';
import '../widgets/time_picker_row.dart';

/// Main Daily Report form screen with Dark Premium Theme.
class DailyReportScreen extends ConsumerWidget {
  const DailyReportScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(dailyReportProvider);
    final notifier = ref.read(dailyReportProvider.notifier);
    final theme = Theme.of(context);

    // ── Snackbar on successful submit ──────────────────────────────────
    _listenForSubmitSuccess(context, ref);

    // ── Live lists from notifier (API data with mock fallback) ──────────
    final allActivities = notifier.activities;
    final allDepartments = notifier.getDepartmentsForSalesOrder(state.selectedSO);
    final allSalesOrders = notifier.salesOrders;

    // ── Activities: filtered by department OR full list ─────────────────
    final List<Activity> displayedActivities;
    if (state.showAllActivities) {
      // Show ALL activities from live/mock data
      displayedActivities = allActivities.toList();
    } else if (state.selectedDepartment != null) {
      // Normal mode: only department-filtered activities that are within the user's assigned role
      displayedActivities = allActivities
          .where((a) =>
              a.departmentId == state.selectedDepartment!.id &&
              a.isInRole == true)
          .toList();
    } else {
      displayedActivities = <Activity>[];
    }

    final bool endTimeBeforeStart = _isEndBeforeStart(state);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Log New Activity'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        actions: [
          if (state.isLoadingDropdowns)
            const Padding(
              padding: EdgeInsets.only(right: 16),
              child: SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white70,
                ),
              ),
            ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 100), // extra bottom padding for tab bar
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ═══ Section Title ═══════════════════════════════════════
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Activity Setup',
                    style: theme.textTheme.titleMedium?.copyWith(fontSize: 18),
                  ),
                  Text(
                    'Required *',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: Colors.grey.shade500,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // ═══ 1. Sales Order ═══════════════════════════════════════
              _SalesOrderDropdown(
                selectedSO: state.selectedSO,
                salesOrders: allSalesOrders,
                onChanged: notifier.selectSalesOrder,
              ),
              const SizedBox(height: 12),

              // ═══ 2. Department ════════════════════════════════════════
              _DepartmentDropdown(
                selectedDepartment: state.selectedDepartment,
                departments: allDepartments,
                enabled: state.selectedSO != null,
                onChanged: notifier.selectDepartment,
              ),
              const SizedBox(height: 12),

              // ═══ 3. Activity ═════════════════════════════════════════
              _ActivityDropdown(
                activities: displayedActivities,
                selectedActivity: state.selectedActivity,
                enabled: state.selectedDepartment != null,
                onChanged: notifier.selectActivity,
              ),
              const SizedBox(height: 4),

              // ═══ 3b. Show All Activities Toggle ══════════════════════
              if (state.selectedDepartment != null)
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                  controlAffinity: ListTileControlAffinity.leading,
                  title: const Text('Show Other Activities'),
                  subtitle: state.showAllActivities
                      ? const Text(
                          'Showing all activities across departments',
                          style: TextStyle(fontSize: 12, color: Colors.white70),
                        )
                      : null,
                  value: state.showAllActivities,
                  onChanged: (v) => notifier.toggleShowAllActivities(v ?? false),
                ),

              // ═══ 3a. Other Activity Warning ══════════════════════════
              if (state.isOtherActivity) ...[
                const SizedBox(height: 8),
                _OtherActivityWarning(
                  reason: state.otherActivityReason,
                  onChanged: notifier.setOtherActivityReason,
                ),
              ],
              const SizedBox(height: 24),

              // ═══ Section Title ═══════════════════════════════════════
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Time Entry',
                    style: theme.textTheme.titleMedium?.copyWith(fontSize: 18),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // ═══ 4. Time Entry ═══════════════════════════════════════
              _TimeEntrySection(
                startTime: state.startTime,
                endTime: state.endTime,
                endTimeBeforeStart: endTimeBeforeStart,
                onStartSelected: notifier.setStartTime,
                onEndSelected: notifier.setEndTime,
              ),
              const SizedBox(height: 24),

              // ═══ Section Title ═══════════════════════════════════════
              Text(
                'Team',
                style: theme.textTheme.titleMedium?.copyWith(fontSize: 18),
              ),
              const SizedBox(height: 16),

              // ═══ 5. Coworker ═════════════════════════════════════════
              const CoworkerSection(),
              const SizedBox(height: 24),

              // ═══ Remarks ═════════════════════════════════════════════
              Text(
                'Remarks',
                style: theme.textTheme.titleMedium?.copyWith(fontSize: 18),
              ),
              const SizedBox(height: 16),
              _RemarksSection(
                remarks: state.remarks,
                onChanged: notifier.setRemarks,
              ),
              const SizedBox(height: 24),

              // ═══ Section Title ═══════════════════════════════════════
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Your progress',
                    style: theme.textTheme.titleMedium?.copyWith(fontSize: 18),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // ═══ 6. Productivity Summary ═════════════════════════════
              const ProductivitySummaryCard(),
              const SizedBox(height: 16),

              // ═══ 6a. Duplicate Error Banner ══════════════════════════
              if (state.duplicateError != null)
                _ErrorBanner(
                  message: state.duplicateError!,
                  onDismiss: notifier.clearDuplicateError,
                ),

              // ═══ 6b. Submit Error Banner ═════════════════════════════
              if (state.submitErrorMessage != null)
                _ErrorBanner(
                  message: state.submitErrorMessage!,
                  onDismiss: notifier.clearSubmitError,
                ),

              const SizedBox(height: 16),

              // ═══ 7. Submit Button ════════════════════════════════════
              SizedBox(
                height: 56,
                child: ElevatedButton.icon(
                  onPressed: state.canSubmit
                      ? () async => await notifier.submit()
                      : null,
                  icon: state.isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.send_rounded, size: 20),
                  label: Text(state.isSubmitting ? 'Submitting...' : 'Submit Report'),
                  style: ElevatedButton.styleFrom(
                    disabledBackgroundColor: theme.colorScheme.primary.withOpacity(0.25),
                    disabledForegroundColor: Colors.white60,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────────────

  static bool _isEndBeforeStart(DailyReportState state) {
    if (state.startTime == null || state.endTime == null) return false;
    final s = state.startTime!.hour * 60 + state.startTime!.minute;
    final e = state.endTime!.hour * 60 + state.endTime!.minute;
    return e <= s;
  }

  void _listenForSubmitSuccess(BuildContext context, WidgetRef ref) {
    ref.listen(dailyReportProvider, (DailyReportState? prev, DailyReportState next) {
      if (next.submitSuccessMessage != null &&
          next.submitSuccessMessage != prev?.submitSuccessMessage) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white, size: 20),
                const SizedBox(width: 10),
                Expanded(child: Text(next.submitSuccessMessage!)),
              ],
            ),
            backgroundColor: const Color(0xFF5C7862), // match primary theme color
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            duration: const Duration(seconds: 3),
          ),
        );
        ref.read(dailyReportProvider.notifier).clearSubmitSuccess();
        
        // Return to Dashboard after a short delay
        Future.delayed(const Duration(seconds: 1), () {
          if (context.mounted) {
            context.pop();
          }
        });
      }
    });
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Private section widgets
// ══════════════════════════════════════════════════════════════════════════

class _SalesOrderDropdown extends StatelessWidget {
  const _SalesOrderDropdown({
    required this.selectedSO,
    required this.salesOrders,
    required this.onChanged,
  });

  final SalesOrder? selectedSO;
  final List<SalesOrder> salesOrders;
  final ValueChanged<SalesOrder?> onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : Colors.black87;
    final dropdownColor = isDark ? const Color(0xFF262628) : Colors.white;
    final iconColor = isDark ? Colors.white : Colors.black87;

    return DropdownButtonFormField<SalesOrder>(
      key: ValueKey('${selectedSO?.id}_${salesOrders.length}'),
      initialValue: selectedSO,
      style: TextStyle(color: textColor, fontSize: 16),
      icon: Icon(Icons.keyboard_arrow_down, color: iconColor),
      decoration: const InputDecoration(
        labelText: 'Sales Order',
        prefixIcon: Icon(Icons.receipt_long_outlined),
      ),
      hint: const Text('Select sales order'),
      dropdownColor: dropdownColor,
      items: salesOrders.map((so) {
        return DropdownMenuItem(
          value: so,
          child: Text(so.label, style: TextStyle(color: textColor)),
        );
      }).toList(),
      onChanged: onChanged,
    );
  }
}

class _DepartmentDropdown extends StatelessWidget {
  const _DepartmentDropdown({
    required this.selectedDepartment,
    required this.departments,
    required this.enabled,
    required this.onChanged,
  });

  final Department? selectedDepartment;
  final List<Department> departments;
  final bool enabled;
  final ValueChanged<Department?> onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : Colors.black87;
    final dropdownColor = isDark ? const Color(0xFF262628) : Colors.white;
    final iconColor = isDark ? Colors.white : Colors.black87;

    return DropdownButtonFormField<Department>(
      key: ValueKey('${selectedDepartment?.id}_${departments.length}'),
      initialValue: selectedDepartment,
      style: TextStyle(color: textColor, fontSize: 16),
      icon: Icon(Icons.keyboard_arrow_down, color: iconColor),
      decoration: InputDecoration(
        labelText: 'Department',
        prefixIcon: const Icon(Icons.business_outlined),
        hintText: enabled ? 'Select department' : 'Select a sales order first',
      ),
      hint: Text(enabled ? 'Select department' : 'Select a sales order first'),
      dropdownColor: dropdownColor,
      items: departments.map((dept) {
        return DropdownMenuItem(
          value: dept,
          child: Text(dept.name, style: TextStyle(color: textColor)),
        );
      }).toList(),
      onChanged: enabled ? onChanged : null,
    );
  }
}

class _ActivityDropdown extends StatelessWidget {
  const _ActivityDropdown({
    required this.activities,
    required this.selectedActivity,
    required this.enabled,
    required this.onChanged,
  });

  final List<Activity> activities;
  final Activity? selectedActivity;
  final bool enabled;
  final ValueChanged<Activity?> onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : Colors.black87;
    final dropdownColor = isDark ? const Color(0xFF262628) : Colors.white;
    final iconColor = isDark ? Colors.white : Colors.black87;

    return DropdownButtonFormField<Activity>(
      key: ValueKey('${selectedActivity?.id}_${activities.length}'),
      initialValue: selectedActivity,
      style: TextStyle(color: textColor, fontSize: 16),
      icon: Icon(Icons.keyboard_arrow_down, color: iconColor),
      decoration: InputDecoration(
        labelText: 'Activity',
        prefixIcon: const Icon(Icons.task_alt_outlined),
        hintText: enabled ? 'Select activity' : 'Select a department first',
      ),
      dropdownColor: dropdownColor,
      items: activities.map((act) {
        return DropdownMenuItem(
          value: act,
          child: Text(
            act.activityCode.isEmpty
                ? act.activityName
                : '${act.activityCode} — ${act.activityName}',
            style: TextStyle(color: textColor),
            overflow: TextOverflow.ellipsis,
          ),
        );
      }).toList(),
      onChanged: enabled ? onChanged : null,
    );
  }
}

class _OtherActivityWarning extends StatefulWidget {
  const _OtherActivityWarning({
    required this.reason,
    required this.onChanged,
  });

  final String reason;
  final ValueChanged<String> onChanged;

  @override
  State<_OtherActivityWarning> createState() => _OtherActivityWarningState();
}

class _OtherActivityWarningState extends State<_OtherActivityWarning> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.reason);
  }

  @override
  void didUpdateWidget(covariant _OtherActivityWarning oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.reason != _controller.text) {
      _controller.text = widget.reason;
      _controller.selection = TextSelection.fromPosition(
        TextPosition(offset: _controller.text.length),
      );
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    const warningColor = Color(0xFFFF735D); // matching coral

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: warningColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: warningColor.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.warning_amber_rounded, color: warningColor, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Outside assigned role',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: warningColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _controller,
            decoration: InputDecoration(
              labelText: 'Reason (required)',
              hintText: 'Why are you performing this?',
              fillColor: theme.scaffoldBackgroundColor, // dark bg inside card
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
            maxLines: 2,
            onChanged: widget.onChanged,
          ),
        ],
      ),
    );
  }
}

class _TimeEntrySection extends StatelessWidget {
  const _TimeEntrySection({
    required this.startTime,
    required this.endTime,
    required this.endTimeBeforeStart,
    required this.onStartSelected,
    required this.onEndSelected,
  });

  final TimeOfDay? startTime;
  final TimeOfDay? endTime;
  final bool endTimeBeforeStart;
  final ValueChanged<TimeOfDay> onStartSelected;
  final ValueChanged<TimeOfDay> onEndSelected;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFF262628),
              borderRadius: BorderRadius.circular(16),
            ),
            child: TimePickerRow(
              label: 'Start',
              selectedTime: startTime,
              onTimeSelected: onStartSelected,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFF262628),
              borderRadius: BorderRadius.circular(16),
              border: endTimeBeforeStart ? Border.all(color: Colors.redAccent) : null,
            ),
            child: TimePickerRow(
              label: 'End',
              selectedTime: endTime,
              onTimeSelected: onEndSelected,
              errorText: endTimeBeforeStart ? 'Before start' : null,
            ),
          ),
        ),
      ],
    );
  }
}

// ── Error Banner (duplicate / submit errors) ─────────────────────────────

/// Red error banner displayed when a duplicate report is detected or a
/// generic submission error occurs. Includes a dismiss icon button.
class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({
    required this.message,
    required this.onDismiss,
  });

  final String message;
  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    const errorRed = Color(0xFFC62828);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFEBEE), // light red
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: errorRed.withOpacity(0.4)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.error_outline_rounded, color: errorRed, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: errorRed,
                fontWeight: FontWeight.w500,
                height: 1.4,
              ),
            ),
          ),
          const SizedBox(width: 4),
          GestureDetector(
            onTap: onDismiss,
            child: const Icon(Icons.close, color: errorRed, size: 18),
          ),
        ],
      ),
    );
  }
}

class _RemarksSection extends StatefulWidget {
  const _RemarksSection({
    required this.remarks,
    required this.onChanged,
  });

  final String remarks;
  final ValueChanged<String> onChanged;

  @override
  State<_RemarksSection> createState() => _RemarksSectionState();
}

class _RemarksSectionState extends State<_RemarksSection> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.remarks);
  }

  @override
  void didUpdateWidget(covariant _RemarksSection oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.remarks != _controller.text) {
      _controller.text = widget.remarks;
      _controller.selection = TextSelection.fromPosition(
        TextPosition(offset: _controller.text.length),
      );
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      decoration: const InputDecoration(
        labelText: 'Remarks (optional)',
        hintText: 'Enter any additional comments or remarks...',
        prefixIcon: Icon(Icons.comment_outlined),
      ),
      maxLines: 2,
      onChanged: widget.onChanged,
    );
  }
}
