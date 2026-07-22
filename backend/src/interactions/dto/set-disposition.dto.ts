import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/** Tipifica una interacción: le asigna una Disposition (cómo concluyó). */
export class SetDispositionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  dispositionId!: string;
}
