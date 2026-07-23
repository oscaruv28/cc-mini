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
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';
import { ChangeStatusDto } from '../common/dto/change-status.dto';
import { SetDispositionDto } from '../common/dto/set-disposition.dto';
import { CurrentUser, type JwtUser } from '../auth/decorators/current-user.decorator';

@ApiTags('tickets')
@ApiBearerAuth()
@Controller('tickets')
export class TicketsController {
  constructor(private readonly service: TicketsService) {}

  @Post()
  create(@Body() dto: CreateTicketDto, @CurrentUser() user: JwtUser) {
    return this.service.create(dto, user.customerId);
  }

  @Patch(':id/status')
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.changeStatus(id, dto.status, user.customerId);
  }

  @Patch(':id/disposition')
  tipify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetDispositionDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.setDisposition(id, dto.dispositionId, user.customerId);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtUser) {
    return this.service.findDetail(id, user.customerId);
  }

  @Get()
  list(@Query() query: ListTicketsQueryDto, @CurrentUser() user: JwtUser) {
    return this.service.list(query, user.customerId);
  }
}
