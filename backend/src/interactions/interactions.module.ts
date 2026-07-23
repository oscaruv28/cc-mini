import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { InteractionView } from './interaction-view.entity';
import { InteractionsService } from './interactions.service';
import { InteractionsController } from './interactions.controller';

/** Read model unificado (solo lectura) del timeline de interacciones. */
@Module({
  imports: [MikroOrmModule.forFeature([InteractionView])],
  controllers: [InteractionsController],
  providers: [InteractionsService],
})
export class InteractionsModule {}
