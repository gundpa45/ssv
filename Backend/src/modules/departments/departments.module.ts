import { Module } from '@nestjs/common';

import { DepartmentsController } from '../../controllers/departments.controller';

import { DepartmentsService } from '../../services/departments.service';

import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],

  controllers: [DepartmentsController],

  providers: [DepartmentsService],
})
export class DepartmentsModule {}