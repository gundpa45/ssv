import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { UpdateUserDto } from '../modules/users/dto/update-user.dto';
import { CreateUserDto } from '../modules/users/dto/create-user.dto';

import { PasswordUtil } from '../common/utils/password.util';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createUser(
    createUserDto: CreateUserDto,
    performedByUserId?: string,
  ) {
    const existingUser =
      await this.prisma.user.findFirst({
        where: {
          OR: [
            {
              employeeId:
                createUserDto.employeeId,
            },
            {
              mobile:
                createUserDto.mobile,
            },
          ],
          isDeleted: false,
        },
      });

    if (existingUser) {
      throw new BadRequestException(
        'Employee already exists',
      );
    }

    const generatedPassword =
      this.generatePassword(
        createUserDto.firstName,
        createUserDto.mobile,
      );

    const hashedPassword =
      await PasswordUtil.hash(
        generatedPassword,
      );

    let actualRoleId = createUserDto.roleId;
    let subRole: string | null = null;
    if (createUserDto.roleId.includes(':')) {
      const parts = createUserDto.roleId.split(':');
      actualRoleId = parts[0];
      subRole = parts[1];
    }

    const user =
      await this.prisma.user.create({
        data: {
          employeeId:
            createUserDto.employeeId,

          firstName:
            createUserDto.firstName,

          lastName:
            createUserDto.lastName,

          mobile:
            createUserDto.mobile,

          email:
            createUserDto.email,

          passwordHash:
            hashedPassword,

          roleId:
            actualRoleId,

          subRole:
            subRole,
        },

        include: {
          role: true,
        },
      });

    const effectiveRoleName = user.role.name === 'Worker' && user.subRole
      ? user.subRole
      : user.role.name;

    // Audit log for user creation
    if (performedByUserId) {
      await this.prisma.auditLog.create({
        data: {
          userId: performedByUserId,
          module: 'Users',
          action: 'CREATE',
          entityId: user.id,
          newValue: JSON.stringify({
            employeeId: user.employeeId,
            firstName: user.firstName,
            lastName: user.lastName,
            mobile: user.mobile,
            email: user.email,
            role: effectiveRoleName,
          }),
        },
      });
    }

    return {
      message:
        'User created successfully',

      generatedPassword,

      user: {
        id: user.id,

        employeeId:
          user.employeeId,

        firstName:
          user.firstName,

        lastName:
          user.lastName,

        mobile:
          user.mobile,

        email:
          user.email,

        role:
          effectiveRoleName,
      },
    };
  }

  async getUsers() {
    const users =
      await this.prisma.user.findMany({
        where: {
          isDeleted: false,
        },

        include: {
          role: true,
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    return users.map((user) => ({
      id: user.id,

      employeeId:
        user.employeeId,

      firstName:
        user.firstName,

      lastName:
        user.lastName,

      mobile:
        user.mobile,

      email:
        user.email,

      status:
        user.status,

      role:
        user.role.name === 'Worker' && user.subRole ? user.subRole : user.role.name,

      isActive:
        user.isActive,

      createdAt:
        user.createdAt,
    }));
  }

  async getUserById(id: string) {
    const user =
      await this.prisma.user.findFirst({
        where: {
          id,
          isDeleted: false,
        },

        include: {
          role: true,
        },
      });

    if (!user) {
      throw new BadRequestException(
        'User not found',
      );
    }

    const effectiveRoleName = user.role.name === 'Worker' && user.subRole ? user.subRole : user.role.name;
    const effectiveRoleId = user.role.name === 'Worker' && user.subRole ? `${user.role.id}:${user.subRole}` : user.role.id;

    return {
      id: user.id,

      employeeId:
        user.employeeId,

      firstName:
        user.firstName,

      lastName:
        user.lastName,

      mobile:
        user.mobile,

      email:
        user.email,

      status:
        user.status,

      role: {
        id: effectiveRoleId,

        name: effectiveRoleName,
      },

      isActive:
        user.isActive,

      createdAt:
        user.createdAt,
    };
  }

  private generatePassword(
    firstName: string,
    mobile: string,
  ): string {
    const namePart =
      firstName
        .substring(0, 3)
        .toUpperCase();

    const mobilePart =
      mobile.slice(-3);

    return `${namePart}${mobilePart}`;
  }

    async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
    performedByUserId?: string,
  ) {
    const existingUser =
      await this.prisma.user.findFirst({
        where: {
          OR: [
            { id },
            { employeeId: id },
          ],
          isDeleted: false,
        },
        include: {
          role: true,
        },
      });

    if (!existingUser) {
      throw new BadRequestException(
        'User not found',
      );
    }

    const updateData: any = {
      ...updateUserDto,
      ...(updateUserDto.isActive !== undefined ? { status: updateUserDto.isActive ? 'ACTIVE' : 'INACTIVE' } : {}),
    };

    if (updateUserDto.roleId) {
      if (updateUserDto.roleId.includes(':')) {
        const parts = updateUserDto.roleId.split(':');
        updateData.roleId = parts[0];
        updateData.subRole = parts[1];
      } else {
        updateData.roleId = updateUserDto.roleId;
        updateData.subRole = null;
      }
    }

    const updatedUser =
      await this.prisma.user.update({
        where: {
          id: existingUser.id,
        },

        data: updateData,

        include: {
          role: true,
        },
      });

    const oldEffectiveRole = existingUser.role.name === 'Worker' && existingUser.subRole ? existingUser.subRole : existingUser.role.name;
    const newEffectiveRole = updatedUser.role.name === 'Worker' && updatedUser.subRole ? updatedUser.subRole : updatedUser.role.name;

    // Audit log for user update
    if (performedByUserId) {
      await this.prisma.auditLog.create({
        data: {
          userId: performedByUserId,
          module: 'Users',
          action: 'UPDATE',
          entityId: id,
          oldValue: JSON.stringify({
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            mobile: existingUser.mobile,
            email: existingUser.email,
            role: oldEffectiveRole,
            isActive: existingUser.isActive,
          }),
          newValue: JSON.stringify({
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            mobile: updatedUser.mobile,
            email: updatedUser.email,
            role: newEffectiveRole,
            isActive: updatedUser.isActive,
          }),
        },
      });
    }

    return {
      message:
        'User updated successfully',

      user: {
        id: updatedUser.id,

        employeeId:
          updatedUser.employeeId,

        firstName:
          updatedUser.firstName,

        lastName:
          updatedUser.lastName,

        mobile:
          updatedUser.mobile,

        email:
          updatedUser.email,

        role:
          updatedUser.role.name,

        isActive:
          updatedUser.isActive,
      },
    };
  }

    async deleteUser(
    id: string,
    performedByUserId?: string,
  ) {
    const existingUser =
      await this.prisma.user.findFirst({
        where: {
          id,
          isDeleted: false,
        },
        include: {
          role: true,
        },
      });

    if (!existingUser) {
      throw new BadRequestException(
        'User not found',
      );
    }

    await this.prisma.user.update({
      where: {
        id,
      },

      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // Audit log for user deletion
    if (performedByUserId) {
      await this.prisma.auditLog.create({
        data: {
          userId: performedByUserId,
          module: 'Users',
          action: 'DELETE',
          entityId: id,
          oldValue: JSON.stringify({
            employeeId: existingUser.employeeId,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            mobile: existingUser.mobile,
            email: existingUser.email,
            role: existingUser.role.name,
          }),
        },
      });
    }

    return {
      message:
        'User deleted successfully',
    };
  }

  async changePassword(
    id: string,
    changePasswordDto: { currentPassword?: string; newPassword?: string },
  ) {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.user.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!currentPassword || !newPassword) {
      throw new BadRequestException('Current password and new password are required');
    }

    const isCurrentPasswordValid = await PasswordUtil.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedNewPassword = await PasswordUtil.hash(newPassword);

    await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        passwordHash: hashedNewPassword,
      },
    });

    return {
      message: 'Password updated successfully',
    };
  }
}