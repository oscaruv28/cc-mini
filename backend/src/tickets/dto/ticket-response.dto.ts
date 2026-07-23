import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Ticket } from '../ticket.entity';
import { TicketPriority } from '../ticket.types';
import { InteractionStatus } from '../../common/enums';
import { AgentSummaryDto, toAgentSummary } from '../../common/dto/agent-summary.dto';
import {
  DispositionSummaryDto,
  toDispositionSummary,
} from '../../common/dto/disposition-summary.dto';

/** Resumen de la llamada que originó el ticket (subconjunto, sin datos del agente). */
export class TicketCallSummaryDto {
  @ApiPropertyOptional()
  phoneNumber?: string;

  @ApiProperty()
  direction!: string;

  @ApiPropertyOptional()
  durationSec?: number;

  @ApiProperty()
  openedAt!: Date;
}

/** Contrato de salida de un ticket. Desacopla la API de la entidad de persistencia. */
export class TicketResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: InteractionStatus })
  status!: InteractionStatus;

  @ApiProperty()
  subject!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: TicketPriority })
  priority!: TicketPriority;

  @ApiPropertyOptional()
  channel?: string;

  @ApiProperty()
  openedAt!: Date;

  @ApiPropertyOptional()
  closedAt?: Date;

  @ApiProperty({ type: AgentSummaryDto })
  agent!: AgentSummaryDto;

  @ApiPropertyOptional({ type: DispositionSummaryDto, nullable: true })
  disposition!: DispositionSummaryDto | null;

  @ApiPropertyOptional({ type: TicketCallSummaryDto, nullable: true })
  call!: TicketCallSummaryDto | null;
}

export function toTicketResponse(t: Ticket): TicketResponseDto {
  return {
    id: t.id,
    status: t.status,
    subject: t.subject,
    description: t.description,
    priority: t.priority,
    channel: t.channel,
    openedAt: t.openedAt,
    closedAt: t.closedAt,
    agent: toAgentSummary(t.agent),
    disposition: toDispositionSummary(t.disposition),
    call: t.call
      ? {
          phoneNumber: t.call.phoneNumber,
          direction: t.call.direction,
          durationSec: t.call.durationSec,
          openedAt: t.call.openedAt,
        }
      : null,
  };
}
