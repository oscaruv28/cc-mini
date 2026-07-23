import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { CurrentUser, type JwtUser } from '../auth/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto, @CurrentUser() user: JwtUser) {
    return this.service.create(dto, user.customerId);
  }

  @Get()
  findAll(@Query() query: ListUsersQueryDto, @CurrentUser() user: JwtUser) {
    return this.service.findAll(query, user.customerId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtUser) {
    return this.service.findOne(id, user.customerId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.update(id, dto, user.customerId);
  }

  @Patch(':id/availability')
  setAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetAvailabilityDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.setAvailability(id, dto.availabilityId, user.customerId);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtUser) {
    return this.service.remove(id, user.customerId);
  }
}
