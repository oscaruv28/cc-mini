import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from './user.entity';
import { Customer } from '../catalog/customer.entity';
import { AgentAvailability } from '../catalog/agent-availability.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [MikroOrmModule.forFeature([User, Customer, AgentAvailability])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
