import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from '../entities/user.entity';
import { Customer } from '../entities/customer.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [MikroOrmModule.forFeature([User, Customer])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
