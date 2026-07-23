import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { InteractionStatus } from '../enums';

/** Cambia el estado de una interacción (llamada o ticket). Compartido por ambos módulos. */
export class ChangeStatusDto {
  @ApiProperty({
    enum: InteractionStatus,
    description: 'Nuevo estado. Transiciones válidas: OPEN→IN_PROGRESS→RESOLVED.',
  })
  @IsEnum(InteractionStatus)
  status!: InteractionStatus;
}
