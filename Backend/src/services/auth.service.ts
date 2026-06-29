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
    const { employeeId, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: {
        employeeId,
      },

      include: {
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid employee ID or password',
      );
    }

    const isPasswordValid =
      await PasswordUtil.compare(
        password,
        user.passwordHash,
      );

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

    const accessToken =
      await this.jwtService.signAsync(payload);

    return {
      accessToken,

      employeeId: user.employeeId,

      firstName: user.firstName,

      lastName: user.lastName,

      role: user.role.name,
    };
  }

  async devLogin(employeeId: string): Promise<AuthResponseDto> {
    let user = await this.prisma.user.findUnique({
      where: { employeeId },
      include: { role: true },
    });
    
    if (!user) {
      user = await this.prisma.user.findFirst({
        where: { role: { name: 'Admin' } },
        include: { role: true },
      });
    }

    if (!user) {
      throw new UnauthorizedException('No user found in database');
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