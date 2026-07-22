import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InteractionsService } from './interactions.service';
import { CreateCallDto } from './dto/create-call.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { ListInteractionsQueryDto } from './dto/list-interactions-query.dto';
import { InteractionType } from '../entities/enums';

@ApiTags('interactions')
@Controller('interactions')
export class InteractionsController {
  constructor(private readonly service: InteractionsService) {}

  @Post('calls')
  createCall(@Body() dto: CreateCallDto) {
    return this.service.createCall(dto);
  }

  @Post('tickets')
  createTicket(@Body() dto: CreateTicketDto) {
    return this.service.createTicket(dto);
  }

  @Patch('calls/:id/status')
  changeCallStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
  ) {
    return this.service.changeStatus(InteractionType.CALL, id, dto.status);
  }

  @Patch('tickets/:id/status')
  changeTicketStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
  ) {
    return this.service.changeStatus(InteractionType.TICKET, id, dto.status);
  }

  @Get()
  list(@Query() query: ListInteractionsQueryDto) {
    return this.service.list(query);
  }
}
