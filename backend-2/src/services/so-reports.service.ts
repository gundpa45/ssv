import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

import {
  SOReportFilterDto,
  ReportStatus,
  ReportPeriod,
} from '../modules/sales-orders/dto/so-report-filter.dto';

import * as ExcelJS from 'exceljs';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');

@Injectable()
export class SOReportsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ─── Date Range Builder ──────────────────────────────────

  private getDateRange(filters: SOReportFilterDto): {
    fromDate?: Date;
    toDate?: Date;
  } {
    const now = new Date();

    if (
      filters.period === ReportPeriod.CUSTOM &&
      filters.fromDate &&
      filters.toDate
    ) {
      return {
        fromDate: new Date(filters.fromDate),
        toDate: new Date(filters.toDate),
      };
    }

    switch (filters.period) {
      case ReportPeriod.DAILY: {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { fromDate: start, toDate: end };
      }

      case ReportPeriod.WEEKLY: {
        const start = new Date(now);
        start.setDate(
          start.getDate() - start.getDay(),
        );
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { fromDate: start, toDate: end };
      }

      case ReportPeriod.MONTHLY: {
        const start = new Date(
          now.getFullYear(),
          now.getMonth(),
          1,
        );
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { fromDate: start, toDate: end };
      }

      case ReportPeriod.YEARLY: {
        const start = new Date(
          now.getFullYear(),
          0,
          1,
        );
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { fromDate: start, toDate: end };
      }

      default:
        // No period filter — use from/to if provided
        return {
          fromDate: filters.fromDate
            ? new Date(filters.fromDate)
            : undefined,
          toDate: filters.toDate
            ? new Date(filters.toDate)
            : undefined,
        };
    }
  }

  private buildActivityLogWhere(
    soId: string | undefined,
    filters: SOReportFilterDto,
  ) {
    const { fromDate, toDate } =
      this.getDateRange(filters);

    const where: any = {};

    if (soId) {
      where.soId = soId;
    }

    if (fromDate || toDate) {
      where.activityDate = {};
      if (fromDate) where.activityDate.gte = fromDate;
      if (toDate) where.activityDate.lte = toDate;
    }

    return where;
  }

  private buildSOWhere(
    filters: SOReportFilterDto,
  ) {
    const where: any = { isDeleted: false };

    if (filters.status === ReportStatus.ACTIVE) {
      where.isActive = true;
    } else if (
      filters.status === ReportStatus.INACTIVE
    ) {
      where.isActive = false;
    }

    return where;
  }

  // ─── 1. SO Summary Report ────────────────────────────────

  async getSOSummaryReport(
    filters: SOReportFilterDto,
  ) {
    const soWhere = this.buildSOWhere(filters);

    const salesOrders =
      await this.prisma.salesOrder.findMany({
        where: soWhere,
        orderBy: { createdAt: 'desc' },
      });

    const activeDepartmentsCount = await this.prisma.department.count({
      where: {
        isActive: true,
        isDeleted: false,
      },
    });

    const logWhere =
      this.buildActivityLogWhere(undefined, filters);

    const activityLogs =
      await this.prisma.activityLog.findMany({
        where: logWhere,
        include: {
          activity: true,
          slots: true,
        },
      });

    // Group logs by soId
    const logsBySO = new Map<string, typeof activityLogs>();
    for (const log of activityLogs) {
      const existing = logsBySO.get(log.soId) || [];
      existing.push(log);
      logsBySO.set(log.soId, existing);
    }

    const soRows = salesOrders.map((so) => {
      const soLogs = logsBySO.get(so.id) || [];

      const totalEmployees = new Set(
        soLogs.map((l) => l.userId),
      ).size;

      const totalActivities = soLogs.length;

      const actualMinutes = soLogs.reduce(
        (sum, log) =>
          sum +
          log.slots.reduce(
            (s, slot) => s + slot.durationMinutes,
            0,
          ),
        0,
      );

      const idealMinutes = soLogs.reduce(
        (sum, log) =>
          sum + log.activity.standardManMinutes,
        0,
      );

      const actualHours = Number(
        (actualMinutes / 60).toFixed(1),
      );
      const idealHours = Number(
        (idealMinutes / 60).toFixed(1),
      );

      const productivity =
        actualHours > 0
          ? Number(
              (
                (idealHours / actualHours) *
                100
              ).toFixed(0),
            )
          : 0;

      return {
        soNumber: so.soNumber,
        customerName: so.customerName,
        startDate: so.startDate,
        endDate: so.endDate,
        departments: activeDepartmentsCount,
        totalEmployees,
        totalActivities,
        actualHours,
        idealHours,
        productivity,
        status: so.isActive
          ? 'Active'
          : 'Inactive',
      };
    });

    // Summary row
    const summary = {
      totalSOs: soRows.length,
      activeSOs: soRows.filter(
        (r) => r.status === 'Active',
      ).length,
      inactiveSOs: soRows.filter(
        (r) => r.status === 'Inactive',
      ).length,
      totalEmployees: soRows.reduce(
        (s, r) => s + r.totalEmployees,
        0,
      ),
      totalActivities: soRows.reduce(
        (s, r) => s + r.totalActivities,
        0,
      ),
      totalActualHours: Number(
        soRows
          .reduce((s, r) => s + r.actualHours, 0)
          .toFixed(1),
      ),
      totalIdealHours: Number(
        soRows
          .reduce((s, r) => s + r.idealHours, 0)
          .toFixed(1),
      ),
      averageProductivity:
        soRows.length > 0
          ? Number(
              (
                soRows.reduce(
                  (s, r) => s + r.productivity,
                  0,
                ) / soRows.length
              ).toFixed(0),
            )
          : 0,
    };

    return {
      reportTitle: 'SO SUMMARY REPORT',
      generatedAt: new Date(),
      rows: soRows,
      summary,
    };
  }

  // ─── 2. Department-wise SO Report ────────────────────────

  async getDepartmentWiseReport(
    soId: string,
    filters: SOReportFilterDto,
  ) {
    const so =
      await this.prisma.salesOrder.findFirst({
        where: { id: soId, isDeleted: false },
      });

    if (!so) {
      throw new NotFoundException(
        'Sales order not found',
      );
    }

    const logWhere =
      this.buildActivityLogWhere(soId, filters);

    const activityLogs =
      await this.prisma.activityLog.findMany({
        where: logWhere,
        include: {
          department: true,
          activity: true,
          slots: true,
          user: true,
        },
      });

    // Group by department -> activity
    const deptMap = new Map<
      string,
      {
        departmentName: string;
        activities: Map<
          string,
          {
            activityName: string;
            actualMinutes: number;
            idealMinutes: number;
            userIds: Set<string>;
          }
        >;
      }
    >();

    for (const log of activityLogs) {
      const deptId = log.departmentId;
      if (!deptMap.has(deptId)) {
        deptMap.set(deptId, {
          departmentName: log.department.name,
          activities: new Map(),
        });
      }

      const dept = deptMap.get(deptId)!;
      const actId = log.activityId;

      if (!dept.activities.has(actId)) {
        dept.activities.set(actId, {
          activityName: log.activity.activityName,
          actualMinutes: 0,
          idealMinutes: 0,
          userIds: new Set(),
        });
      }

      const act = dept.activities.get(actId)!;

      act.actualMinutes += log.slots.reduce(
        (s, slot) => s + slot.durationMinutes,
        0,
      );

      act.idealMinutes +=
        log.activity.standardManMinutes;

      act.userIds.add(log.userId);
    }

    // Build rows
    const rows: any[] = [];
    const departmentSummaries: any[] = [];

    for (const [, dept] of deptMap) {
      let deptActualMinutes = 0;
      let deptIdealMinutes = 0;
      let deptUsers = new Set<string>();
      let deptActivityCount = 0;

      for (const [, act] of dept.activities) {
        const actualHours = Number(
          (act.actualMinutes / 60).toFixed(1),
        );
        const idealHours = Number(
          (act.idealMinutes / 60).toFixed(1),
        );
        const productivity =
          actualHours > 0
            ? Number(
                (
                  (idealHours / actualHours) *
                  100
                ).toFixed(0),
              )
            : 0;

        rows.push({
          department: dept.departmentName,
          activity: act.activityName,
          actualHours,
          idealHours,
          usersWorking: act.userIds.size,
          productivity,
        });

        deptActualMinutes += act.actualMinutes;
        deptIdealMinutes += act.idealMinutes;
        act.userIds.forEach((u) =>
          deptUsers.add(u),
        );
        deptActivityCount++;
      }

      const deptActualHours = Number(
        (deptActualMinutes / 60).toFixed(1),
      );
      const deptIdealHours = Number(
        (deptIdealMinutes / 60).toFixed(1),
      );

      departmentSummaries.push({
        department: dept.departmentName,
        totalActivities: deptActivityCount,
        totalUsers: deptUsers.size,
        actualHours: deptActualHours,
        idealHours: deptIdealHours,
        productivity:
          deptActualHours > 0
            ? Number(
                (
                  (deptIdealHours /
                    deptActualHours) *
                  100
                ).toFixed(0),
              )
            : 0,
      });
    }

    // Overall summary
    const totalActualHours = Number(
      departmentSummaries
        .reduce(
          (s: number, d: any) => s + d.actualHours,
          0,
        )
        .toFixed(1),
    );
    const totalIdealHours = Number(
      departmentSummaries
        .reduce(
          (s: number, d: any) => s + d.idealHours,
          0,
        )
        .toFixed(1),
    );

    const overallSummary = {
      totalDepartments: departmentSummaries.length,
      totalActivities: rows.length,
      totalUsers: departmentSummaries.reduce(
        (s: number, d: any) => s + d.totalUsers,
        0,
      ),
      totalActualHours,
      totalIdealHours,
      overallProductivity:
        totalActualHours > 0
          ? Number(
              (
                (totalIdealHours /
                  totalActualHours) *
                100
              ).toFixed(0),
            )
          : 0,
    };

    return {
      reportTitle:
        'DEPARTMENT-WISE SO REPORT',
      soNumber: so.soNumber,
      customerName: so.customerName,
      startDate: so.startDate,
      endDate: so.endDate,
      status: so.isActive
        ? 'Active'
        : 'Inactive',
      generatedAt: new Date(),
      rows,
      departmentSummary: departmentSummaries,
      overallSummary,
    };
  }

  // ─── 3. Employee-wise SO Report ──────────────────────────

  async getEmployeeWiseReport(
    soId: string,
    filters: SOReportFilterDto,
  ) {
    const so =
      await this.prisma.salesOrder.findFirst({
        where: { id: soId, isDeleted: false },
      });

    if (!so) {
      throw new NotFoundException(
        'Sales order not found',
      );
    }

    const logWhere =
      this.buildActivityLogWhere(soId, filters);

    const activityLogs =
      await this.prisma.activityLog.findMany({
        where: logWhere,
        include: {
          user: true,
          department: true,
          activity: true,
          slots: true,
        },
      });

    // Build employee rows
    const rows = activityLogs.map((log) => {
      const actualMinutes = log.slots.reduce(
        (s, slot) => s + slot.durationMinutes,
        0,
      );
      const actualHours = Number(
        (actualMinutes / 60).toFixed(1),
      );
      const idealHours = Number(
        (
          log.activity.standardManMinutes / 60
        ).toFixed(1),
      );
      const productivity =
        actualHours > 0
          ? Number(
              (
                (idealHours / actualHours) *
                100
              ).toFixed(0),
            )
          : 0;

      return {
        employeeId: log.user.employeeId,
        employeeName: `${log.user.firstName} ${log.user.lastName}`,
        department: log.department.name,
        activity: log.activity.activityName,
        hoursWorked: actualHours,
        idealHours,
        productivity,
      };
    });

    // Employee summary — group by userId
    const empMap = new Map<
      string,
      {
        employeeId: string;
        employeeName: string;
        totalActivities: number;
        totalActualHours: number;
        totalIdealHours: number;
      }
    >();

    for (const row of rows) {
      const key = row.employeeId;
      if (!empMap.has(key)) {
        empMap.set(key, {
          employeeId: row.employeeId,
          employeeName: row.employeeName,
          totalActivities: 0,
          totalActualHours: 0,
          totalIdealHours: 0,
        });
      }
      const emp = empMap.get(key)!;
      emp.totalActivities++;
      emp.totalActualHours += row.hoursWorked;
      emp.totalIdealHours += row.idealHours;
    }

    const employeeSummary = Array.from(
      empMap.values(),
    ).map((emp) => ({
      ...emp,
      totalActualHours: Number(
        emp.totalActualHours.toFixed(1),
      ),
      totalIdealHours: Number(
        emp.totalIdealHours.toFixed(1),
      ),
      productivity:
        emp.totalActualHours > 0
          ? Number(
              (
                (emp.totalIdealHours /
                  emp.totalActualHours) *
                100
              ).toFixed(0),
            )
          : 0,
    }));

    // Overall summary
    const totalActualHours = Number(
      employeeSummary
        .reduce(
          (s, e) => s + e.totalActualHours,
          0,
        )
        .toFixed(1),
    );
    const totalIdealHours = Number(
      employeeSummary
        .reduce(
          (s, e) => s + e.totalIdealHours,
          0,
        )
        .toFixed(1),
    );

    const overallSummary = {
      totalEmployees: employeeSummary.length,
      totalActivities: rows.length,
      totalActualHours,
      totalIdealHours,
      averageProductivity:
        totalActualHours > 0
          ? Number(
              (
                (totalIdealHours /
                  totalActualHours) *
                100
              ).toFixed(0),
            )
          : 0,
    };

    return {
      reportTitle:
        'EMPLOYEE-WISE SO REPORT',
      soNumber: so.soNumber,
      customerName: so.customerName,
      startDate: so.startDate,
      endDate: so.endDate,
      status: so.isActive
        ? 'Active'
        : 'Inactive',
      generatedAt: new Date(),
      rows,
      employeeSummary,
      overallSummary,
    };
  }

  // ─── Excel Export ────────────────────────────────────────

  async exportSOSummaryExcel(
    filters: SOReportFilterDto,
  ): Promise<Buffer> {
    const report =
      await this.getSOSummaryReport(filters);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(
      'SO Summary Report',
    );

    // Header
    sheet.mergeCells('A1:K1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'GAMECHANGE BOS';
    titleCell.font = {
      bold: true,
      size: 14,
    };

    sheet.mergeCells('A2:K2');
    sheet.getCell('A2').value =
      'SO SUMMARY REPORT';
    sheet.getCell('A2').font = {
      bold: true,
      size: 12,
    };

    sheet.getCell('A4').value = 'Generated By';
    sheet.getCell('B4').value = 'Admin';
    sheet.getCell('A5').value = 'Generated On';
    sheet.getCell('B5').value =
      report.generatedAt.toLocaleString();

    // Data headers
    const headerRow = sheet.addRow([]);
    sheet.addRow([
      'SO No',
      'Customer Name',
      'Start Date',
      'End Date',
      'Departments',
      'Total Employees',
      'Total Activities',
      'Actual Hours',
      'Ideal Hours',
      'Productivity %',
      'Status',
    ]);

    const hRow = sheet.lastRow!;
    hRow.font = { bold: true };
    hRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' },
      };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Data rows
    for (const row of report.rows) {
      sheet.addRow([
        row.soNumber,
        row.customerName,
        new Date(row.startDate)
          .toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
          }),
        new Date(row.endDate)
          .toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
          }),
        row.departments,
        row.totalEmployees,
        row.totalActivities,
        row.actualHours,
        row.idealHours,
        `${row.productivity}%`,
        row.status,
      ]);
    }

    // Summary section
    sheet.addRow([]);
    const summaryTitleRow = sheet.addRow([
      'SUMMARY',
    ]);
    summaryTitleRow.font = { bold: true };

    sheet.addRow([
      'Total SOs',
      'Active SOs',
      'Inactive SOs',
      'Total Employees',
      'Total Activities',
      'Total Actual Hours',
      'Total Ideal Hours',
      'Average Productivity',
    ]);

    sheet.addRow([
      report.summary.totalSOs,
      report.summary.activeSOs,
      report.summary.inactiveSOs,
      report.summary.totalEmployees,
      report.summary.totalActivities,
      report.summary.totalActualHours,
      report.summary.totalIdealHours,
      `${report.summary.averageProductivity}%`,
    ]);

    // Auto-fit columns
    sheet.columns.forEach((col) => {
      col.width = 18;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportDepartmentWiseExcel(
    soId: string,
    filters: SOReportFilterDto,
  ): Promise<Buffer> {
    const report =
      await this.getDepartmentWiseReport(
        soId,
        filters,
      );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(
      'Department-wise SO Report',
    );

    // SO Header
    sheet.mergeCells('A1:H1');
    sheet.getCell('A1').value =
      'GAMECHANGE BOS';
    sheet.getCell('A1').font = {
      bold: true,
      size: 14,
    };

    sheet.mergeCells('A2:H2');
    sheet.getCell('A2').value =
      'DEPARTMENT-WISE SO REPORT';
    sheet.getCell('A2').font = {
      bold: true,
      size: 12,
    };

    sheet.getCell('A4').value = 'SO Number';
    sheet.getCell('B4').value =
      report.soNumber;

    sheet.getCell('A5').value = 'Customer';
    sheet.getCell('B5').value =
      report.customerName;

    sheet.getCell('A6').value = 'Start Date';
    sheet.getCell('B6').value = new Date(
      report.startDate,
    ).toLocaleDateString('en-IN');

    sheet.getCell('A7').value = 'End Date';
    sheet.getCell('B7').value = new Date(
      report.endDate,
    ).toLocaleDateString('en-IN');

    sheet.getCell('A8').value = 'Status';
    sheet.getCell('B8').value = report.status;

    // Detail header
    sheet.addRow([]);
    const headerRow = sheet.addRow([
      'Department',
      'Activity',
      'Actual Hours',
      'Ideal Hours',
      'Users Working',
      'Productivity %',
    ]);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' },
      };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    for (const row of report.rows) {
      sheet.addRow([
        row.department,
        row.activity,
        row.actualHours,
        row.idealHours,
        row.usersWorking,
        `${row.productivity}%`,
      ]);
    }

    // Department summary
    sheet.addRow([]);
    const deptSummaryTitle = sheet.addRow([
      'DEPARTMENT SUMMARY',
    ]);
    deptSummaryTitle.font = { bold: true };

    sheet.addRow([
      'Department',
      'Total Activities',
      'Total Users',
      'Actual Hours',
      'Ideal Hours',
      'Productivity %',
    ]);

    for (const ds of report.departmentSummary) {
      sheet.addRow([
        ds.department,
        ds.totalActivities,
        ds.totalUsers,
        ds.actualHours,
        ds.idealHours,
        `${ds.productivity}%`,
      ]);
    }

    // Overall summary
    sheet.addRow([]);
    const overallTitle = sheet.addRow([
      'OVERALL SO SUMMARY',
    ]);
    overallTitle.font = { bold: true };

    sheet.addRow([
      'Total Departments',
      'Total Activities',
      'Total Users',
      'Total Actual Hours',
      'Total Ideal Hours',
      'Overall Productivity',
    ]);

    sheet.addRow([
      report.overallSummary.totalDepartments,
      report.overallSummary.totalActivities,
      report.overallSummary.totalUsers,
      report.overallSummary.totalActualHours,
      report.overallSummary.totalIdealHours,
      `${report.overallSummary.overallProductivity}%`,
    ]);

    sheet.columns.forEach((col) => {
      col.width = 20;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportEmployeeWiseExcel(
    soId: string,
    filters: SOReportFilterDto,
  ): Promise<Buffer> {
    const report =
      await this.getEmployeeWiseReport(
        soId,
        filters,
      );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(
      'Employee-wise SO Report',
    );

    // SO Header
    sheet.mergeCells('A1:G1');
    sheet.getCell('A1').value =
      'GAMECHANGE BOS';
    sheet.getCell('A1').font = {
      bold: true,
      size: 14,
    };

    sheet.mergeCells('A2:G2');
    sheet.getCell('A2').value =
      'EMPLOYEE-WISE SO REPORT';
    sheet.getCell('A2').font = {
      bold: true,
      size: 12,
    };

    sheet.getCell('A4').value = 'SO Number';
    sheet.getCell('B4').value =
      report.soNumber;

    sheet.getCell('A5').value = 'Customer';
    sheet.getCell('B5').value =
      report.customerName;

    sheet.getCell('A6').value = 'Start Date';
    sheet.getCell('B6').value = new Date(
      report.startDate,
    ).toLocaleDateString('en-IN');

    sheet.getCell('A7').value = 'End Date';
    sheet.getCell('B7').value = new Date(
      report.endDate,
    ).toLocaleDateString('en-IN');

    sheet.getCell('A8').value = 'Status';
    sheet.getCell('B8').value = report.status;

    // Detail header
    sheet.addRow([]);
    const headerRow = sheet.addRow([
      'Employee ID',
      'Employee Name',
      'Department',
      'Activity',
      'Hours Worked',
      'Ideal Hours',
      'Productivity %',
    ]);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' },
      };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    for (const row of report.rows) {
      sheet.addRow([
        row.employeeId,
        row.employeeName,
        row.department,
        row.activity,
        row.hoursWorked,
        row.idealHours,
        `${row.productivity}%`,
      ]);
    }

    // Employee summary
    sheet.addRow([]);
    const empSummaryTitle = sheet.addRow([
      'EMPLOYEE SUMMARY',
    ]);
    empSummaryTitle.font = { bold: true };

    sheet.addRow([
      'Employee ID',
      'Employee Name',
      'Total Activities',
      'Total Hours',
      'Ideal Hours',
      'Productivity %',
    ]);

    for (const es of report.employeeSummary) {
      sheet.addRow([
        es.employeeId,
        es.employeeName,
        es.totalActivities,
        es.totalActualHours,
        es.totalIdealHours,
        `${es.productivity}%`,
      ]);
    }

    // Overall summary
    sheet.addRow([]);
    const overallTitle = sheet.addRow([
      'OVERALL SO SUMMARY',
    ]);
    overallTitle.font = { bold: true };

    sheet.addRow([
      'Total Employees',
      'Total Activities',
      'Total Hours',
      'Total Ideal Hours',
      'Average Productivity',
    ]);

    sheet.addRow([
      report.overallSummary.totalEmployees,
      report.overallSummary.totalActivities,
      report.overallSummary.totalActualHours,
      report.overallSummary.totalIdealHours,
      `${report.overallSummary.averageProductivity}%`,
    ]);

    sheet.columns.forEach((col) => {
      col.width = 20;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ─── PDF Export ──────────────────────────────────────────

  async exportSOSummaryPdf(
    filters: SOReportFilterDto,
  ): Promise<Buffer> {
    const report =
      await this.getSOSummaryReport(filters);

    return this.generatePdf(
      'SO SUMMARY REPORT',
      [
        'SO No',
        'Customer',
        'Start',
        'End',
        'Depts',
        'Emps',
        'Acts',
        'Actual Hrs',
        'Ideal Hrs',
        'Prod %',
        'Status',
      ],
      report.rows.map((r) => [
        r.soNumber,
        r.customerName,
        new Date(r.startDate)
          .toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
          }),
        new Date(r.endDate)
          .toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
          }),
        String(r.departments),
        String(r.totalEmployees),
        String(r.totalActivities),
        String(r.actualHours),
        String(r.idealHours),
        `${r.productivity}%`,
        r.status,
      ]),
      {
        soInfo: null,
        summary: [
          `Total SOs: ${report.summary.totalSOs}`,
          `Active: ${report.summary.activeSOs} | Inactive: ${report.summary.inactiveSOs}`,
          `Total Actual Hours: ${report.summary.totalActualHours}`,
          `Total Ideal Hours: ${report.summary.totalIdealHours}`,
          `Average Productivity: ${report.summary.averageProductivity}%`,
        ],
      },
    );
  }

  async exportDepartmentWisePdf(
    soId: string,
    filters: SOReportFilterDto,
  ): Promise<Buffer> {
    const report =
      await this.getDepartmentWiseReport(
        soId,
        filters,
      );

    return this.generatePdf(
      'DEPARTMENT-WISE SO REPORT',
      [
        'Department',
        'Activity',
        'Actual Hrs',
        'Ideal Hrs',
        'Users',
        'Prod %',
      ],
      report.rows.map((r) => [
        r.department,
        r.activity,
        String(r.actualHours),
        String(r.idealHours),
        String(r.usersWorking),
        `${r.productivity}%`,
      ]),
      {
        soInfo: {
          soNumber: report.soNumber,
          customerName: report.customerName,
          startDate: report.startDate,
          endDate: report.endDate,
          status: report.status,
        },
        summary: [
          `Total Departments: ${report.overallSummary.totalDepartments}`,
          `Total Activities: ${report.overallSummary.totalActivities}`,
          `Total Actual Hours: ${report.overallSummary.totalActualHours}`,
          `Total Ideal Hours: ${report.overallSummary.totalIdealHours}`,
          `Overall Productivity: ${report.overallSummary.overallProductivity}%`,
        ],
      },
    );
  }

  async exportEmployeeWisePdf(
    soId: string,
    filters: SOReportFilterDto,
  ): Promise<Buffer> {
    const report =
      await this.getEmployeeWiseReport(
        soId,
        filters,
      );

    return this.generatePdf(
      'EMPLOYEE-WISE SO REPORT',
      [
        'Emp ID',
        'Name',
        'Department',
        'Activity',
        'Hrs Worked',
        'Ideal Hrs',
        'Prod %',
      ],
      report.rows.map((r) => [
        r.employeeId,
        r.employeeName,
        r.department,
        r.activity,
        String(r.hoursWorked),
        String(r.idealHours),
        `${r.productivity}%`,
      ]),
      {
        soInfo: {
          soNumber: report.soNumber,
          customerName: report.customerName,
          startDate: report.startDate,
          endDate: report.endDate,
          status: report.status,
        },
        summary: [
          `Total Employees: ${report.overallSummary.totalEmployees}`,
          `Total Activities: ${report.overallSummary.totalActivities}`,
          `Total Actual Hours: ${report.overallSummary.totalActualHours}`,
          `Total Ideal Hours: ${report.overallSummary.totalIdealHours}`,
          `Average Productivity: ${report.overallSummary.averageProductivity}%`,
        ],
      },
    );
  }

  private generatePdf(
    title: string,
    headers: string[],
    rows: string[][],
    extras: {
      soInfo: any;
      summary: string[];
    },
  ): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({
        margin: 30,
        size: 'A4',
        layout: 'landscape',
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) =>
        chunks.push(chunk),
      );
      doc.on('end', () =>
        resolve(Buffer.concat(chunks)),
      );

      // Title
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('GAMECHANGE BOS', {
          align: 'left',
        });

      doc.fontSize(13).text(title, {
        align: 'left',
      });

      doc.moveDown(0.5);

      // SO Info (if applicable)
      if (extras.soInfo) {
        doc
          .fontSize(9)
          .font('Helvetica')
          .text(
            `SO Number: ${extras.soInfo.soNumber}`,
          )
          .text(
            `Customer: ${extras.soInfo.customerName}`,
          )
          .text(
            `Start Date: ${new Date(extras.soInfo.startDate).toLocaleDateString('en-IN')}`,
          )
          .text(
            `End Date: ${new Date(extras.soInfo.endDate).toLocaleDateString('en-IN')}`,
          )
          .text(
            `Status: ${extras.soInfo.status}`,
          );
        doc.moveDown(0.5);
      }

      doc
        .fontSize(9)
        .font('Helvetica')
        .text(
          `Generated: ${new Date().toLocaleString()}`,
        );

      doc.moveDown(0.5);

      // Table
      const colWidth =
        (doc.page.width - 60) / headers.length;
      const startX = 30;
      let y = doc.y;

      // Header row
      doc.font('Helvetica-Bold').fontSize(8);
      headers.forEach((h, i) => {
        doc.text(h, startX + i * colWidth, y, {
          width: colWidth,
          align: 'left',
        });
      });

      y += 15;
      doc
        .moveTo(startX, y)
        .lineTo(
          startX + colWidth * headers.length,
          y,
        )
        .stroke();
      y += 5;

      // Data rows
      doc.font('Helvetica').fontSize(7);
      for (const row of rows) {
        if (y > doc.page.height - 60) {
          doc.addPage();
          y = 30;
        }

        row.forEach((cell, i) => {
          doc.text(
            cell || '',
            startX + i * colWidth,
            y,
            {
              width: colWidth,
              align: 'left',
            },
          );
        });
        y += 13;
      }

      // Summary
      doc.moveDown(1);
      y = doc.y;
      if (y > doc.page.height - 80) {
        doc.addPage();
        y = 30;
      }

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('SUMMARY', startX, y);
      y += 15;

      doc.fontSize(8).font('Helvetica');
      for (const line of extras.summary) {
        doc.text(line, startX, y);
        y += 12;
      }

      doc.end();
    });
  }
}
