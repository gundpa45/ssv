import { Module } from '@nestjs/common';

import { DashboardController } from '../../controllers/dashboard.controller';

import { DashboardService } from '../../services/dashboard.service';

import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],

  controllers: [DashboardController],

  providers: [DashboardService],
})
export class DashboardModule {}