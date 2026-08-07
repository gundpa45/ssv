import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('roles')
export class RolesController {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getRoles() {
    const roles = await this.prisma.role.findMany({
      where: {
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    const mappedRoles: any[] = [];
    for (const r of roles) {
      if (r.name === 'Worker') {
        mappedRoles.push({ id: `${r.id}:Skilled`, name: 'Skilled' });
        mappedRoles.push({ id: `${r.id}:Trainee`, name: 'Trainee' });
      } else {
        mappedRoles.push(r);
      }
    }

    return mappedRoles;
  }
}
