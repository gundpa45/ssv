import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

import '../../../app/config.dart';
import '../../daily_report/data/mock_data.dart';
import '../../daily_report/domain/daily_report_notifier.dart';

// ──────────────────────────────────────────────────────────────────────────
// TASK 4 — History API integration
// ──────────────────────────────────────────────────────────────────────────

const String _baseUrl = AppConfig.baseUrl;

/// Reads the JWT token from Hive authBox for Bearer auth.
String? _getToken() {
  try {
    return Hive.box('authBox').get('token') as String?;
  } catch (_) {
    return null;
  }
}

/// Fetches activity logs from the live API and maps them to [SubmittedReport].
///
/// On any failure: returns the existing mock history list as fallback so the
/// History screen remains fully operational.
Future<List<SubmittedReport>> _fetchHistory() async {
  try {
    final token = _getToken();
    final headers = (token != null && token.isNotEmpty)
        ? {'Authorization': 'Bearer $token'}
        : <String, String>{};

    final dio = Dio(BaseOptions(
      connectTimeout: const Duration(seconds: 45),
      receiveTimeout: const Duration(seconds: 45),
    ));

    final response = await dio.get(
      '$_baseUrl/activity-logs',
      options: Options(headers: headers),
    );

    final data = response.data;
    if (data is! List) {
      debugPrint('⚠️ History API: unexpected response type, using mock fallback.');
      return _sortedMock();
    }

    final mapped = <SubmittedReport>[];

    for (final item in data) {
      try {
        // ── IDs ──────────────────────────────────────────────────────
        final id = item['id']?.toString() ?? '';
        final soId = item['soId']?.toString() ?? '';
        final departmentId = item['departmentId']?.toString() ?? '';
        final activityId = item['activityId']?.toString() ?? '';

        // ── Nested labels per task specification ──────────────────────
        // SalesOrder.soNumber
        final soObj = item['so'] as Map<String, dynamic>?;
        final soNumber = soObj?['soNumber']?.toString() ?? soId;

        // department.name
        final deptObj = item['department'] as Map<String, dynamic>?;
        final deptName = deptObj?['name']?.toString() ?? '';

        // activity.activityName
        final actObj = item['activity'] as Map<String, dynamic>?;
        final actName = actObj?['activityName']?.toString() ?? '';

        // ── Time: extracted from slots[0] ─────────────────────────────
        String startTime = '';
        String endTime = '';
        int durationMinutes = 0;

        final slots = item['slots'] as List?;
        if (slots != null && slots.isNotEmpty) {
          final slot = slots[0] as Map<String, dynamic>?;
          if (slot != null) {
            durationMinutes = (slot['durationMinutes'] as num?)?.toInt() ?? 0;

            // startTime / endTime are ISO8601 DateTime strings from the backend
            final startRaw = slot['startTime']?.toString();
            final endRaw = slot['endTime']?.toString();
            if (startRaw != null) {
              startTime = _formatTimeFromIso(startRaw);
            }
            if (endRaw != null) {
              endTime = _formatTimeFromIso(endRaw);
            }
          }
        }

        // ── Status mapping ────────────────────────────────────────────
        // Backend: PENDING | IN_PROGRESS | COMPLETED → map to UI labels
        final rawStatus = item['status']?.toString() ?? 'PENDING';
        final status = _mapStatus(rawStatus);

        // ── Submitted date ────────────────────────────────────────────
        DateTime submittedDate;
        final activityDateRaw = item['activityDate']?.toString() ??
            item['createdAt']?.toString();
        if (activityDateRaw != null) {
          final parsed = DateTime.tryParse(activityDateRaw);
          if (parsed != null) {
            // Convert to UTC, then add 5:30 for IST
            final utcDate = parsed.isUtc ? parsed : parsed.toUtc();
            final istDate = utcDate.add(const Duration(hours: 5, minutes: 30));
            submittedDate = DateTime(istDate.year, istDate.month, istDate.day);
          } else {
            submittedDate = DateTime.now();
          }
        } else {
          submittedDate = DateTime.now();
        }

        // ── Remarks / other activity ──────────────────────────────────
        final remarks = item['remarks']?.toString();
        final isOtherActivity = item['isOtherActivity'] as bool? ?? false;
        final otherReason = item['otherActivityReason']?.toString();
        final managerRemarks = item['managerRemarks']?.toString();
        final isRework = item['isRework'] as bool? ?? false;

        // ── Productivity — compute from slot duration + activity stdMins ──
        final stdMins =
            (actObj?['standardManMinutes'] as num?)?.toDouble() ?? 0.0;
        final prodPct = (durationMinutes > 0 && stdMins > 0)
            ? (stdMins / durationMinutes) * 100.0
            : 0.0;

        // ── Worker info ───────────────────────────────────────────────
        final workerObj = item['user'] as Map<String, dynamic>?;
        final workerName = workerObj != null
            ? '${workerObj['firstName'] ?? ''} ${workerObj['lastName'] ?? ''}'
                .trim()
            : 'Worker';
        final workerEmployeeId = workerObj != null
            ? (workerObj['employeeId']?.toString() ?? '')
            : '';

        mapped.add(SubmittedReport(
          reportId: id,
          salesOrderId: soId,
          departmentId: departmentId,
          activityId: activityId,
          salesOrder: soNumber,
          department: deptName,
          activity: actName,
          startTime: startTime,
          endTime: endTime,
          durationMinutes: durationMinutes,
          productivityPercent: double.parse(prodPct.toStringAsFixed(1)),
          workerName: workerName,
          workerRole: '',
          workerEmployeeId: workerEmployeeId,
          submittedDate: submittedDate,
          status: status,
          otherActivityReason:
              isOtherActivity ? (otherReason ?? remarks) : null,
          remarks: remarks,
          managerRemarks: managerRemarks,
          isRework: isRework,
        ));
      } catch (itemErr) {
        debugPrint('⚠️ History: skipping malformed item: $itemErr');
      }
    }

    if (mapped.isEmpty && data.isNotEmpty) {
      // Parsing yielded nothing — fall back to mock
      debugPrint(
        '⚠️ History API: parsing produced 0 records, using mock fallback.',
      );
      return _sortedMock();
    }

    mapped.sort((a, b) => b.submittedDate.compareTo(a.submittedDate));
    debugPrint('✅ History loaded from API: ${mapped.length} records.');
    return mapped;
  } on DioException catch (e) {
    debugPrint(
      '⚠️ History API unreachable (${e.type.name}), using mock fallback.',
    );
    return _sortedMock();
  } catch (e) {
    debugPrint('⚠️ Unexpected history error: $e — using mock fallback.');
    return _sortedMock();
  }
}

/// Sorts the mock submitted reports newest-first (preserving original behavior).
List<SubmittedReport> _sortedMock() {
  final list = List<SubmittedReport>.from(mockSubmittedReports);
  list.sort((a, b) => b.submittedDate.compareTo(a.submittedDate));
  return list;
}

/// Maps backend ActivityStatus enum → UI display label.
String _mapStatus(String raw) {
  switch (raw.toUpperCase()) {
    case 'COMPLETED':
      return 'Approved';
    case 'IN_PROGRESS':
      return 'Pending';
    case 'REWORK_ASSIGNED':
      return 'Rework Assigned';
    case 'PENDING':
    default:
      return 'Pending';
  }
}

/// Formats an ISO8601 DateTime string to "HH:MM" display format.
String _formatTimeFromIso(String iso) {
  try {
    final dt = DateTime.parse(iso).toLocal();
    return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  } catch (_) {
    return '';
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Providers
// ──────────────────────────────────────────────────────────────────────────

/// Async provider that fetches history from the live API.
/// Watches [dailyReportProvider] to re-fetch whenever a new report is submitted.
final historyProvider =
    FutureProvider.autoDispose<List<SubmittedReport>>((ref) async {
  // Re-fetch whenever the daily report state changes (e.g. new submission)
  ref.watch(dailyReportProvider);
  return _fetchHistory();
});
