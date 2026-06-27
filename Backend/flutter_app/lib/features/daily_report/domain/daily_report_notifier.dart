import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

import '../../../app/config.dart';
import '../data/mock_data.dart';
import 'daily_report_state.dart';
import '../../auth/domain/auth_notifier.dart';
import '../../history/domain/history_provider.dart';

/// Riverpod [StateNotifier] that owns all mutations and validations for the
/// Daily Report form.
///
/// **Rules followed:**
/// - All business logic lives here (not in widgets).
/// - State is replaced immutably via [DailyReportState.copyWith].
/// - Calculations / derived values are state getters, NOT notifier methods.
class DailyReportNotifier extends StateNotifier<DailyReportState> {
  final Ref ref;
  DailyReportNotifier(this.ref) : super(const DailyReportState()) {
    loadDropdowns();
  }

  // ── Backend base URL ─────────────────────────────────────────────────────
  static const String _baseUrl = AppConfig.baseUrl;

  /// Dio instance for operations API calls.
  final Dio _dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 45),
    receiveTimeout: const Duration(seconds: 45),
  ));

  // ── Live lists (populated from API) ──────────────────────────────────────

  /// Live departments loaded from the API.
  List<Department> _liveDepartments = mockDepartments;

  /// Live activities loaded from the API.
  List<Activity> _liveActivities = mockActivities;

  /// Live sales orders loaded from the API.
  List<SalesOrder> _liveSalesOrders = mockSalesOrders;

  // ── Exposed lists for UI ─────────────────────────────────────────────────

  List<Department> get departments => _liveDepartments;
  List<Activity> get activities => _liveActivities;
  List<SalesOrder> get salesOrders => _liveSalesOrders;

  // ── Token helper ─────────────────────────────────────────────────────────

  /// Reads the JWT token from Hive authBox for Bearer auth.
  String? _getToken() {
    try {
      return Hive.box('authBox').get('token') as String?;
    } catch (_) {
      return null;
    }
  }

  /// Returns Dio options map with Authorization header attached.
  Map<String, String> _authHeaders() {
    final token = _getToken();
    if (token == null || token.isEmpty) return {};
    return {'Authorization': 'Bearer $token'};
  }

  // ────────────────────────────────────────────────────────────────────────
  // TASK 1 — Load live dropdown data
  // ────────────────────────────────────────────────────────────────────────

  /// Fetches Departments, Activities and Sales Orders from the live API in
  /// parallel. On any failure the existing mock data is kept intact so the
  /// form remains fully functional.
  Future<void> loadDropdowns() async {
    if (!mounted) return;

    final token = _getToken();
    if (token == null || token.isEmpty || token.startsWith('mock_')) {
      debugPrint('🧪 Mock token detected or empty token. Using mock data for dropdowns.');
      _liveDepartments = mockDepartments;
      _liveActivities = mockActivities;
      _liveSalesOrders = mockSalesOrders;
      if (mounted) {
        state = state.copyWith(isLoadingDropdowns: false);
      }
      return;
    }

    state = state.copyWith(isLoadingDropdowns: true);

    try {
      final headers = _authHeaders();

      final results = await Future.wait([
        _dio.get('$_baseUrl/departments', options: Options(headers: headers)),
        _dio.get('$_baseUrl/activities', options: Options(headers: headers)),
        _dio.get('$_baseUrl/sales-orders', options: Options(headers: headers)),
      ]);

      if (!mounted) return;

      // ── Map Departments ──────────────────────────────────────────────
      final deptData = results[0].data;
      if (deptData is List) {
        final parsed = deptData
            .map((d) => Department(
                  id: d['id']?.toString() ?? '',
                  name: d['name']?.toString() ?? '',
                ))
            .where((d) => d.id.isNotEmpty && d.name.isNotEmpty)
            .toList();
        _liveDepartments = parsed.isNotEmpty ? parsed : mockDepartments;
        debugPrint('✅ Departments loaded from API: ${parsed.length}');
      } else {
        _liveDepartments = mockDepartments;
      }

      // ── Map Activities ───────────────────────────────────────────────
      final actData = results[1].data;
      if (actData is List) {
        final userRole = Hive.box('authBox').get('role')?.toString();
        final parsed = actData
            .map((a) {
              final restrictedRole = a['restrictedRole'];
              final String? restrictedRoleName = restrictedRole is Map ? restrictedRole['name']?.toString() : null;

              // If there's no restriction, or user is Admin, or user role matches restricted role name
              final bool isInRole = restrictedRoleName == null ||
                  userRole == null ||
                  userRole.toLowerCase() == 'admin' ||
                  userRole.toLowerCase() == restrictedRoleName.toLowerCase();

              return Activity(
                id: a['id']?.toString() ?? '',
                activityCode: a['activityCode']?.toString() ?? '',
                activityName: a['activityName']?.toString() ?? '',
                departmentId: a['departmentId']?.toString() ??
                    (a['department'] is Map
                        ? a['department']['id']?.toString() ?? ''
                        : ''),
                standardManMinutes:
                    (a['standardManMinutes'] as num?)?.toDouble() ?? 0.0,
                isInRole: isInRole,
              );
            })
            .where((a) => a.id.isNotEmpty)
            .toList();
        _liveActivities = parsed.isNotEmpty ? parsed : mockActivities;
        debugPrint('✅ Activities loaded from API: ${parsed.length}');
      } else {
        _liveActivities = mockActivities;
      }

      // ── Map Sales Orders ─────────────────────────────────────────────
      final soData = results[2].data;
      if (soData is List) {
        final parsed = soData
            .map((s) {
              // soNumber is the display label; id is the UUID
              final soNumber = s['soNumber']?.toString() ?? '';
              final id = s['id']?.toString() ?? '';
              
              final List<String> deptIds = [];
              if (s['departments'] is List) {
                for (var d in s['departments']) {
                  if (d is Map && d['id'] != null) {
                    deptIds.add(d['id'].toString());
                  }
                }
              }
              
              final List<String> actIds = [];
              if (s['activities'] is List) {
                for (var a in s['activities']) {
                  if (a is Map && a['id'] != null) {
                    actIds.add(a['id'].toString());
                  }
                }
              } else if (s['departments'] is List) {
                for (var d in s['departments']) {
                  if (d is Map && d['activities'] is List) {
                    for (var a in d['activities']) {
                      if (a is Map && a['id'] != null) {
                        actIds.add(a['id'].toString());
                      }
                    }
                  }
                }
              }

              return SalesOrder(
                id: id, 
                label: soNumber,
                departmentIds: deptIds,
                activityIds: actIds,
              );
            })
            .where((s) => s.id.isNotEmpty)
            .toList();
        _liveSalesOrders = parsed.isNotEmpty ? parsed : mockSalesOrders;
        debugPrint('✅ Sales Orders loaded from API: ${parsed.length}');
      } else {
        _liveSalesOrders = mockSalesOrders;
      }
    } on DioException catch (e) {
      debugPrint(
        '⚠️ Dropdown API unreachable (${e.type.name}): ${e.response?.statusCode} - ${e.response?.data}',
      );
      _liveDepartments = mockDepartments;
      _liveActivities = mockActivities;
      _liveSalesOrders = mockSalesOrders;

      if (e.response?.statusCode == 401) {
        debugPrint('⚠️ Unauthorized token detected on dropdown load. Logging out user...');
        ref.read(authProvider.notifier).logout();
      }
    } catch (e) {
      debugPrint('⚠️ Unexpected error loading dropdowns: $e');
      _liveDepartments = mockDepartments;
      _liveActivities = mockActivities;
      _liveSalesOrders = mockSalesOrders;
    } finally {
      if (mounted) {
        state = state.copyWith(isLoadingDropdowns: false);
      }
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // Sales Order
  // ────────────────────────────────────────────────────────────────────────

  List<Department> getDepartmentsForSalesOrder(SalesOrder? so) {
    if (so == null) return const <Department>[];
    return _liveDepartments;
  }

  void selectSalesOrder(SalesOrder? so) {
    final allowedDepts = getDepartmentsForSalesOrder(so);
    
    Department? autoDept;
    if (so != null && allowedDepts.isNotEmpty) {
      autoDept = allowedDepts.firstWhere(
        (d) => !d.name.toUpperCase().contains('QUALITY') && !d.name.toUpperCase().contains('QC'),
        orElse: () => allowedDepts.first,
      );
    }

    state = state.copyWith(
      selectedSO: so,
      clearSelectedSO: so == null,
      selectedDepartment: autoDept,
      clearSelectedDepartment: autoDept == null,
      selectedActivity: null,
      clearSelectedActivity: true,
      isOtherActivity: false,
      otherActivityReason: '',
      remarks: '',
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // Department
  // ────────────────────────────────────────────────────────────────────────

  /// When the department changes, the selected activity is cleared because
  /// the activity list is department‑scoped.
  void selectDepartment(Department? department) {
    state = state.copyWith(
      selectedDepartment: department,
      clearSelectedDepartment: department == null,
      // Clear downstream selections
      clearSelectedActivity: true,
      isOtherActivity: false,
      showAllActivities: false,
      otherActivityReason: '',
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // Activity
  // ────────────────────────────────────────────────────────────────────────

  /// When an activity is selected, the [isOtherActivity] flag is set
  /// based on [Activity.isInRole] or if the activity belongs to a different department.
  /// If it is considered an "other" activity, a reason will be required.
  void selectActivity(Activity? activity) {
    final isOther = activity != null
        ? (activity.isInRole == false ||
            (state.selectedDepartment != null &&
                activity.departmentId != state.selectedDepartment!.id))
        : false;
    state = state.copyWith(
      selectedActivity: activity,
      clearSelectedActivity: activity == null,
      isOtherActivity: isOther,
      // Reset the reason when switching activities
      otherActivityReason: '',
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // Show All Activities toggle
  // ────────────────────────────────────────────────────────────────────────

  /// Safely toggles the [showAllActivities] flag.
  ///
  /// When `true`: UI shows the full activity list from live/mock data.
  /// When `false`: UI shows only department-filtered activities.
  /// If toggling off, resets the selected activity if it belongs to another department.
  void toggleShowAllActivities(bool value) {
    final activity = state.selectedActivity;
    final dept = state.selectedDepartment;

    bool clearActivity = false;
    Activity? nextActivity = activity;
    bool nextIsOther = state.isOtherActivity;
    String nextReason = state.otherActivityReason;

    if (!value && activity != null && dept != null) {
      if (activity.departmentId != dept.id) {
        nextActivity = null;
        clearActivity = true;
        nextIsOther = false;
        nextReason = '';
      }
    }

    state = state.copyWith(
      showAllActivities: value,
      selectedActivity: nextActivity,
      clearSelectedActivity: clearActivity,
      isOtherActivity: nextIsOther,
      otherActivityReason: nextReason,
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // Time
  // ────────────────────────────────────────────────────────────────────────

  void setStartTime(TimeOfDay time) {
    state = state.copyWith(startTime: time);
  }

  void setEndTime(TimeOfDay time) {
    state = state.copyWith(endTime: time);
  }

  // ────────────────────────────────────────────────────────────────────────
  // TASK 2 — Coworker (mock verification preserved — no API endpoint yet)
  // ────────────────────────────────────────────────────────────────────────

  void setVerifiedCoworkerDirectly(Coworker coworker) {
    state = state.copyWith(
      hasCoworker: true,
      coworkerIdInput: coworker.employeeId,
      verifiedCoworker: coworker,
      clearCoworkerError: true,
    );
  }

  void clearCoworker() {
    state = state.copyWith(
      hasCoworker: false,
      coworkerIdInput: '',
      clearVerifiedCoworker: true,
      clearCoworkerError: true,
    );
  }

  /// Toggles the "has coworker" switch. When turned off, clears all
  /// coworker‑related fields.
  void toggleCoworker(bool enabled) {
    state = state.copyWith(
      hasCoworker: enabled,
      coworkerIdInput: enabled ? state.coworkerIdInput : '',
      clearVerifiedCoworker: !enabled,
      clearCoworkerError: !enabled,
      isVerifyingCoworker: false,
    );
  }

  void setCoworkerId(String id) {
    state = state.copyWith(
      coworkerIdInput: id,
      // Reset verification when the input changes
      clearVerifiedCoworker: true,
      clearCoworkerError: true,
    );
  }

  /// Asynchronous mock verification of a coworker employee ID.
  ///
  /// - Sets [isVerifyingCoworker] while the lookup is in progress.
  /// - Simulates a 200 ms network delay.
  /// - Looks up the ID in [mockCoworkerDirectory].
  /// - Sets either [verifiedCoworker] or [coworkerError].
  Future<void> verifyCoworker() async {
    final idToFind = state.coworkerIdInput.trim();

    if (idToFind.isEmpty) {
      state = state.copyWith(coworkerError: 'Employee ID cannot be empty.');
      return;
    }

    // Start loading (simulate brief delay for UI feedback)
    state = state.copyWith(
      isVerifyingCoworker: true,
      clearCoworkerError: true,
      clearVerifiedCoworker: true,
    );

    // Look up in mockCoworkerDirectory
    final match = mockCoworkerDirectory.cast<Coworker?>().firstWhere(
      (c) => c!.employeeId.toUpperCase() == idToFind.toUpperCase(),
      orElse: () => null,
    );

    if (match != null) {
      state = state.copyWith(
        verifiedCoworker: match,
        isVerifyingCoworker: false,
        clearCoworkerError: true,
      );
    } else {
      state = state.copyWith(
        coworkerError: 'Employee does not exist',
        isVerifyingCoworker: false,
        clearVerifiedCoworker: true,
      );
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // Other Activity Reason
  // ────────────────────────────────────────────────────────────────────────

  void setOtherActivityReason(String reason) {
    state = state.copyWith(otherActivityReason: reason);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Remarks
  // ────────────────────────────────────────────────────────────────────────

  void setRemarks(String val) {
    state = state.copyWith(remarks: val);
  }

  // ────────────────────────────────────────────────────────────────────────
  // TASK 3 — Submit Report (live API + local mock fallback)
  // ────────────────────────────────────────────────────────────────────────

  /// Validates, checks duplicate guard, then:
  /// 1. Attempts POST to /activity-logs with Bearer token.
  /// 2. On success: updates local mock list + state.
  /// 3. On API failure: falls back to local mock submission flow.
  Future<void> submit() async {
    if (!state.canSubmit) return;

    // Always clear previous submission errors before a new attempt.
    state = state.copyWith(
      clearDuplicateError: true,
      clearSubmitErrorMessage: true,
      clearSubmitSuccessMessage: true,
    );

    // ── Validate required selections exist ─────────────────────────────
    if (state.selectedSO == null ||
        state.selectedDepartment == null ||
        state.selectedActivity == null) {
      state = state.copyWith(
        submitErrorMessage: 'Please fill in all required fields.',
      );
      return;
    }

    // ── Duplicate guard ────────────────────────────────────────────────
    final today = DateTime.now();
    final todayDate = DateTime(today.year, today.month, today.day);

    final isDuplicate = mockSubmittedReports.any((report) {
      // Bypass duplicate guard against itself if currently editing
      if (state.editingReportId == report.reportId) {
        return false;
      }
      final reportDate = DateTime(
        report.submittedDate.year,
        report.submittedDate.month,
        report.submittedDate.day,
      );
      return report.salesOrderId == state.selectedSO!.id &&
          report.departmentId == state.selectedDepartment!.id &&
          report.activityId == state.selectedActivity!.id &&
          reportDate == todayDate;
    });

    if (isDuplicate) {
      state = state.copyWith(
        duplicateError:
            'This activity already exists for today. '
            'Additional work must be added as an Additional Time Slot.',
      );
      return;
    }

    // ── Build debug payload (preserved from Day 1) ─────────────────────
    final payload = <String, dynamic>{
      'salesOrder': state.selectedSO?.id,
      'department': state.selectedDepartment?.name,
      'activity': state.selectedActivity?.activityName,
      'activityCode': state.selectedActivity?.activityCode,
      'startTime': state.startTime != null
          ? '${state.startTime!.hour.toString().padLeft(2, '0')}:${state.startTime!.minute.toString().padLeft(2, '0')}'
          : null,
      'endTime': state.endTime != null
          ? '${state.endTime!.hour.toString().padLeft(2, '0')}:${state.endTime!.minute.toString().padLeft(2, '0')}'
          : null,
      'durationMinutes': state.durationMinutes,
      'hasCoworker': state.hasCoworker,
      'coworkerId': state.verifiedCoworker?.employeeId,
      'coworkerName': state.verifiedCoworker?.name,
      'totalWorkers': state.totalWorkers,
      'actualManMinutes': state.actualManMinutes,
      'standardManMinutes': state.selectedActivity?.standardManMinutes,
      'productivityPercent':
          double.parse(state.productivityPercent.toStringAsFixed(1)),
      'isOtherActivity': state.isOtherActivity,
      'otherActivityReason':
          state.isOtherActivity ? state.otherActivityReason : null,
    };

    debugPrint('══════════════════════════════════════════════════════');
    debugPrint('📋 DAILY REPORT PAYLOAD');
    debugPrint('══════════════════════════════════════════════════════');
    payload.forEach((key, value) {
      debugPrint('  $key: $value');
    });
    debugPrint('══════════════════════════════════════════════════════');

    // ── Set submitting state ───────────────────────────────────────────
    state = state.copyWith(isSubmitting: true);

    bool apiSuccess = false;

    try {
      final now = DateTime.now();
      final start = state.startTime ?? const TimeOfDay(hour: 8, minute: 0);
      final end = state.endTime ?? const TimeOfDay(hour: 9, minute: 0);

      final startDateTime = DateTime(now.year, now.month, now.day, start.hour, start.minute);
      var endDateTime = DateTime(now.year, now.month, now.day, end.hour, end.minute);
      if (endDateTime.isBefore(startDateTime)) {
        endDateTime = endDateTime.add(const Duration(days: 1));
      }

      // Build the API request body as per backend spec
      final apiBody = <String, dynamic>{
        'soId': state.selectedSO!.id,
        'departmentId': state.selectedDepartment!.id,
        'activityId': state.selectedActivity!.id,
        'durationMinutes': state.durationMinutes,
        'remarks': state.remarks.isNotEmpty
            ? state.remarks
            : (state.isOtherActivity ? state.otherActivityReason : ''),
        'coworkerEmployeeIds': state.hasCoworker &&
                state.verifiedCoworker != null
            ? [state.verifiedCoworker!.employeeId]
            : <String>[],
        'startTime': '${start.hour.toString().padLeft(2, '0')}:${start.minute.toString().padLeft(2, '0')}',
        'endTime': '${end.hour.toString().padLeft(2, '0')}:${end.minute.toString().padLeft(2, '0')}',
      };

      final String finalUrl = '$_baseUrl/activity-logs';
      final Map<String, String> headers = _authHeaders();
      final rawToken = _getToken() ?? '';

      // ── [DEBUG] Task 1: Print request details ─────────────────────────
      debugPrint('🔍 [DEBUG] Submit API token (first 50): ${rawToken.length > 50 ? rawToken.substring(0, 50) : rawToken}');
      debugPrint('🔍 [DEBUG] Final POST URL  : $finalUrl');
      debugPrint('🔍 [DEBUG] Request headers : $headers');
      // ──────────────────────────────────────────────────────────────────
      
      // ── [DEBUG] Task 3: Decode JWT ────────────────────────────────────
      if (rawToken.isNotEmpty) {
        try {
          final parts = rawToken.split('.');
          if (parts.length == 3) {
            final payloadStr = String.fromCharCodes(
                const Base64Codec().decode(base64Url.normalize(parts[1])));
            debugPrint('🔍 [DEBUG] Decoded JWT: $payloadStr');
          }
        } catch (e) {
          debugPrint('🔍 [DEBUG] Failed to decode JWT: $e');
        }
      }
      // ──────────────────────────────────────────────────────────────────

      // ── [DEBUG] Task 4: GET Test ──────────────────────────────────────
      try {
        final getResp = await _dio.get(finalUrl, options: Options(headers: headers));
        debugPrint('🔍 [DEBUG] GET $finalUrl status: ${getResp.statusCode}');
      } on DioException catch (ge) {
        debugPrint('🔍 [DEBUG] GET $finalUrl error status: ${ge.response?.statusCode}');
      }
      // ──────────────────────────────────────────────────────────────────

      final response = await _dio.post(
        finalUrl,
        data: apiBody,
        options: Options(headers: headers),
      );

      // ── [DEBUG] Task 1: Print response details ────────────────────────
      debugPrint('🔍 [DEBUG] Response status : ${response.statusCode}');
      debugPrint('🔍 [DEBUG] Response body   : ${response.data}');
      // ──────────────────────────────────────────────────────────────────

      apiSuccess = true;
      debugPrint('✅ Activity log submitted to live API successfully.');
    } on DioException catch (e) {
      // ── [DEBUG] Task 1: Print DioException details ────────────────────
      debugPrint('🔍 [DEBUG] DioException status : ${e.response?.statusCode}');
      debugPrint('🔍 [DEBUG] DioException body   : ${e.response?.data}');
      // ──────────────────────────────────────────────────────────────────

      if (e.response != null) {
        if (e.response?.statusCode == 401) {
          debugPrint('⚠️ Unauthorized token detected on submit. Logging out user...');
          ref.read(authProvider.notifier).logout();
        }
        // Server responded with an error — show it, do NOT fall back to mock
        final serverMsg = _extractServerError(e.response!.data);
        debugPrint(
          '❌ Submit API error ${e.response!.statusCode}: $serverMsg',
        );
        if (mounted) {
          state = state.copyWith(
            isSubmitting: false,
            submitErrorMessage: serverMsg,
          );
        }
        return;
      }
      // Network/timeout failure → fall back to mock submission
      debugPrint(
        '⚠️ Submit API unreachable (${e.type.name}), using local mock fallback.',
      );
    } catch (e) {
      debugPrint('⚠️ Unexpected submit error, using local mock fallback: $e');
    }

    if (!mounted) return;
    state = state.copyWith(isSubmitting: false);

    // ── Build local SubmittedReport (always run — API success or mock) ──
    final nextId = 'REP-${DateTime.now().millisecondsSinceEpoch}';
    final startStr = state.startTime != null
        ? '${state.startTime!.hour.toString().padLeft(2, '0')}:${state.startTime!.minute.toString().padLeft(2, '0')}'
        : '';
    final endStr = state.endTime != null
        ? '${state.endTime!.hour.toString().padLeft(2, '0')}:${state.endTime!.minute.toString().padLeft(2, '0')}'
        : '';

    final updatedReport = SubmittedReport(
      reportId: state.editingReportId ?? nextId,
      salesOrderId: state.selectedSO!.id,
      departmentId: state.selectedDepartment!.id,
      activityId: state.selectedActivity!.id,
      salesOrder: state.selectedSO!.label,
      department: state.selectedDepartment!.name,
      activity: state.selectedActivity!.activityName,
      startTime: startStr,
      endTime: endStr,
      durationMinutes: state.durationMinutes,
      productivityPercent:
          double.parse(state.productivityPercent.toStringAsFixed(1)),
      workerName: 'Main Operator',
      workerRole: 'Production Worker',
      workerEmployeeId: Hive.box('authBox').get('employeeId') as String? ?? 'EMP-1042',
      submittedDate: todayDate,
      status: 'Pending',
      coworkerId: state.verifiedCoworker?.employeeId,
      coworkerName: state.verifiedCoworker?.name,
      otherActivityReason:
          state.isOtherActivity ? state.otherActivityReason : null,
      remarks: state.remarks.isNotEmpty ? state.remarks : null,
    );

    // ── Insert or Update mock submitted reports ────────────────────────
    if (state.editingReportId != null) {
      final index = mockSubmittedReports
          .indexWhere((r) => r.reportId == state.editingReportId);
      if (index != -1) {
        mockSubmittedReports[index] = updatedReport;
        debugPrint(
          '✅ Report updated in-place (Rework). ID: ${state.editingReportId}',
        );
      } else {
        mockSubmittedReports.add(updatedReport);
      }
    } else {
      mockSubmittedReports.add(updatedReport);
      debugPrint(
        '✅ New report appended. Total submitted: ${mockSubmittedReports.length}',
      );
    }

    final successMsg = apiSuccess
        ? 'Report submitted to server successfully!'
        : 'Report saved locally (server unavailable).';

    state = state.copyWith(
      submitSuccessMessage: successMsg,
      clearDuplicateError: true,
      clearSubmitErrorMessage: true,
      clearEditingReportId: true,
    );
  }

  /// Clears the success message so subsequent builds don't re‑trigger
  /// the snackbar.
  void clearSubmitSuccess() {
    state = state.copyWith(clearSubmitSuccessMessage: true);
  }

  /// Clears the duplicate error (e.g. when user dismisses the banner).
  void clearDuplicateError() {
    state = state.copyWith(clearDuplicateError: true);
  }

  /// Clears the generic submit error.
  void clearSubmitError() {
    state = state.copyWith(clearSubmitErrorMessage: true);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Rework Flow
  // ────────────────────────────────────────────────────────────────────────

  /// Overwrites the current form state with details from an existing [SubmittedReport]
  /// to load it back for rework/editing.
  void loadReportForRework(SubmittedReport oldReport) {
    // 1. Resolve SalesOrder — check live list first, fall back to mock
    final so = _liveSalesOrders.cast<SalesOrder?>().firstWhere(
          (s) => s!.id == oldReport.salesOrderId,
          orElse: () => null,
        );

    // 2. Resolve Department
    final dept = _liveDepartments.cast<Department?>().firstWhere(
          (d) => d!.id == oldReport.departmentId,
          orElse: () => null,
        );

    // 3. Resolve Activity
    final activity = _liveActivities.cast<Activity?>().firstWhere(
          (a) => a!.id == oldReport.activityId,
          orElse: () => null,
        );

    // 4. Parse Start & End Times
    final startTime = _parseTime(oldReport.startTime);
    final endTime = _parseTime(oldReport.endTime);

    // 5. Resolve Coworker (mock directory — no live API yet)
    final hasCoworker = oldReport.coworkerId != null;
    final coworker = hasCoworker
        ? mockCoworkerDirectory.cast<Coworker?>().firstWhere(
              (c) => c!.employeeId == oldReport.coworkerId,
              orElse: () => null,
            )
        : null;

    // 6. Resolve if Other Activity
    final isOther = activity != null
        ? (activity.isInRole == false ||
            (dept != null && activity.departmentId != dept.id))
        : false;

    // 7. Should we show all activities?
    final showAll =
        activity != null && dept != null && activity.departmentId != dept.id;

    // Safely overwrite entire state and clear any validation/submit errors
    state = DailyReportState(
      selectedSO: so,
      selectedDepartment: dept,
      selectedActivity: activity,
      startTime: startTime,
      endTime: endTime,
      hasCoworker: hasCoworker,
      coworkerIdInput: oldReport.coworkerId ?? '',
      verifiedCoworker: coworker,
      isOtherActivity: isOther,
      showAllActivities: showAll,
      otherActivityReason: oldReport.otherActivityReason ?? '',
      remarks: oldReport.remarks ?? '',
      editingReportId: oldReport.reportId,
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ────────────────────────────────────────────────────────────────────────

  /// Parses an "HH:MM" time string into [TimeOfDay].
  TimeOfDay? _parseTime(String timeStr) {
    if (timeStr.isEmpty) return null;
    final parts = timeStr.split(':');
    if (parts.length != 2) return null;
    final hour = int.tryParse(parts[0]);
    final minute = int.tryParse(parts[1]);
    if (hour == null || minute == null) return null;
    return TimeOfDay(hour: hour, minute: minute);
  }

  /// Extracts a human-readable message from a server error response body.
  String _extractServerError(dynamic data) {
    if (data is Map<String, dynamic>) {
      return (data['message'] as String?) ??
          (data['error'] as String?) ??
          'Submission failed. Please try again.';
    }
    return 'Submission failed. Please try again.';
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────────────────────────────────

/// Global Riverpod provider for the Daily Report feature.
final dailyReportProvider =
    StateNotifierProvider<DailyReportNotifier, DailyReportState>(
  (ref) {
    ref.watch(authProvider);
    return DailyReportNotifier(ref);
  },
);
