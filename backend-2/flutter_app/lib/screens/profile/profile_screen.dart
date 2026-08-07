import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';

import '../../features/auth/domain/auth_notifier.dart';
import '../../features/daily_report/data/mock_data.dart';
import '../../features/history/domain/history_provider.dart';

/// Screen for viewing the worker's profile.
/// Displays worker name, Employee ID, daily hours worked (numerically and graphically),
/// activities performed, and settings.
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  Color _getHourColor(double hours) {
    if (hours < 5.8) {
      return const Color(0xFFEF5350); // Red
    } else if (hours >= 5.8 && hours <= 6.2) {
      return const Color(0xFFFBC02D); // Yellow
    } else if (hours >= 6.3 && hours <= 6.8) {
      return const Color(0xFF81C784); // Pale Green
    } else {
      return const Color(0xFF2E7D32); // Dark Green
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    final textColor = isDark ? Colors.white : Colors.black87;
    final subTextColor = isDark ? Colors.white70 : Colors.black54;
    final labelColor = isDark ? Colors.grey.shade400 : Colors.grey.shade600;
    final cardBg = isDark ? const Color(0xFF262628) : Colors.grey.shade100;
    final dividerColor = isDark ? Colors.white10 : Colors.grey.shade300;

    final authState = ref.watch(authProvider);
    final employeeId = authState.employeeId ?? '—';
    final firstName = authState.firstName ?? '';
    final lastName = authState.lastName ?? '';
    final fullName = authState.fullName ?? '$firstName $lastName';
    final role = authState.role ?? 'Worker';

    // Watch historyProvider to dynamically compute stats
    final historyAsync = ref.watch(historyProvider);
    final reports = historyAsync.value ?? mockSubmittedReports;

    // Filter reports for the current user
    final userReports = reports;

    // Filter reports for today
    final now = DateTime.now();
    final todayDate = DateTime(now.year, now.month, now.day);
    final todayReports = userReports.where((r) {
      final rDate = DateTime(r.submittedDate.year, r.submittedDate.month, r.submittedDate.day);
      return rDate.isAtSameMomentAs(todayDate);
    }).toList();

    // Sum today's working hours
    final double hoursWorkedToday = todayReports.fold<double>(
      0.0,
      (sum, r) => sum + (r.durationMinutes / 60.0),
    );
    final double hoursWorkedTodayFormatted = double.parse(hoursWorkedToday.toStringAsFixed(1));
    final int activitiesDoneToday = todayReports.length;

    // Determine the dynamic color based on today's working hours
    final Color todayHoursColor = _getHourColor(hoursWorkedTodayFormatted);

    // Get the user's latest department
    final String userDepartment = userReports.isNotEmpty 
        ? userReports.first.department 
        : 'Assembly & Testing';

    // Find the Monday of the current week (1 = Monday, 7 = Sunday)
    final int currentWeekday = now.weekday;
    final DateTime mondayOfThisWeek = todayDate.subtract(Duration(days: currentWeekday - 1));

    // Generate hours for each day of the current week (Mon to Sun)
    final List<double> weeklyHoursList = List.generate(7, (index) {
      final dayDate = mondayOfThisWeek.add(Duration(days: index));
      final dayReports = userReports.where((r) {
        final rDate = DateTime(r.submittedDate.year, r.submittedDate.month, r.submittedDate.day);
        return rDate.isAtSameMomentAs(dayDate);
      }).toList();
      final double totalMins = dayReports.fold<double>(
        0.0,
        (sum, r) => sum + r.durationMinutes.toDouble(),
      );
      return double.parse((totalMins / 60.0).toStringAsFixed(1));
    });

    // Calculate the maximum weekly hours to ensure the graph scale adapts and never overflows the boundary
    final double maxWeeklyHours = weeklyHoursList.fold<double>(
      8.0, 
      (maxVal, h) => h > maxVal ? h : maxVal,
    );
    final double chartMaxY = maxWeeklyHours + 1.5;

    const String dob = 'January 15, 1995';

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 100),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ─── Header / Avatar Section ──────────────────────────────────
              Center(
                child: Column(
                  children: [
                    Stack(
                      alignment: Alignment.bottomRight,
                      children: [
                        CircleAvatar(
                          radius: 54,
                          backgroundColor: isDark ? Colors.grey.shade800 : Colors.grey.shade300,
                          backgroundImage: const NetworkImage('https://i.pravatar.cc/150?img=11'),
                        ),
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primary,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.photo_camera_rounded,
                            size: 16,
                            color: isDark ? Colors.black : Colors.white,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      fullName,
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: textColor,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      role,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // ─── Profile Details Card ──────────────────────────────────────
              Text(
                'Personal Information',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontSize: 16, 
                  fontWeight: FontWeight.bold,
                  color: textColor,
                ),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: cardBg,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    _InfoRow(
                      label: 'Employee ID', 
                      value: employeeId, 
                      icon: Icons.fingerprint_rounded,
                      textColor: textColor,
                      labelColor: labelColor,
                    ),
                    Divider(height: 24, color: dividerColor),
                    _InfoRow(
                      label: 'Date of Birth', 
                      value: dob, 
                      icon: Icons.cake_rounded,
                      textColor: textColor,
                      labelColor: labelColor,
                    ),
                    Divider(height: 24, color: dividerColor),
                    _InfoRow(
                      label: 'Department', 
                      value: userDepartment, 
                      icon: Icons.precision_manufacturing_rounded,
                      textColor: textColor,
                      labelColor: labelColor,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // ─── Daily Activity Statistics ─────────────────────────────────
              Text(
                'Today\'s Activity Summary',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontSize: 16, 
                  fontWeight: FontWeight.bold,
                  color: textColor,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _StatCard(
                      label: 'Hours Worked',
                      value: '$hoursWorkedTodayFormatted / 8 hrs',
                      icon: Icons.hourglass_empty_rounded,
                      color: todayHoursColor,
                      cardBg: cardBg,
                      textColor: textColor,
                      labelColor: labelColor,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _StatCard(
                      label: 'Activities Done',
                      value: '$activitiesDoneToday performed',
                      icon: Icons.task_alt_rounded,
                      color: theme.colorScheme.primary,
                      cardBg: cardBg,
                      textColor: textColor,
                      labelColor: labelColor,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // ─── Graphical Hour Log (Weekly Breakdown) ─────────────────────
              Container(
                height: 230,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: cardBg,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hours Logged This Week',
                      style: TextStyle(
                        color: subTextColor, 
                        fontWeight: FontWeight.bold, 
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Expanded(
                      child: BarChart(
                        BarChartData(
                          alignment: BarChartAlignment.spaceAround,
                          maxY: chartMaxY,
                          barTouchData: BarTouchData(enabled: false),
                          titlesData: FlTitlesData(
                            show: true,
                            bottomTitles: AxisTitles(
                              sideTitles: SideTitles(
                                showTitles: true,
                                reservedSize: 32,
                                getTitlesWidget: (value, meta) {
                                  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                                  if (value.toInt() >= 0 && value.toInt() < days.length) {
                                    return Padding(
                                      padding: const EdgeInsets.only(top: 8.0),
                                      child: Text(
                                        days[value.toInt()],
                                        style: TextStyle(color: labelColor, fontSize: 11),
                                      ),
                                    );
                                  }
                                  return const Text('');
                                },
                              ),
                            ),
                            leftTitles: AxisTitles(
                              sideTitles: SideTitles(
                                showTitles: true,
                                reservedSize: 32,
                                getTitlesWidget: (value, meta) {
                                  if (value % 2 == 0) {
                                    return Text(
                                      '${value.toInt()}h',
                                      style: TextStyle(color: labelColor, fontSize: 10),
                                    );
                                  }
                                  return const Text('');
                                },
                              ),
                            ),
                            topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                            rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          ),
                          borderData: FlBorderData(show: false),
                          gridData: FlGridData(show: false),
                          barGroups: List.generate(7, (index) {
                            final hours = weeklyHoursList[index];
                            final barColor = _getHourColor(hours);
                            return BarChartGroupData(
                              x: index,
                              barRods: [
                                BarChartRodData(
                                  toY: hours,
                                  color: barColor,
                                  width: 14,
                                  borderRadius: const BorderRadius.all(Radius.circular(6)),
                                  backDrawRodData: BackgroundBarChartRodData(
                                    show: true,
                                    toY: chartMaxY,
                                    color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.05),
                                  ),
                                ),
                              ],
                            );
                          }),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // ─── Actions / Sign Out ────────────────────────────────────────
              ElevatedButton.icon(
                onPressed: () {
                  ref.read(authProvider.notifier).logout();
                },
                icon: const Icon(Icons.logout_rounded),
                label: const Text('Sign Out'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFF735D).withOpacity(0.15),
                  foregroundColor: const Color(0xFFFF735D),
                  side: const BorderSide(color: Color(0xFFFF735D), width: 1),
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  Helper UI Widgets
// ══════════════════════════════════════════════════════════════════════════
class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.label,
    required this.value,
    required this.icon,
    required this.textColor,
    required this.labelColor,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color textColor;
  final Color labelColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: labelColor, size: 20),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                color: labelColor,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              value,
              style: TextStyle(
                color: textColor,
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.cardBg,
    required this.textColor,
    required this.labelColor,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final Color cardBg;
  final Color textColor;
  final Color labelColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 12),
          Text(
            label,
            style: TextStyle(
              color: labelColor,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              color: textColor,
              fontWeight: FontWeight.bold,
              fontSize: 15,
            ),
          ),
        ],
      ),
    );
  }
}
