import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class SimulateCallDto {
  @ApiProperty({ format: 'uuid', description: 'Agente que "atiende" la llamada simulada' })
  @IsUUID()
  agentId!: string;

  @ApiPropertyOptional({ default: 1, minimum: 1, maximum: 500, description: 'Cuántas generar' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  count: number = 1;
}
