import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

/// Reusable time-picker row styled like a Material text field.
///
/// Tapping the row opens [showTimePicker] and passes the selected value
/// back via [onTimeSelected]. Uses the `intl` package to format the time
/// in `hh:mm a` format.
class TimePickerRow extends StatelessWidget {
  const TimePickerRow({
    super.key,
    required this.label,
    this.selectedTime,
    required this.onTimeSelected,
    this.errorText,
  });

  /// Label displayed above the field (e.g. "Start Time").
  final String label;

  /// Currently selected time, or `null` if none has been chosen.
  final TimeOfDay? selectedTime;

  /// Callback invoked with the newly picked time.
  final ValueChanged<TimeOfDay> onTimeSelected;

  /// Optional error text displayed below the field (e.g. "Before start").
  final String? errorText;

  // ──────────────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────────────

  /// Formats a [TimeOfDay] as "hh:mm a" using a [DateTime] shim.
  String _formatTime(TimeOfDay time) {
    final now = DateTime.now();
    final dt = DateTime(now.year, now.month, now.day, time.hour, time.minute);
    return DateFormat('hh:mm a').format(dt);
  }

  Future<void> _pickTime(BuildContext context) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: selectedTime ?? TimeOfDay.now(),
    );
    if (picked != null) {
      onTimeSelected(picked);
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // Build
  // ──────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hasError = errorText != null && errorText!.isNotEmpty;

    return InkWell(
      borderRadius: BorderRadius.circular(10),
      onTap: () => _pickTime(context),
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          errorText: hasError ? errorText : null,
          suffixIcon: const Icon(Icons.access_time_rounded),
        ),
        child: Text(
          selectedTime != null ? _formatTime(selectedTime!) : 'Select time',
          style: theme.textTheme.bodyLarge?.copyWith(
            color: selectedTime != null
                ? theme.colorScheme.onSurface
                : theme.colorScheme.onSurface.withValues(alpha: 0.5),
          ),
        ),
      ),
    );
  }
}
