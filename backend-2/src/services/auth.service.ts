import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../database/prisma.service';

import { LoginDto } from '../modules/auth/dto/login.dto';

import { AuthResponseDto } from '../modules/auth/dto/auth-response.dto';

import { PasswordUtil } from '../common/utils/password.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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

    if (!employeeId || !password) {
      throw new UnauthorizedException(
        'Employee ID and password are required',
      );
    }

    // Case-insensitive search by employeeId
    let user = await this.prisma.user.findFirst({
      where: {
        employeeId: {
          equals: employeeId,
          mode: 'insensitive',
        },
        isDeleted: false,
        isActive: true,
      },
      include: {
        role: true,
      },
    });

    // Fallback: search by email or mobile
    if (!user) {
      user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: employeeId, mode: 'insensitive' } },
            { mobile: employeeId },
          ],
          isDeleted: false,
          isActive: true,
        },
        include: {
          role: true,
        },
      });
    }

    if (!user) {
      // Use generic message to prevent user enumeration attacks
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    // Verify password
    const isPasswordValid = await PasswordUtil.compare(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      this.logger.warn(
        `Failed login attempt for employee: ${employeeId}`,
      );
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    const payload = {
      sub: user.id,
      employeeId: user.employeeId,
      role: user.role.name,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    this.logger.log(
      `Successful login: ${user.employeeId} (${user.role.name})`,
    );

    return {
      accessToken,
      employeeId: user.employeeId,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
    };
  }

}