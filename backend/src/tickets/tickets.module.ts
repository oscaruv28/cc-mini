import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Ticket } from './ticket.entity';
import { Call } from '../calls/call.entity';
import { User } from '../users/user.entity';
import { Disposition } from '../catalog/disposition.entity';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';

@Module({
  imports: [MikroOrmModule.forFeature([Ticket, Call, User, Disposition])],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
