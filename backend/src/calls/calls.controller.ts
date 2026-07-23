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
import { CallsService } from './calls.service';
import { CreateCallDto } from './dto/create-call.dto';
import { SimulateCallDto } from './dto/simulate-call.dto';
import { ListCallsQueryDto } from './dto/list-calls-query.dto';
import { ChangeStatusDto } from '../common/dto/change-status.dto';
import { SetDispositionDto } from '../common/dto/set-disposition.dto';
import { CurrentUser, type JwtUser } from '../auth/decorators/current-user.decorator';

@ApiTags('calls')
@ApiBearerAuth()
@Controller('calls')
export class CallsController {
  constructor(private readonly service: CallsService) {}

  @Post()
  create(@Body() dto: CreateCallDto, @CurrentUser() user: JwtUser) {
    return this.service.create(dto, user.customerId);
  }

  @Post('simulate')
  simulate(@Body() dto: SimulateCallDto, @CurrentUser() user: JwtUser) {
    return this.service.simulate(dto.agentId, dto.count, user.customerId);
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
  list(@Query() query: ListCallsQueryDto, @CurrentUser() user: JwtUser) {
    return this.service.list(query, user.customerId);
  }
}
