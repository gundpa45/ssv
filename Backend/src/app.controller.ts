import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getRoot() {
    let dbStatus = 'Disconnected';
    try {
      // Run a simple query to verify database connection
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'Connected';
    } catch (error: any) {
      dbStatus = `Connection Error: ${error?.message || error}`;
    }

    return {
      appName: 'Workforce Management System (WMS) Backend API',
      version: '1.0.0',
      apiStatus: 'Healthy & Running',
      databaseStatus: dbStatus,
      environment: process.env.NODE_ENV || 'production',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        activities: '/api/v1/activities',
        salesOrders: '/api/v1/sales-orders',
        activityLogs: '/api/v1/activity-logs',
      }
    };
  }
}
