import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  UseGuards,
  Delete,
} from '@nestjs/common';

import { DepartmentsService } from '../services/departments.service';

import { CreateDepartmentDto } from '../modules/departments/dto/create-department.dto';

import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';

import { RolesGuard } from '../modules/auth/guards/roles.guard';

import { Roles } from '../modules/auth/decorators/roles.decorator';

import { UpdateDepartmentDto } from '../modules/departments/dto/update-department.dto';

@Controller('departments')
export class DepartmentsController {
  constructor(
    private readonly departmentsService: DepartmentsService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)

  @Roles('Admin')

  @Post()
  async createDepartment(
    @Body()
    createDepartmentDto: CreateDepartmentDto,
  ) {
    return this.departmentsService.createDepartment(
      createDepartmentDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getDepartments() {
    return this.departmentsService.getDepartments();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getDepartmentById(
    @Param('id') id: string,
  ) {
    return this.departmentsService.getDepartmentById(
      id,
    );
  }

    @UseGuards(JwtAuthGuard, RolesGuard)

  @Roles('Admin')

  @Patch(':id')
  async updateDepartment(
    @Param('id') id: string,

    @Body()
    updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.updateDepartment(
      id,
      updateDepartmentDto,
    );
  }

    @UseGuards(JwtAuthGuard, RolesGuard)

  @Roles('Admin')

  @Delete(':id')
  async deleteDepartment(
    @Param('id') id: string,
  ) {
    return this.departmentsService.deleteDepartment(
      id,
    );
  }
}