import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private static readonly MAX_RETRIES = 5;
  private static readonly RETRY_DELAY_MS = 3000;

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'production'
          ? ['error', 'warn']
          : ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting Prisma client...');
    await this.$disconnect();
    this.logger.log('Prisma client disconnected.');
  }

  /**
   * Production-grade connection with exponential backoff retry.
   * Critical for cloud-hosted databases (Neon, Render, etc.) which may
   * have cold-start latency on the first connection.
   */
  private async connectWithRetry(attempt = 1): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully.');
    } catch (error: any) {
      if (attempt >= PrismaService.MAX_RETRIES) {
        this.logger.error(
          `❌ Failed to connect to database after ${PrismaService.MAX_RETRIES} attempts.`,
          error?.stack,
        );
        throw error;
      }

      const delay = PrismaService.RETRY_DELAY_MS * attempt;
      this.logger.warn(
        `⚠️ Database connection attempt ${attempt}/${PrismaService.MAX_RETRIES} failed. Retrying in ${delay}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.connectWithRetry(attempt + 1);
    }
  }
}