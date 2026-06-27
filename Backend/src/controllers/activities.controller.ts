import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ActivitiesService } from '../services/activities.service';

import { CreateActivityDto } from '../modules/activities/dto/create-activity.dto';

import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';

import { RolesGuard } from '../modules/auth/guards/roles.guard';

import { Roles } from '../modules/auth/decorators/roles.decorator';

@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)

  @Roles('Admin')

  @Post()
  async createActivity(
    @Body()
    createActivityDto: CreateActivityDto,
  ) {
    return this.activitiesService.createActivity(
      createActivityDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getActivities() {
    return this.activitiesService.getActivities();
  }
}