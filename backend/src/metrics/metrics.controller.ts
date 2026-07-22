import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';
import { MetricsQueryDto } from './dto/metrics-query.dto';

@ApiTags('metrics')
@ApiBearerAuth()
@Controller('metrics')
export class MetricsController {
  constructor(private readonly service: MetricsService) {}

  @Get()
  get(@Query() query: MetricsQueryDto) {
    return this.service.getMetrics(query);
  }
}
