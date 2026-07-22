import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Customer } from '../entities/customer.entity';
import { Disposition } from '../entities/disposition.entity';
import { AgentAvailability } from '../entities/agent-availability.entity';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';

@Module({
  imports: [MikroOrmModule.forFeature([Customer, Disposition, AgentAvailability])],
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}
