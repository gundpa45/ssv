import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/mock_data.dart';
import '../domain/daily_report_notifier.dart';

/// Coworker presence section of the Daily Report form.
///
/// Contains:
/// - A checkbox to toggle coworker mode. When checked, prompts for verification.
/// - A green confirmation card on successful verification.
///
/// All state is read from [dailyReportProvider]; mutations flow through
/// the notifier — this widget is presentation-only.
class CoworkerSection extends ConsumerStatefulWidget {
  const CoworkerSection({super.key});

  @override
  ConsumerState<CoworkerSection> createState() => _CoworkerSectionState();
}
class _CoworkerSectionState extends ConsumerState<CoworkerSection> {
  Future<void> _showCoworkerVerifyDialog(BuildContext context) async {
    final notifier = ref.read(dailyReportProvider.notifier);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final controller = TextEditingController();
    String? errorMessage;

    final result = await showDialog<Coworker?>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              backgroundColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: isDark ? Colors.grey.shade800 : Colors.grey.shade300),
              ),
              title: Row(
                children: [
                  Icon(Icons.people_outline, color: theme.colorScheme.primary),
                  const SizedBox(width: 10),
                  Text(
                    'Verify Coworker',
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Please enter the Employee ID of the coworker working with you.',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: isDark ? Colors.grey : Colors.grey.shade700,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: controller,
                    autofocus: true,
                    style: theme.textTheme.bodyLarge,
                    decoration: InputDecoration(
                      labelText: 'Employee ID',
                      labelStyle: TextStyle(color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                      hintText: 'e.g. EMP-1042',
                      hintStyle: TextStyle(color: isDark ? Colors.grey.shade600 : Colors.grey.shade400),
                      errorText: errorMessage,
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: theme.colorScheme.primary),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: isDark ? Colors.grey.shade700 : Colors.grey.shade400),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      errorBorder: OutlineInputBorder(
                        borderSide: const BorderSide(color: Colors.redAccent),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      focusedErrorBorder: OutlineInputBorder(
                        borderSide: const BorderSide(color: Colors.redAccent),
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    textCapitalization: TextCapitalization.characters,
                    onChanged: (_) {
                      if (errorMessage != null) {
                        setState(() {
                          errorMessage = null;
                        });
                      }
                    },
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(null),
                  child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: theme.colorScheme.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  onPressed: () {
                    final idInput = controller.text.trim().toUpperCase();
                    if (idInput.isEmpty) {
                      setState(() {
                        errorMessage = 'Employee ID cannot be empty.';
                      });
                      return;
                    }
                    // Lookup in directory
                    final match = mockCoworkerDirectory.cast<Coworker?>().firstWhere(
                      (c) => c!.employeeId.toUpperCase() == idInput,
                      orElse: () => null,
                    );
                    if (match != null) {
                      Navigator.of(context).pop(match);
                    } else {
                      setState(() {
                        errorMessage = 'Employee does not exist';
                      });
                    }
                  },
                  child: const Text('Verify'),
                ),
              ],
            );
          },
        );
      },
    );

    if (result != null) {
      notifier.setVerifiedCoworkerDirectly(result);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(dailyReportProvider);
    final notifier = ref.read(dailyReportProvider.notifier);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Toggle ──────────────────────────────────────────────────────
        CheckboxListTile(
          contentPadding: EdgeInsets.zero,
          title: const Text('Coworker Present?'),
          value: state.hasCoworker,
          onChanged: (v) {
            if (v == true) {
              _showCoworkerVerifyDialog(context);
            } else {
              notifier.clearCoworker();
            }
          },
          controlAffinity: ListTileControlAffinity.leading,
          dense: true,
        ),

        // ── Success card ──────────────────────────────────────────────
        if (state.hasCoworker && state.verifiedCoworker != null) ...[
          const SizedBox(height: 12),
          _VerifiedCoworkerCard(
            name: state.verifiedCoworker!.name,
            employeeId: state.verifiedCoworker!.employeeId,
            department: state.verifiedCoworker!.department,
          ),
        ],
      ],
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Private helper widget
// ──────────────────────────────────────────────────────────────────────────

/// Green confirmation card shown after a coworker has been successfully
/// verified.
class _VerifiedCoworkerCard extends StatelessWidget {
  const _VerifiedCoworkerCard({
    required this.name,
    required this.employeeId,
    required this.department,
  });

  final String name;
  final String employeeId;
  final String department;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    const successGreen = Color(0xFF2E7D32);

    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: successGreen.withValues(alpha: 0.5), width: 1),
      ),
      color: successGreen.withValues(alpha: 0.1), // dark-friendly green background
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            const Icon(Icons.check_circle, color: successGreen, size: 32),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: successGreen,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '$employeeId  ·  $department',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.grey.shade400,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: successGreen.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'Credit Shared',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: successGreen,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
