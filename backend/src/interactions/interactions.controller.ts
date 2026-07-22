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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InteractionsService } from './interactions.service';
import { CreateCallDto } from './dto/create-call.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { SetDispositionDto } from './dto/set-disposition.dto';
import { SimulateCallDto } from './dto/simulate-call.dto';
import { ListInteractionsQueryDto } from './dto/list-interactions-query.dto';
import { InteractionType } from '../entities/enums';

@ApiTags('interactions')
@ApiBearerAuth()
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

  /** Genera llamadas aleatorias coherentes para un agente (botón "simular"). */
  @Post('calls/simulate')
  simulate(@Body() dto: SimulateCallDto) {
    return this.service.simulateCalls(dto.agentId, dto.count);
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

  @Patch('calls/:id/disposition')
  tipifyCall(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetDispositionDto,
  ) {
    return this.service.setDisposition(InteractionType.CALL, id, dto.dispositionId);
  }

  @Patch('tickets/:id/disposition')
  tipifyTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetDispositionDto,
  ) {
    return this.service.setDisposition(InteractionType.TICKET, id, dto.dispositionId);
  }

  @Get()
  list(@Query() query: ListInteractionsQueryDto) {
    return this.service.list(query);
  }
}
