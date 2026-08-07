import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../database/prisma.service';

import { LoginDto } from '../modules/auth/dto/login.dto';

import { AuthResponseDto } from '../modules/auth/dto/auth-response.dto';

import { PasswordUtil } from '../common/utils/password.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly jwtService: JwtService,
  ) {}

  async login(
    loginDto: LoginDto,
  ): Promise<AuthResponseDto> {
    let { employeeId, password } = loginDto;
    employeeId = (employeeId || '').trim();
    password = (password || '').trim();

    const normalizedId = employeeId.toLowerCase();

    // Map common aliases for ease of access
    let targetEmployeeId = employeeId;
    if (['admin', 'admin001', 'systemadmin'].includes(normalizedId)) {
      targetEmployeeId = 'ADMIN001';
    }

    // Try case-insensitive search by employeeId
    let user = await this.prisma.user.findFirst({
      where: {
        employeeId: {
          equals: targetEmployeeId,
          mode: 'insensitive',
        },
      },
      include: {
        role: true,
      },
    });

    // Fallback: search by email, mobile, or firstName
    if (!user) {
      user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: employeeId, mode: 'insensitive' } },
            { mobile: employeeId },
            { firstName: { equals: employeeId, mode: 'insensitive' } },
          ],
        },
        include: {
          role: true,
        },
      });
    }

    // Fallback: default to any Admin if alias matched
    if (!user && (normalizedId.includes('admin'))) {
      user = await this.prisma.user.findFirst({
        where: {
          role: {
            name: { in: ['Admin'] },
          },
        },
        include: {
          role: true,
        },
      });
    }

    if (!user) {
      throw new UnauthorizedException(
        'Invalid employee ID or password',
      );
    }

    let isPasswordValid = false;
    if (password) {
      isPasswordValid = await PasswordUtil.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        // Try uppercase password comparison (e.g. vik224 -> VIK224)
        isPasswordValid = await PasswordUtil.compare(password.toUpperCase(), user.passwordHash);
      }
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Invalid employee ID or password',
      );
    }

    const payload = {
      sub: user.id,
      employeeId: user.employeeId,
      role: user.role.name,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      employeeId: user.employeeId,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
    };
  }

}