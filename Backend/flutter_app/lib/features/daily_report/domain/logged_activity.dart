enum ActivityStatus {
  completed,
  ongoing,
  pending,
}

class LoggedActivity {
  final String id;
  final String title;
  final String activityCode;
  final String departmentName;
  final String? salesOrderId;
  final String timeString; // e.g. "08:00 AM - 10:30 AM" or "01:00 PM - Present" or "Scheduled"
  final ActivityStatus status;
  final DateTime date;
  final int durationMinutes; // 0 for ongoing/pending
  final double productivityPercent; // 0.0 for ongoing/pending
  final bool hasCoworker;
  final String? coworkerName;
  final bool isOtherActivity;
  final String? otherActivityReason;

  const LoggedActivity({
    required this.id,
    required this.title,
    required this.activityCode,
    required this.departmentName,
    this.salesOrderId,
    required this.timeString,
    required this.status,
    required this.date,
    this.durationMinutes = 0,
    this.productivityPercent = 0.0,
    this.hasCoworker = false,
    this.coworkerName,
    this.isOtherActivity = false,
    this.otherActivityReason,
  });

  LoggedActivity copyWith({
    String? id,
    String? title,
    String? activityCode,
    String? departmentName,
    String? salesOrderId,
    String? timeString,
    ActivityStatus? status,
    DateTime? date,
    int? durationMinutes,
    double? productivityPercent,
    bool? hasCoworker,
    String? coworkerName,
    bool? isOtherActivity,
    String? otherActivityReason,
  }) {
    return LoggedActivity(
      id: id ?? this.id,
      title: title ?? this.title,
      activityCode: activityCode ?? this.activityCode,
      departmentName: departmentName ?? this.departmentName,
      salesOrderId: salesOrderId ?? this.salesOrderId,
      timeString: timeString ?? this.timeString,
      status: status ?? this.status,
      date: date ?? this.date,
      durationMinutes: durationMinutes ?? this.durationMinutes,
      productivityPercent: productivityPercent ?? this.productivityPercent,
      hasCoworker: hasCoworker ?? this.hasCoworker,
      coworkerName: coworkerName ?? this.coworkerName,
      isOtherActivity: isOtherActivity ?? this.isOtherActivity,
      otherActivityReason: otherActivityReason ?? this.otherActivityReason,
    );
  }
}
