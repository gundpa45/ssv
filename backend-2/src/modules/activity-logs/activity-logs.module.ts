import { Module } from '@nestjs/common';

import { ActivityLogsController } from '../../controllers/activity-logs.controller';

import { ActivityLogsService } from '../../services/activity-logs.service';

import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],

  controllers: [ActivityLogsController],

  providers: [ActivityLogsService],
})
export class ActivityLogsModule {}