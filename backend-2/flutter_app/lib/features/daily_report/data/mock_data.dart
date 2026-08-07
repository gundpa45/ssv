/// Mock data for the Daily Report feature.
///
/// Contains hardcoded departments, activities, sales orders,
/// and a coworker directory for development and testing.
library;

// ---------------------------------------------------------------------------
// Department
// ---------------------------------------------------------------------------

class Department {
  final String id;
  final String name;

  const Department({required this.id, required this.name});

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Department && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;
}

const List<Department> mockDepartments = [
  Department(id: 'DEPT-01', name: 'Assembly'),
  Department(id: 'DEPT-02', name: 'Welding'),
  Department(id: 'DEPT-03', name: 'Quality Control'),
  Department(id: 'DEPT-04', name: 'Painting'),
];

// ---------------------------------------------------------------------------
// Activity
// ---------------------------------------------------------------------------

class Activity {
  final String id;
  final String activityCode;
  final String activityName;
  final String departmentId;
  final double standardManMinutes;
  final bool isInRole;

  const Activity({
    required this.id,
    required this.activityCode,
    required this.activityName,
    required this.departmentId,
    required this.standardManMinutes,
    required this.isInRole,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Activity && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;
}

const List<Activity> mockActivities = [
  // ── Assembly (DEPT-01) ────────────────────────────────────────────────
  Activity(
    id: 'ACT-001',
    activityCode: 'ASM-100',
    activityName: 'Frame Assembly',
    departmentId: 'DEPT-01',
    standardManMinutes: 45,
    isInRole: true,
  ),
  Activity(
    id: 'ACT-002',
    activityCode: 'ASM-101',
    activityName: 'Wiring Harness Install',
    departmentId: 'DEPT-01',
    standardManMinutes: 30,
    isInRole: true,
  ),
  Activity(
    id: 'ACT-003',
    activityCode: 'ASM-199',
    activityName: 'General Assembly Support',
    departmentId: 'DEPT-01',
    standardManMinutes: 60,
    isInRole: false, // ← triggers Other Activity rule
  ),

  // ── Welding (DEPT-02) ─────────────────────────────────────────────────
  Activity(
    id: 'ACT-004',
    activityCode: 'WLD-200',
    activityName: 'MIG Welding',
    departmentId: 'DEPT-02',
    standardManMinutes: 50,
    isInRole: true,
  ),
  Activity(
    id: 'ACT-005',
    activityCode: 'WLD-201',
    activityName: 'TIG Welding',
    departmentId: 'DEPT-02',
    standardManMinutes: 55,
    isInRole: true,
  ),
  Activity(
    id: 'ACT-006',
    activityCode: 'WLD-299',
    activityName: 'Welding Area Cleanup',
    departmentId: 'DEPT-02',
    standardManMinutes: 20,
    isInRole: false, // ← triggers Other Activity rule
  ),

  // ── Quality Control (DEPT-03) ─────────────────────────────────────────
  Activity(
    id: 'ACT-007',
    activityCode: 'QC-300',
    activityName: 'Visual Inspection',
    departmentId: 'DEPT-03',
    standardManMinutes: 25,
    isInRole: true,
  ),
  Activity(
    id: 'ACT-008',
    activityCode: 'QC-301',
    activityName: 'Dimensional Check',
    departmentId: 'DEPT-03',
    standardManMinutes: 35,
    isInRole: true,
  ),
  Activity(
    id: 'ACT-009',
    activityCode: 'QC-302',
    activityName: 'Stress Test',
    departmentId: 'DEPT-03',
    standardManMinutes: 40,
    isInRole: true,
  ),

  // ── Painting (DEPT-04) ────────────────────────────────────────────────
  Activity(
    id: 'ACT-010',
    activityCode: 'PNT-400',
    activityName: 'Surface Prep & Sanding',
    departmentId: 'DEPT-04',
    standardManMinutes: 30,
    isInRole: true,
  ),
  Activity(
    id: 'ACT-011',
    activityCode: 'PNT-401',
    activityName: 'Spray Painting',
    departmentId: 'DEPT-04',
    standardManMinutes: 40,
    isInRole: true,
  ),
  Activity(
    id: 'ACT-012',
    activityCode: 'PNT-499',
    activityName: 'Paint Booth Maintenance',
    departmentId: 'DEPT-04',
    standardManMinutes: 60,
    isInRole: false, // ← triggers Other Activity rule
  ),
];

// ---------------------------------------------------------------------------
// Sales Orders
// ---------------------------------------------------------------------------

class SalesOrder {
  final String id;
  final String label;
  final List<String> departmentIds;
  final List<String> activityIds;

  const SalesOrder({
    required this.id, 
    required this.label,
    this.departmentIds = const [],
    this.activityIds = const [],
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SalesOrder && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;
}

const List<SalesOrder> mockSalesOrders = [
  SalesOrder(
    id: 'SO-2025-001',
    label: 'SO-2025-001',
    departmentIds: ['DEPT-01', 'DEPT-03'],
    activityIds: ['ACT-001', 'ACT-002', 'ACT-007', 'ACT-008'],
  ),
  SalesOrder(
    id: 'SO-2025-002',
    label: 'SO-2025-002',
    departmentIds: ['DEPT-01', 'DEPT-03'],
    activityIds: ['ACT-002', 'ACT-007', 'ACT-008'],
  ),
  SalesOrder(
    id: 'SO-2025-003',
    label: 'SO-2025-003',
    departmentIds: ['DEPT-02', 'DEPT-03'],
    activityIds: ['ACT-006', 'ACT-007', 'ACT-008'],
  ),
  SalesOrder(
    id: 'SO-2025-004',
    label: 'SO-2025-004',
    departmentIds: ['DEPT-04', 'DEPT-03'],
    activityIds: ['ACT-010', 'ACT-011', 'ACT-012', 'ACT-007', 'ACT-008'],
  ),
];

// ---------------------------------------------------------------------------
// Coworker Directory (for mock verification)
// ---------------------------------------------------------------------------

class Coworker {
  final String employeeId;
  final String name;
  final String department;

  const Coworker({
    required this.employeeId,
    required this.name,
    required this.department,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Coworker &&
          runtimeType == other.runtimeType &&
          employeeId == other.employeeId;

  @override
  int get hashCode => employeeId.hashCode;
}

/// Mock directory used by [DailyReportNotifier.verifyCoworker] to simulate
/// an employee lookup.
const List<Coworker> mockCoworkerDirectory = [
  Coworker(employeeId: 'EMP-1042', name: 'Rajesh Kumar', department: 'Assembly'),
  Coworker(employeeId: 'EMP-2011', name: 'Anita Sharma', department: 'Welding'),
  Coworker(employeeId: 'EMP-3087', name: 'Vikram Patel', department: 'Quality Control'),
  Coworker(employeeId: 'EMP-4056', name: 'Priya Desai', department: 'Painting'),
];

// ---------------------------------------------------------------------------
// Submitted Reports (mock persistence layer for duplicate guard)
// ---------------------------------------------------------------------------

/// Represents a successfully submitted daily activity report.
///
/// Used by [DailyReportNotifier.submit] to detect duplicate entries
/// for the same Sales Order + Department + Activity on the same calendar date.
class SubmittedReport {
  final String reportId;
  final String salesOrderId;
  final String departmentId;
  final String activityId;
  final String salesOrder;
  final String department;
  final String activity;
  final String startTime;
  final String endTime;
  final int durationMinutes;
  final double productivityPercent;
  final String workerName;
  final String workerRole;
  final String workerEmployeeId;
  final DateTime submittedDate; // calendar date only (time zeroed)
  final String status; // 'Pending', 'Approved', 'Rework Assigned'
  final String? coworkerId;
  final String? coworkerName;
  final String? otherActivityReason;
  final String? remarks;
  final String? managerRemarks;
  final bool isRework;

  const SubmittedReport({
    required this.reportId,
    required this.salesOrderId,
    required this.departmentId,
    required this.activityId,
    required this.salesOrder,
    required this.department,
    required this.activity,
    required this.startTime,
    required this.endTime,
    required this.durationMinutes,
    required this.productivityPercent,
    required this.workerName,
    required this.workerRole,
    required this.workerEmployeeId,
    required this.submittedDate,
    required this.status,
    this.coworkerId,
    this.coworkerName,
    this.otherActivityReason,
    this.remarks,
    this.managerRemarks,
    this.isRework = false,
  });
}

/// Mutable list that acts as a session-level mock database of submitted
/// reports. The notifier appends to this on every successful submit and
/// scans it before each new submit to enforce the duplicate guard.
final List<SubmittedReport> mockSubmittedReports = [
  SubmittedReport(
    reportId: 'REP-001',
    salesOrderId: 'SO-2025-001',
    departmentId: 'DEPT-01',
    activityId: 'ACT-001',
    salesOrder: 'SO-2025-001',
    department: 'Assembly',
    activity: 'Frame Assembly',
    startTime: '08:00',
    endTime: '09:30',
    durationMinutes: 90,
    productivityPercent: 100.0,
    workerName: 'Amit Patel',
    workerRole: 'Senior Assembler',
    workerEmployeeId: 'EMP-1001',
    submittedDate: DateTime.now().subtract(const Duration(days: 2)),
    status: 'Approved',
    coworkerId: null,
    coworkerName: null,
    otherActivityReason: null,
  ),
  SubmittedReport(
    reportId: 'REP-002',
    salesOrderId: 'SO-2025-002',
    departmentId: 'DEPT-02',
    activityId: 'ACT-004',
    salesOrder: 'SO-2025-002',
    department: 'Welding',
    activity: 'MIG Welding',
    startTime: '10:00',
    endTime: '11:30',
    durationMinutes: 90,
    productivityPercent: 111.1,
    workerName: 'Rajesh Kumar',
    workerRole: 'MIG Welder',
    workerEmployeeId: 'EMP-1042',
    submittedDate: DateTime.now().subtract(const Duration(days: 1)),
    status: 'Pending',
    coworkerId: 'EMP-2011',
    coworkerName: 'Anita Sharma',
    otherActivityReason: null,
  ),
  SubmittedReport(
    reportId: 'REP-003',
    salesOrderId: 'SO-2025-003',
    departmentId: 'DEPT-03',
    activityId: 'ACT-007',
    salesOrder: 'SO-2025-003',
    department: 'Quality Control',
    activity: 'Visual Inspection',
    startTime: '13:00',
    endTime: '14:00',
    durationMinutes: 60,
    productivityPercent: 83.3,
    workerName: 'Suresh Sen',
    workerRole: 'Quality Inspector',
    workerEmployeeId: 'EMP-1003',
    submittedDate: DateTime.now().subtract(const Duration(hours: 4)),
    status: 'Rework Assigned',
    coworkerId: null,
    coworkerName: null,
    otherActivityReason: 'Outside assigned shift, requested by supervisor to cover visual inspection.',
  ),
];
