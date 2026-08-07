import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { UpdateDepartmentDto } from '../modules/departments/dto/update-department.dto';
import { CreateDepartmentDto } from '../modules/departments/dto/create-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createDepartment(
    createDepartmentDto: CreateDepartmentDto,
  ) {
    const existingDepartment =
      await this.prisma.department.findFirst({
        where: {
          OR: [
            {
              name:
                createDepartmentDto.name,
            },
            {
              code:
                createDepartmentDto.code,
            },
          ],

          isDeleted: false,
        },
      });

    if (existingDepartment) {
      throw new BadRequestException(
        'Department already exists',
      );
    }

    const department =
      await this.prisma.department.create({
        data: {
          name:
            createDepartmentDto.name,

          code:
            createDepartmentDto.code
              .toUpperCase(),

          description:
            createDepartmentDto.description,
        },
      });

    return {
      message:
        'Department created successfully',

      department,
    };
  }

    async getDepartments() {
    const departments =
      await this.prisma.department.findMany({
        where: {
          isDeleted: false,
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    return departments.map(
      (department) => ({
        id: department.id,

        name: department.name,

        code: department.code,

        description:
          department.description,

        isActive:
          department.isActive,

        createdAt:
          department.createdAt,
      }),
    );
  }

    async getDepartmentById(id: string) {
    const department =
      await this.prisma.department.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });

    if (!department) {
      throw new BadRequestException(
        'Department not found',
      );
    }

    return {
      id: department.id,

      name: department.name,

      code: department.code,

      description:
        department.description,

      isActive:
        department.isActive,

      createdAt:
        department.createdAt,
    };
  }

    async updateDepartment(
    id: string,
    updateDepartmentDto: UpdateDepartmentDto,
  ) {
    const existingDepartment =
      await this.prisma.department.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });

    if (!existingDepartment) {
      throw new BadRequestException(
        'Department not found',
      );
    }

    const updatedDepartment =
      await this.prisma.department.update({
        where: {
          id,
        },

        data: {
          ...updateDepartmentDto,

          code:
            updateDepartmentDto.code
              ?.toUpperCase(),
        },

        });

    return {
      message:
        'Department updated successfully',

      department:
        updatedDepartment,
    };
  }

    async deleteDepartment(id: string) {
    const existingDepartment =
      await this.prisma.department.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });

    if (!existingDepartment) {
      throw new BadRequestException(
        'Department not found',
      );
    }

    await this.prisma.department.update({
      where: {
        id,
      },

      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return {
      message:
        'Department deleted successfully',
    };
  }
}