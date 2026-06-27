import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:workforce_app/features/daily_report/data/mock_data.dart';
import 'package:workforce_app/features/daily_report/domain/daily_report_notifier.dart';

void main() {
  group('DailyReportNotifier Unit Tests', () {
    late ProviderContainer container;
    late DailyReportNotifier notifier;

    setUp(() {
      container = ProviderContainer();
      notifier = container.read(dailyReportProvider.notifier);
    });

    tearDown(() {
      container.dispose();
    });

    test('selectDepartment clears activities and resets flags', () {
      final dept = mockDepartments.firstWhere((d) => d.id == 'DEPT-03'); // Quality Control

      notifier.selectDepartment(dept);

      final state = container.read(dailyReportProvider);
      expect(state.selectedDepartment, dept);
      expect(state.selectedActivity, isNull);
      expect(state.isOtherActivity, isFalse);
      expect(state.showAllActivities, isFalse);
    });

    test('selectActivity within same department with isInRole = true sets isOtherActivity = false', () {
      final dept = mockDepartments.firstWhere((d) => d.id == 'DEPT-03'); // Quality Control
      final activity = mockActivities.firstWhere((a) => a.id == 'ACT-007'); // Visual Inspection (Quality Control, isInRole: true)

      notifier.selectDepartment(dept);
      notifier.selectActivity(activity);

      final state = container.read(dailyReportProvider);
      expect(state.selectedActivity, activity);
      expect(state.isOtherActivity, isFalse);
    });

    test('selectActivity within same department with isInRole = false sets isOtherActivity = true', () {
      final dept = mockDepartments.firstWhere((d) => d.id == 'DEPT-01'); // Assembly
      final activity = mockActivities.firstWhere((a) => a.id == 'ACT-003'); // General Assembly Support (Assembly, isInRole: false)

      notifier.selectDepartment(dept);
      notifier.selectActivity(activity);

      final state = container.read(dailyReportProvider);
      expect(state.selectedActivity, activity);
      expect(state.isOtherActivity, isTrue);
    });

    test('selectActivity from another department sets isOtherActivity = true', () {
      final dept = mockDepartments.firstWhere((d) => d.id == 'DEPT-03'); // Quality Control
      final otherDeptActivity = mockActivities.firstWhere((a) => a.id == 'ACT-001'); // Frame Assembly (Assembly, isInRole: true)

      notifier.selectDepartment(dept);
      notifier.toggleShowAllActivities(true);
      notifier.selectActivity(otherDeptActivity);

      final state = container.read(dailyReportProvider);
      expect(state.selectedActivity, otherDeptActivity);
      expect(state.isOtherActivity, isTrue);
    });

    test('toggleShowAllActivities off clears activity if selected activity is from another department', () {
      final dept = mockDepartments.firstWhere((d) => d.id == 'DEPT-03'); // Quality Control
      final otherDeptActivity = mockActivities.firstWhere((a) => a.id == 'ACT-001'); // Frame Assembly (Assembly)

      notifier.selectDepartment(dept);
      notifier.toggleShowAllActivities(true);
      notifier.selectActivity(otherDeptActivity);

      // Now toggle off
      notifier.toggleShowAllActivities(false);

      final state = container.read(dailyReportProvider);
      expect(state.showAllActivities, isFalse);
      expect(state.selectedActivity, isNull);
      expect(state.isOtherActivity, isFalse);
    });

    test('toggleShowAllActivities off keeps activity if selected activity is from the same department', () {
      final dept = mockDepartments.firstWhere((d) => d.id == 'DEPT-03'); // Quality Control
      final sameDeptActivity = mockActivities.firstWhere((a) => a.id == 'ACT-007'); // Visual Inspection (Quality Control)

      notifier.selectDepartment(dept);
      notifier.toggleShowAllActivities(true);
      notifier.selectActivity(sameDeptActivity);

      // Now toggle off
      notifier.toggleShowAllActivities(false);

      final state = container.read(dailyReportProvider);
      expect(state.showAllActivities, isFalse);
      expect(state.selectedActivity, sameDeptActivity);
    });

    test('loadReportForRework correctly populates form state', () {
      final reworkReport = mockSubmittedReports.firstWhere((r) => r.reportId == 'REP-003');

      notifier.loadReportForRework(reworkReport);

      final state = container.read(dailyReportProvider);
      expect(state.editingReportId, 'REP-003');
      expect(state.selectedSO?.id, reworkReport.salesOrderId);
      expect(state.selectedDepartment?.id, reworkReport.departmentId);
      expect(state.selectedActivity?.id, reworkReport.activityId);
      expect(state.startTime?.hour, 13);
      expect(state.startTime?.minute, 0);
      expect(state.endTime?.hour, 14);
      expect(state.endTime?.minute, 0);
      expect(state.hasCoworker, isFalse);
      expect(state.isOtherActivity, isFalse);
      expect(state.otherActivityReason, reworkReport.otherActivityReason);
    });

    test('resubmitting rework report updates in-place and clears editingReportId', () {
      final reworkReport = mockSubmittedReports.firstWhere((r) => r.reportId == 'REP-003');
      notifier.loadReportForRework(reworkReport);

      // Verify currently editing REP-003
      expect(container.read(dailyReportProvider).editingReportId, 'REP-003');

      // Submit changes
      notifier.submit();

      // Verify mock data has been updated in-place and status set to 'Pending'
      final updatedReport = mockSubmittedReports.firstWhere((r) => r.reportId == 'REP-003');
      expect(updatedReport.status, 'Pending');

      // Verify form state is reset and editingReportId cleared
      final state = container.read(dailyReportProvider);
      expect(state.editingReportId, isNull);
      expect(state.submitSuccessMessage, 'Report submitted successfully!');
    });
  });
}
