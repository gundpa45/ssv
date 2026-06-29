import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      message: 'Welcome to the WMS API (v1)',
      status: 'API is running',
      docs: 'Navigate to /api/v1/health to check server status.'
    };
  }
}
