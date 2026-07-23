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
import { CurrentUser, type JwtUser } from '../auth/current-user.decorator';

@ApiTags('interactions')
@ApiBearerAuth()
@Controller('interactions')
export class InteractionsController {
  constructor(private readonly service: InteractionsService) {}

  @Post('calls')
  createCall(@Body() dto: CreateCallDto, @CurrentUser() user: JwtUser) {
    return this.service.createCall(dto, user.customerId);
  }

  @Post('tickets')
  createTicket(@Body() dto: CreateTicketDto, @CurrentUser() user: JwtUser) {
    return this.service.createTicket(dto, user.customerId);
  }

  @Post('calls/simulate')
  simulate(@Body() dto: SimulateCallDto, @CurrentUser() user: JwtUser) {
    return this.service.simulateCalls(dto.agentId, dto.count, user.customerId);
  }

  @Patch('calls/:id/status')
  changeCallStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.changeStatus(InteractionType.CALL, id, dto.status, user.customerId);
  }

  @Patch('tickets/:id/status')
  changeTicketStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.changeStatus(InteractionType.TICKET, id, dto.status, user.customerId);
  }

  @Patch('calls/:id/disposition')
  tipifyCall(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetDispositionDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.setDisposition(InteractionType.CALL, id, dto.dispositionId, user.customerId);
  }

  @Patch('tickets/:id/disposition')
  tipifyTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetDispositionDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.setDisposition(InteractionType.TICKET, id, dto.dispositionId, user.customerId);
  }

  @Get('calls/:id')
  getCall(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtUser) {
    return this.service.findDetail(InteractionType.CALL, id, user.customerId);
  }

  @Get('tickets/:id')
  getTicket(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtUser) {
    return this.service.findDetail(InteractionType.TICKET, id, user.customerId);
  }

  @Get()
  list(@Query() query: ListInteractionsQueryDto, @CurrentUser() user: JwtUser) {
    return this.service.list(query, user.customerId);
  }
}
