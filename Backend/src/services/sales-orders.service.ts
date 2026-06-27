import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

import { CreateSalesOrderDto } from '../modules/sales-orders/dto/create-sales-order.dto';

import { UpdateSalesOrderDto } from '../modules/sales-orders/dto/update-sales-order.dto';

import { UpdateSODepartmentsDto } from '../modules/sales-orders/dto/update-so-departments.dto';

@Injectable()
export class SalesOrdersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createSalesOrder(
    createSalesOrderDto: CreateSalesOrderDto,
  ) {
    // Enforce uppercase regardless of input casing
    createSalesOrderDto.soNumber =
      createSalesOrderDto.soNumber.toUpperCase();
    createSalesOrderDto.customerName =
      createSalesOrderDto.customerName.toUpperCase();

    const existingSO =
      await this.prisma.salesOrder.findFirst({
        where: {
          soNumber:
            createSalesOrderDto.soNumber,

          isDeleted: false,
        },
      });

    if (existingSO) {
      throw new BadRequestException(
        'SO number already exists',
      );
    }

    const salesOrder =
      await this.prisma.$transaction(
        async (tx) => {
          const so =
            await tx.salesOrder.create({
              data: {
                soNumber:
                  createSalesOrderDto.soNumber,

                customerName:
                  createSalesOrderDto.customerName,

                projectName:
                  createSalesOrderDto.projectName || null,

                soDescription:
                  createSalesOrderDto.soDescription,

                startDate:
                  new Date(
                    createSalesOrderDto.startDate,
                  ),

                endDate:
                  new Date(
                    createSalesOrderDto.endDate,
                  ),
              },
            });

          // Create department and activity mappings if provided
          if (
            createSalesOrderDto.departments
              ?.length
          ) {
            for (const dept of createSalesOrderDto.departments) {
              const soDept =
                await tx.sODepartment.create({
                  data: {
                    soId: so.id,
                    departmentId:
                      dept.departmentId,
                  },
                });

              if (dept.activityIds?.length) {
                await tx.sODepartmentActivity.createMany(
                  {
                    data: dept.activityIds.map(
                      (activityId) => ({
                        soDepartmentId:
                          soDept.id,
                        activityId,
                      }),
                    ),
                  },
                );
              }
            }
          }

          return so;
        },
      );

    // Re-fetch with relations
    const result =
      await this.prisma.salesOrder.findUnique({
        where: { id: salesOrder.id },
        include: {
          soDepartments: {
            include: {
              department: true,
              soDepartmentActivities: {
                include: {
                  activity: true,
                },
              },
            },
          },
        },
      });

    return {
      message:
        'Sales order created successfully',

      salesOrder:
        await this.formatSalesOrderResponse(result),
    };
  }

  async getSalesOrders() {
    const salesOrders =
      await this.prisma.salesOrder.findMany({
        where: {
          isDeleted: false,
        },

        include: {
          soDepartments: {
            include: {
              department: true,
              soDepartmentActivities: {
                include: {
                  activity: true,
                },
              },
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    const formatted: any[] = [];
    for (const so of salesOrders) {
      formatted.push(await this.formatSalesOrderResponse(so));
    }
    return formatted;
  }

  async updateSalesOrder(
    id: string,
    updateSalesOrderDto: UpdateSalesOrderDto,
  ) {
    const so =
      await this.prisma.salesOrder.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });

    if (!so) {
      throw new NotFoundException(
        'Sales order not found',
      );
    }

    if (updateSalesOrderDto.soNumber) {
      updateSalesOrderDto.soNumber =
        updateSalesOrderDto.soNumber.toUpperCase();
      const existingSO =
        await this.prisma.salesOrder.findFirst({
          where: {
            soNumber:
              updateSalesOrderDto.soNumber,
            id: { not: id },
            isDeleted: false,
          },
        });
      if (existingSO) {
        throw new BadRequestException(
          'SO number already exists',
        );
      }
    }

    if (updateSalesOrderDto.customerName) {
      updateSalesOrderDto.customerName =
        updateSalesOrderDto.customerName.toUpperCase();
    }

    const updateData: any = {};
    if (updateSalesOrderDto.soNumber !== undefined)
      updateData.soNumber =
        updateSalesOrderDto.soNumber;
    if (
      updateSalesOrderDto.customerName !==
      undefined
    )
      updateData.customerName =
        updateSalesOrderDto.customerName;
    if (
      updateSalesOrderDto.projectName !==
      undefined
    )
      updateData.projectName =
        updateSalesOrderDto.projectName || null;
    if (
      updateSalesOrderDto.soDescription !==
      undefined
    )
      updateData.soDescription =
        updateSalesOrderDto.soDescription;
    if (updateSalesOrderDto.startDate !== undefined)
      updateData.startDate = new Date(
        updateSalesOrderDto.startDate,
      );
    if (updateSalesOrderDto.endDate !== undefined)
      updateData.endDate = new Date(
        updateSalesOrderDto.endDate,
      );
    if (updateSalesOrderDto.status !== undefined)
      updateData.status =
        updateSalesOrderDto.status;
    if (updateSalesOrderDto.isActive !== undefined)
      updateData.isActive =
        updateSalesOrderDto.isActive;

    await this.prisma.$transaction(
      async (tx) => {
        await tx.salesOrder.update({
          where: { id },
          data: updateData,
        });

        if (
          updateSalesOrderDto.departments !==
          undefined
        ) {
          // Delete child records first
          await tx.sODepartmentActivity.deleteMany({
            where: {
              soDepartment: {
                soId: id,
              },
            },
          });

          // Delete existing mappings
          await tx.sODepartment.deleteMany({
            where: { soId: id },
          });

          // Create new mappings
          for (const dept of updateSalesOrderDto.departments) {
            const soDept =
              await tx.sODepartment.create({
                data: {
                  soId: id,
                  departmentId:
                    dept.departmentId,
                },
              });

            if (dept.activityIds?.length) {
              await tx.sODepartmentActivity.createMany(
                {
                  data: dept.activityIds.map(
                    (activityId) => ({
                      soDepartmentId:
                        soDept.id,
                      activityId,
                    }),
                  ),
                },
              );
            }
          }
        }
      },
    );

    // Re-fetch with relations
    const finalResult =
      await this.prisma.salesOrder.findUnique({
        where: { id },
        include: {
          soDepartments: {
            include: {
              department: true,
              soDepartmentActivities: {
                include: {
                  activity: true,
                },
              },
            },
          },
        },
      });

    return {
      message:
        'Sales order updated successfully',
      salesOrder:
        await this.formatSalesOrderResponse(finalResult),
    };
  }

  async deleteSalesOrder(id: string) {
    const so =
      await this.prisma.salesOrder.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });

    if (!so) {
      throw new NotFoundException(
        'Sales order not found',
      );
    }

    await this.prisma.salesOrder.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return {
      message:
        'Sales order deleted successfully',
    };
  }

  async getSalesOrderById(id: string) {
    const so =
      await this.prisma.salesOrder.findFirst({
        where: {
          id,
          isDeleted: false,
        },

        include: {
          soDepartments: {
            include: {
              department: true,
              soDepartmentActivities: {
                include: {
                  activity: true,
                },
              },
            },
          },
        },
      });

    if (!so) {
      throw new NotFoundException(
        'Sales order not found',
      );
    }

    return await this.formatSalesOrderResponse(so);
  }

  async updateSODepartments(
    soId: string,
    updateDto: UpdateSODepartmentsDto,
  ) {
    const so =
      await this.prisma.salesOrder.findFirst({
        where: {
          id: soId,
          isDeleted: false,
        },
      });

    if (!so) {
      throw new NotFoundException(
        'Sales order not found',
      );
    }

    await this.prisma.$transaction(
      async (tx) => {
        // Delete existing activities first (child records)
        await tx.sODepartmentActivity.deleteMany(
          {
            where: {
              soDepartment: {
                soId,
              },
            },
          },
        );

        // Delete existing department mappings
        await tx.sODepartment.deleteMany({
          where: { soId },
        });

        // Create new mappings
        for (const dept of updateDto.departments) {
          const soDept =
            await tx.sODepartment.create({
              data: {
                soId,
                departmentId:
                  dept.departmentId,
              },
            });

          if (dept.activityIds?.length) {
            await tx.sODepartmentActivity.createMany(
              {
                data: dept.activityIds.map(
                  (activityId) => ({
                    soDepartmentId:
                      soDept.id,
                    activityId,
                  }),
                ),
              },
            );
          }
        }
      },
    );

    // Re-fetch with relations
    const result =
      await this.prisma.salesOrder.findUnique({
        where: { id: soId },
        include: {
          soDepartments: {
            include: {
              department: true,
              soDepartmentActivities: {
                include: {
                  activity: true,
                },
              },
            },
          },
        },
      });

    return {
      message:
        'SO departments updated successfully',

      salesOrder:
        await this.formatSalesOrderResponse(result),
    };
  }

  /**
   * Get departments linked to a specific SO.
   * Used by users when selecting a department for activity logging.
   */
  async getDepartmentsBySO(soId: string) {
    const so =
      await this.prisma.salesOrder.findFirst({
        where: {
          id: soId,
          isDeleted: false,
        },
      });

    if (!so) {
      throw new NotFoundException(
        'Sales order not found',
      );
    }

    const departments = await this.prisma.department.findMany({
      where: {
        isActive: true,
        isDeleted: false,
      },
    });

    return departments.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code,
      description: d.description,
    }));
  }

  /**
   * Get activities linked to a specific SO + department pair.
   * These are the admin-selected activities for the user's activity logging.
   */
  async getActivitiesBySODepartment(
    soId: string,
    departmentId: string,
  ) {
    const so =
      await this.prisma.salesOrder.findFirst({
        where: {
          id: soId,
          isDeleted: false,
        },
      });

    if (!so) {
      throw new NotFoundException(
        'Sales order not found',
      );
    }

    const activities = await this.prisma.activity.findMany({
      where: {
        departmentId,
        isActive: true,
        isDeleted: false,
      },
    });

    return activities.map((a) => ({
      id: a.id,
      activityName: a.activityName,
      standardManMinutes: a.standardManMinutes,
    }));
  }

  /**
   * Get "other" activities — activities under the same department
   * but NOT selected by admin for this SO+department pair.
   * User must provide a reason if they pick one of these.
   */
  async getOtherActivitiesBySODepartment(
    soId: string,
    departmentId: string,
  ) {
    return [];
  }

  /**
   * Format the raw Prisma response into a clean API response
   * with departments and activities nested.
   */
  private async formatSalesOrderResponse(so: any) {
    if (!so) return null;

    const activeDepts = await this.prisma.department.findMany({
      where: {
        isActive: true,
        isDeleted: false,
      },
      include: {
        activities: {
          where: {
            isActive: true,
            isDeleted: false,
          },
        },
      },
    });

    return {
      id: so.id,
      soNumber: so.soNumber,
      customerName: so.customerName,
      projectName: so.projectName,
      soDescription: so.soDescription,
      startDate: so.startDate,
      endDate: so.endDate,
      status: so.status,
      isActive: so.isActive,
      createdAt: so.createdAt,
      departments: activeDepts.map((d) => ({
        id: d.id,
        name: d.name,
        code: d.code,
        activities: d.activities.map((a) => ({
          id: a.id,
          activityName: a.activityName,
          standardManMinutes: a.standardManMinutes,
        })),
      })),
    };
  }
}