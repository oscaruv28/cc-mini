import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/user.entity';

/** Vista pública mínima de un agente en respuestas (sin email, empresa ni hash). */
export class AgentSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;
}

export function toAgentSummary(u: User): AgentSummaryDto {
  return { id: u.id, name: u.name };
}
