import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';


import { ActivityLogsService } from '../services/activity-logs.service';

import { CreateActivityLogDto } from '../modules/activity-logs/dto/create-activity-log.dto';
import { UpdateActivityLogDto } from '../modules/activity-logs/dto/update-activity-log.dto';

import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';

@Controller('activity-logs')
export class ActivityLogsController {
  constructor(
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  @UseGuards(JwtAuthGuard)

  @Post()
  async createActivityLog(
    @Req() req: any,

    @Body()
    createActivityLogDto: CreateActivityLogDto,
  ) {


    return this.activityLogsService.createActivityLog(
      req.user.userId,

      createActivityLogDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getActivityLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.activityLogsService.getActivityLogs(pageNum, limitNum);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateActivityLog(
    @Req() req: any,
    @Body() updateActivityLogDto: UpdateActivityLogDto,
    @Param('id') id: string,
  ) {
    return this.activityLogsService.updateActivityLog(id, updateActivityLogDto);
  }
}