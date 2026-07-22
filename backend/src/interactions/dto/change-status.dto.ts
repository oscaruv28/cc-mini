import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { InteractionStatus } from '../../entities/enums';

export class ChangeStatusDto {
  @ApiProperty({
    enum: InteractionStatus,
    description: 'Nuevo estado. Transiciones válidas: OPEN→IN_PROGRESS→RESOLVED.',
  })
  @IsEnum(InteractionStatus)
  status!: InteractionStatus;
}
