import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'logged_activity.dart';

class ActivityHistoryNotifier extends StateNotifier<List<LoggedActivity>> {
  ActivityHistoryNotifier() : super(_initialMockActivities);

  static final List<LoggedActivity> _initialMockActivities = [
    LoggedActivity(
      id: 'ACT-MOCK-1',
      title: 'Frame Assembly',
      activityCode: 'ASM-100',
      departmentName: 'Assembly',
      salesOrderId: 'SO-2025-001',
      timeString: '08:00 AM - 10:30 AM',
      status: ActivityStatus.completed,
      date: DateTime.now().subtract(const Duration(hours: 4)),
      durationMinutes: 150,
      productivityPercent: 85.0,
    ),
    LoggedActivity(
      id: 'ACT-MOCK-2',
      title: 'Visual Inspection',
      activityCode: 'QC-300',
      departmentName: 'Quality Control',
      salesOrderId: 'SO-2025-002',
      timeString: '10:45 AM - 12:00 PM',
      status: ActivityStatus.completed,
      date: DateTime.now().subtract(const Duration(hours: 2)),
      durationMinutes: 75,
      productivityPercent: 92.3,
      hasCoworker: true,
      coworkerName: 'Anita Sharma',
    ),
    LoggedActivity(
      id: 'ACT-MOCK-3',
      title: 'Welding Area Cleanup',
      activityCode: 'WLD-299',
      departmentName: 'Welding',
      salesOrderId: 'SO-2025-003',
      timeString: '01:00 PM - Present',
      status: ActivityStatus.ongoing,
      date: DateTime.now(),
      isOtherActivity: true,
      otherActivityReason: 'Routine welding machine calibration check.',
    ),
    LoggedActivity(
      id: 'ACT-MOCK-4',
      title: 'Wiring Harness Install',
      activityCode: 'ASM-101',
      departmentName: 'Assembly',
      salesOrderId: 'SO-2025-001',
      timeString: '03:00 PM - 04:00 PM',
      status: ActivityStatus.pending,
      date: DateTime.now().add(const Duration(hours: 2)),
    ),
    LoggedActivity(
      id: 'ACT-MOCK-5',
      title: 'Surface Prep & Sanding',
      activityCode: 'PNT-400',
      departmentName: 'Painting',
      salesOrderId: 'SO-2025-004',
      timeString: '04:15 PM - 05:00 PM',
      status: ActivityStatus.pending,
      date: DateTime.now().add(const Duration(hours: 4)),
    ),
  ];

  void addActivity(LoggedActivity activity) {
    // Insert at beginning of list so recent is first
    state = [activity, ...state];
  }

  void updateActivityStatus(String id, ActivityStatus newStatus) {
    state = state.map((act) {
      if (act.id == id) {
        return act.copyWith(status: newStatus);
      }
      return act;
    }).toList();
  }
}

final activityHistoryProvider =
    StateNotifierProvider<ActivityHistoryNotifier, List<LoggedActivity>>(
  (ref) => ActivityHistoryNotifier(),
);
