import { Module } from '@nestjs/common';

import { ActivitiesController } from '../../controllers/activities.controller';

import { ActivitiesService } from '../../services/activities.service';

import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],

  controllers: [ActivitiesController],

  providers: [ActivitiesService],
})
export class ActivitiesModule {}