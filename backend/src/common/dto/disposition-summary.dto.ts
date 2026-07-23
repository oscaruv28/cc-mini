import { ApiProperty } from '@nestjs/swagger';
import { Disposition } from '../../catalog/disposition.entity';

/** Vista pública de una tipificación en respuestas. */
export class DispositionSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  label!: string;
}

export function toDispositionSummary(d?: Disposition | null): DispositionSummaryDto | null {
  if (!d) return null;
  return { id: d.id, code: d.code, label: d.label };
}
