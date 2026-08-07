import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';

import type { Response } from 'express';

import { SalesOrdersService } from '../services/sales-orders.service';

import { SOReportsService } from '../services/so-reports.service';

import { CreateSalesOrderDto } from '../modules/sales-orders/dto/create-sales-order.dto';

import { UpdateSalesOrderDto } from '../modules/sales-orders/dto/update-sales-order.dto';

import { UpdateSODepartmentsDto } from '../modules/sales-orders/dto/update-so-departments.dto';

import { SOReportFilterDto } from '../modules/sales-orders/dto/so-report-filter.dto';

import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';

import { RolesGuard } from '../modules/auth/guards/roles.guard';

import { Roles } from '../modules/auth/decorators/roles.decorator';

@Controller('sales-orders')
export class SalesOrdersController {
  constructor(
    private readonly salesOrdersService: SalesOrdersService,
    private readonly soReportsService: SOReportsService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)

  @Roles('Admin')

  @Post()
  async createSalesOrder(
    @Body()
    createSalesOrderDto: CreateSalesOrderDto,
  ) {
    return this.salesOrdersService.createSalesOrder(
      createSalesOrderDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getSalesOrders() {
    return this.salesOrdersService.getSalesOrders();
  }

  // ─── Report Endpoints (must come BEFORE :id) ─────────────

  /**
   * SO Summary Report — all SOs with aggregated metrics
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Get('reports/summary')
  async getSOSummaryReport(
    @Query() filters: SOReportFilterDto,
  ) {
    return this.soReportsService.getSOSummaryReport(
      filters,
    );
  }

  /**
   * Export SO Summary Report as Excel or PDF
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Get('reports/summary/export/:format')
  async exportSOSummary(
    @Param('format') format: string,
    @Query() filters: SOReportFilterDto,
    @Res() res: Response,
  ) {
    if (format === 'xlsx') {
      const buffer =
        await this.soReportsService.exportSOSummaryExcel(
          filters,
        );
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition':
          'attachment; filename=SO_Summary_Report.xlsx',
      });
      res.send(buffer);
    } else if (format === 'pdf') {
      const buffer =
        await this.soReportsService.exportSOSummaryPdf(
          filters,
        );
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition':
          'attachment; filename=SO_Summary_Report.pdf',
      });
      res.send(buffer);
    } else {
      res
        .status(400)
        .json({
          message:
            'Invalid format. Use xlsx or pdf.',
        });
    }
  }

  @UseGuards(JwtAuthGuard)

  @Get(':id')
  async getSalesOrderById(
    @Param('id') id: string,
  ) {
    return this.salesOrdersService.getSalesOrderById(
      id,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)

  @Roles('Admin')

  @Put(':id/departments')
  async updateSODepartments(
    @Param('id') id: string,

    @Body()
    updateDto: UpdateSODepartmentsDto,
  ) {
    return this.salesOrdersService.updateSODepartments(
      id,
      updateDto,
    );
  }

  /**
   * Get departments linked to a specific SO.
   * Used by users to populate the department dropdown.
   */
  @UseGuards(JwtAuthGuard)

  @Get(':id/departments')
  async getDepartmentsBySO(
    @Param('id') id: string,
  ) {
    return this.salesOrdersService.getDepartmentsBySO(
      id,
    );
  }

  /**
   * Get admin-selected activities for an SO + department.
   * Used by users to populate the activity dropdown.
   */
  @UseGuards(JwtAuthGuard)

  @Get(':id/departments/:departmentId/activities')
  async getActivitiesBySODepartment(
    @Param('id') id: string,
    @Param('departmentId')
    departmentId: string,
  ) {
    return this.salesOrdersService.getActivitiesBySODepartment(
      id,
      departmentId,
    );
  }

  /**
   * Get "other" activities — activities under the department
   * but NOT selected by admin for this SO.
   * User must provide a reason if they select one of these.
   */
  @UseGuards(JwtAuthGuard)

  @Get(':id/departments/:departmentId/other-activities')
  async getOtherActivitiesBySODepartment(
    @Param('id') id: string,
    @Param('departmentId')
    departmentId: string,
  ) {
    return this.salesOrdersService.getOtherActivitiesBySODepartment(
      id,
      departmentId,
    );
  }

  // ─── Per-SO Report Endpoints ─────────────────────────────

  /**
   * Department-wise report for a specific SO
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Get(':id/reports/department-wise')
  async getDepartmentWiseReport(
    @Param('id') id: string,
    @Query() filters: SOReportFilterDto,
  ) {
    return this.soReportsService.getDepartmentWiseReport(
      id,
      filters,
    );
  }

  /**
   * Export Department-wise report as Excel or PDF
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Get(':id/reports/department-wise/export/:format')
  async exportDepartmentWise(
    @Param('id') id: string,
    @Param('format') format: string,
    @Query() filters: SOReportFilterDto,
    @Res() res: Response,
  ) {
    if (format === 'xlsx') {
      const buffer =
        await this.soReportsService.exportDepartmentWiseExcel(
          id,
          filters,
        );
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=Department_Wise_SO_Report.xlsx`,
      });
      res.send(buffer);
    } else if (format === 'pdf') {
      const buffer =
        await this.soReportsService.exportDepartmentWisePdf(
          id,
          filters,
        );
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Department_Wise_SO_Report.pdf`,
      });
      res.send(buffer);
    } else {
      res
        .status(400)
        .json({
          message:
            'Invalid format. Use xlsx or pdf.',
        });
    }
  }

  /**
   * Employee-wise report for a specific SO
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Get(':id/reports/employee-wise')
  async getEmployeeWiseReport(
    @Param('id') id: string,
    @Query() filters: SOReportFilterDto,
  ) {
    return this.soReportsService.getEmployeeWiseReport(
      id,
      filters,
    );
  }

  /**
   * Export Employee-wise report as Excel or PDF
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Get(':id/reports/employee-wise/export/:format')
  async exportEmployeeWise(
    @Param('id') id: string,
    @Param('format') format: string,
    @Query() filters: SOReportFilterDto,
    @Res() res: Response,
  ) {
    if (format === 'xlsx') {
      const buffer =
        await this.soReportsService.exportEmployeeWiseExcel(
          id,
          filters,
        );
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=Employee_Wise_SO_Report.xlsx`,
      });
      res.send(buffer);
    } else if (format === 'pdf') {
      const buffer =
        await this.soReportsService.exportEmployeeWisePdf(
          id,
          filters,
        );
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Employee_Wise_SO_Report.pdf`,
      });
      res.send(buffer);
    } else {
      res
        .status(400)
        .json({
          message:
            'Invalid format. Use xlsx or pdf.',
        });
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Patch(':id')
  async updateSalesOrder(
    @Param('id') id: string,
    @Body() updateSalesOrderDto: UpdateSalesOrderDto,
  ) {
    return this.salesOrdersService.updateSalesOrder(
      id,
      updateSalesOrderDto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @Delete(':id')
  async deleteSalesOrder(
    @Param('id') id: string,
  ) {
    return this.salesOrdersService.deleteSalesOrder(
      id,
    );
  }
}