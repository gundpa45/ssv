import 'package:flutter/material.dart';

import '../data/mock_data.dart';

/// Immutable state for the Daily Report form.
///
/// All derived / computed values live as getters on this class so that
/// widgets never contain business logic — they simply read state.
class DailyReportState {
  final SalesOrder? selectedSO;
  final Department? selectedDepartment;
  final Activity? selectedActivity;
  final TimeOfDay? startTime;
  final TimeOfDay? endTime;
  final bool hasCoworker;
  final String coworkerIdInput;
  final Coworker? verifiedCoworker;
  final bool isVerifyingCoworker;
  final String? coworkerError;
  final bool isOtherActivity;
  final bool showAllActivities;
  final String otherActivityReason;
  final String remarks;
  final String? duplicateError;
  final String? submitErrorMessage;
  final String? submitSuccessMessage;
  final String? editingReportId;

  /// Whether live dropdown data is currently being fetched from the API.
  final bool isLoadingDropdowns;

  /// Whether a report submission API call is currently in progress.
  final bool isSubmitting;

  const DailyReportState({
    this.selectedSO,
    this.selectedDepartment,
    this.selectedActivity,
    this.startTime,
    this.endTime,
    this.hasCoworker = false,
    this.coworkerIdInput = '',
    this.verifiedCoworker,
    this.isVerifyingCoworker = false,
    this.coworkerError,
    this.isOtherActivity = false,
    this.showAllActivities = false,
    this.otherActivityReason = '',
    this.remarks = '',
    this.duplicateError,
    this.submitErrorMessage,
    this.submitSuccessMessage,
    this.editingReportId,
    this.isLoadingDropdowns = false,
    this.isSubmitting = false,
  });

  // ────────────────────────────────────────────────────────────────────────
  // Derived getters (business‐logic calculations live HERE, not in widgets)
  // ────────────────────────────────────────────────────────────────────────

  /// Duration between [startTime] and [endTime] in minutes.
  ///
  /// Returns `0` when either time is null or when endTime is not after
  /// startTime (invalid range).
  int get durationMinutes {
    if (startTime == null || endTime == null) return 0;

    final startMinutes = startTime!.hour * 60 + startTime!.minute;
    final endMinutes = endTime!.hour * 60 + endTime!.minute;

    final diff = endMinutes - startMinutes;
    return diff > 0 ? diff : 0;
  }

  /// Number of workers on this activity.
  ///
  /// Always at least 1 (the main worker). A successfully verified
  /// coworker adds +1.
  int get totalWorkers {
    int count = 1; // main worker
    if (verifiedCoworker != null) count += 1;
    return count;
  }

  /// Actual man‑minutes consumed: `durationMinutes × totalWorkers`.
  int get actualManMinutes => durationMinutes * totalWorkers;

  /// Productivity as a percentage:
  /// `(standardManMinutes / actualManMinutes) × 100`.
  ///
  /// Returns `0.0` when [actualManMinutes] is zero (avoids division by
  /// zero) or when no activity is selected.
  double get productivityPercent {
    if (selectedActivity == null || actualManMinutes == 0) return 0.0;
    return (selectedActivity!.standardManMinutes / actualManMinutes) * 100;
  }

  /// Whether the form has enough valid data to submit.
  bool get canSubmit {
    // Must have an activity selected
    if (selectedActivity == null) return false;

    // Times must produce a valid positive duration
    if (durationMinutes <= 0) return false;

    // If coworker toggle is on, coworker must be verified
    if (hasCoworker && verifiedCoworker == null) return false;

    // If this is an "other" activity, a reason is mandatory
    if (isOtherActivity && otherActivityReason.trim().isEmpty) return false;

    // Cannot submit while already submitting
    if (isSubmitting) return false;

    return true;
  }

  // ────────────────────────────────────────────────────────────────────────
  // copyWith — manual implementation (no freezed / code‑gen)
  // ────────────────────────────────────────────────────────────────────────

  /// Creates a copy of this state with the given fields replaced.
  ///
  /// Nullable fields use a wrapper sentinel so callers can explicitly set
  /// them to `null` via the `clearX` parameters.
  DailyReportState copyWith({
    SalesOrder? selectedSO,
    bool clearSelectedSO = false,
    Department? selectedDepartment,
    bool clearSelectedDepartment = false,
    Activity? selectedActivity,
    bool clearSelectedActivity = false,
    TimeOfDay? startTime,
    bool clearStartTime = false,
    TimeOfDay? endTime,
    bool clearEndTime = false,
    bool? hasCoworker,
    String? coworkerIdInput,
    Coworker? verifiedCoworker,
    bool clearVerifiedCoworker = false,
    bool? isVerifyingCoworker,
    String? coworkerError,
    bool clearCoworkerError = false,
    bool? isOtherActivity,
    bool? showAllActivities,
    String? otherActivityReason,
    String? remarks,
    String? duplicateError,
    bool clearDuplicateError = false,
    String? submitErrorMessage,
    bool clearSubmitErrorMessage = false,
    String? submitSuccessMessage,
    bool clearSubmitSuccessMessage = false,
    String? editingReportId,
    bool clearEditingReportId = false,
    bool? isLoadingDropdowns,
    bool? isSubmitting,
  }) {
    return DailyReportState(
      selectedSO:
          clearSelectedSO ? null : (selectedSO ?? this.selectedSO),
      selectedDepartment:
          clearSelectedDepartment
              ? null
              : (selectedDepartment ?? this.selectedDepartment),
      selectedActivity:
          clearSelectedActivity
              ? null
              : (selectedActivity ?? this.selectedActivity),
      startTime: clearStartTime ? null : (startTime ?? this.startTime),
      endTime: clearEndTime ? null : (endTime ?? this.endTime),
      hasCoworker: hasCoworker ?? this.hasCoworker,
      coworkerIdInput: coworkerIdInput ?? this.coworkerIdInput,
      verifiedCoworker:
          clearVerifiedCoworker
              ? null
              : (verifiedCoworker ?? this.verifiedCoworker),
      isVerifyingCoworker:
          isVerifyingCoworker ?? this.isVerifyingCoworker,
      coworkerError:
          clearCoworkerError ? null : (coworkerError ?? this.coworkerError),
      isOtherActivity: isOtherActivity ?? this.isOtherActivity,
      showAllActivities:
          showAllActivities ?? this.showAllActivities,
      otherActivityReason:
          otherActivityReason ?? this.otherActivityReason,
      remarks: remarks ?? this.remarks,
      duplicateError:
          clearDuplicateError
              ? null
              : (duplicateError ?? this.duplicateError),
      submitErrorMessage:
          clearSubmitErrorMessage
              ? null
              : (submitErrorMessage ?? this.submitErrorMessage),
      submitSuccessMessage:
          clearSubmitSuccessMessage
              ? null
              : (submitSuccessMessage ?? this.submitSuccessMessage),
      editingReportId:
          clearEditingReportId ? null : (editingReportId ?? this.editingReportId),
      isLoadingDropdowns: isLoadingDropdowns ?? this.isLoadingDropdowns,
      isSubmitting: isSubmitting ?? this.isSubmitting,
    );
  }
}
