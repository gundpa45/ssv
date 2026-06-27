import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './database/prisma.module';

import { HealthModule } from './modules/health/health.module';

import { AuthModule } from './modules/auth/auth.module';

import { UsersModule } from './modules/users/users.module';

import { DepartmentsModule } from './modules/departments/departments.module';

import { ActivitiesModule } from './modules/activities/activities.module';
import { SalesOrdersModule } from './modules/sales-orders/sales-orders.module';
import { ActivityLogsModule } from './modules/activity-logs/activity-logs.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { RolesModule } from './modules/roles/roles.module';
import { LoggerMiddleware } from './middleware/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,

      envFilePath: '.env',
    }),

    PrismaModule,

    HealthModule,

    AuthModule,

    UsersModule,

    DepartmentsModule,

    ActivitiesModule,

    SalesOrdersModule,

    ActivityLogsModule,

    DashboardModule,

    RolesModule,

  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}