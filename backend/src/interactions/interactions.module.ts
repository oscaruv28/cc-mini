import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Call } from '../entities/call.entity';
import { Ticket } from '../entities/ticket.entity';
import { User } from '../entities/user.entity';
import { Disposition } from '../entities/disposition.entity';
import { InteractionView } from '../entities/interaction-view.entity';
import { InteractionsService } from './interactions.service';
import { InteractionsController } from './interactions.controller';

@Module({
  imports: [
    MikroOrmModule.forFeature([Call, Ticket, User, Disposition, InteractionView]),
  ],
  controllers: [InteractionsController],
  providers: [InteractionsService],
})
export class InteractionsModule {}
