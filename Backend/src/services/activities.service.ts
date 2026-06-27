import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

import { CreateActivityDto } from '../modules/activities/dto/create-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createActivity(
    createActivityDto: CreateActivityDto,
  ) {
    const department =
      await this.prisma.department.findFirst({
        where: {
          id: createActivityDto.departmentId,
          isDeleted: false,
        },
      });

    if (!department) {
      throw new BadRequestException(
        'Department not found',
      );
    }

    if (createActivityDto.restrictedRoleId) {
      const role =
        await this.prisma.role.findFirst({
          where: {
            id: createActivityDto.restrictedRoleId,
            isDeleted: false,
          },
        });

      if (!role) {
        throw new BadRequestException(
          'Role not found',
        );
      }
    }

    const activity =
      await this.prisma.activity.create({
        data: {
          activityName:
            createActivityDto.activityName,

          standardManMinutes:
            createActivityDto.standardManMinutes,

          departmentId:
            createActivityDto.departmentId,

          restrictedRoleId:
            createActivityDto.restrictedRoleId,
        },

        include: {
          department: true,

          restrictedRole: true,
        },
      });

    return {
      message:
        'Activity created successfully',

      activity: {
        id: activity.id,

        activityName:
          activity.activityName,

        standardManMinutes:
          activity.standardManMinutes,

        department:
          activity.department.name,

        restrictedRole:
          activity.restrictedRole?.name || null,

        isActive:
          activity.isActive,
      },
    };
  }

    async getActivities() {
    const activities =
      await this.prisma.activity.findMany({
        where: {
          isDeleted: false,
        },

        include: {
          department: true,

          restrictedRole: true,
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    return activities.map(
      (activity) => ({
        id: activity.id,

        activityName:
          activity.activityName,

        standardManMinutes:
          activity.standardManMinutes,

        department: {
          id: activity.department.id,

          name:
            activity.department.name,
        },

        restrictedRole:
          activity.restrictedRole
            ? {
                id:
                  activity.restrictedRole.id,

                name:
                  activity.restrictedRole.name,
              }
            : null,

        isActive:
          activity.isActive,

        createdAt:
          activity.createdAt,
      }),
    );
  }
}