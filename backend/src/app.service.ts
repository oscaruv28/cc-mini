import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  health() {
    return {
      status: 'ok',
      service: 'cc-mini-backend',
      tz: process.env.APP_TZ ?? 'America/Bogota',
    };
  }
}
