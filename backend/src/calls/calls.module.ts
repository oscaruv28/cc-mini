import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Call } from './call.entity';
import { User } from '../users/user.entity';
import { Disposition } from '../catalog/disposition.entity';
import { CallsService } from './calls.service';
import { CallsController } from './calls.controller';

@Module({
  imports: [MikroOrmModule.forFeature([Call, User, Disposition])],
  controllers: [CallsController],
  providers: [CallsService],
})
export class CallsModule {}
