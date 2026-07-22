import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/** Cambia la disponibilidad de un agente. */
export class SetAvailabilityDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  availabilityId!: string;
}
