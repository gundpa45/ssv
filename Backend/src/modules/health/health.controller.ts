import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      success: true,
      message: 'GameChange Workforce API is running',
      version: 'v1.0.3-robust-date-parsing',
      dbUrl: process.env.DATABASE_URL,
      timestamp: new Date().toISOString(),
    };
  }
}