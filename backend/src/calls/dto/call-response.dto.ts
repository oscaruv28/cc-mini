import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Call } from '../call.entity';
import { CallDirection } from '../call.types';
import { InteractionStatus } from '../../common/enums';
import { AgentSummaryDto, toAgentSummary } from '../../common/dto/agent-summary.dto';
import {
  DispositionSummaryDto,
  toDispositionSummary,
} from '../../common/dto/disposition-summary.dto';

/** Contrato de salida de una llamada. Desacopla la API de la entidad de persistencia. */
export class CallResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: InteractionStatus })
  status!: InteractionStatus;

  @ApiProperty({ enum: CallDirection })
  direction!: CallDirection;

  @ApiPropertyOptional({ description: 'Duración en segundos' })
  durationSec?: number;

  @ApiPropertyOptional()
  phoneNumber?: string;

  @ApiProperty()
  openedAt!: Date;

  @ApiPropertyOptional()
  closedAt?: Date;

  @ApiProperty({ type: AgentSummaryDto })
  agent!: AgentSummaryDto;

  @ApiPropertyOptional({ type: DispositionSummaryDto, nullable: true })
  disposition!: DispositionSummaryDto | null;
}

export function toCallResponse(c: Call): CallResponseDto {
  return {
    id: c.id,
    status: c.status,
    direction: c.direction,
    durationSec: c.durationSec,
    phoneNumber: c.phoneNumber,
    openedAt: c.openedAt,
    closedAt: c.closedAt,
    agent: toAgentSummary(c.agent),
    disposition: toDispositionSummary(c.disposition),
  };
}
