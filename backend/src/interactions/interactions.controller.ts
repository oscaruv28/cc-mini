import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InteractionsService } from './interactions.service';
import { ListInteractionsQueryDto } from './dto/list-interactions-query.dto';
import { CurrentUser, type JwtUser } from '../auth/decorators/current-user.decorator';

/**
 * Timeline combinado de interacciones (llamadas + tickets), SOLO LECTURA.
 * La creación/estados/tipificación viven en `calls` y `tickets`.
 */
@ApiTags('interactions')
@ApiBearerAuth()
@Controller('interactions')
export class InteractionsController {
  constructor(private readonly service: InteractionsService) {}

  @Get()
  list(@Query() query: ListInteractionsQueryDto, @CurrentUser() user: JwtUser) {
    return this.service.list(query, user.customerId);
  }
}
