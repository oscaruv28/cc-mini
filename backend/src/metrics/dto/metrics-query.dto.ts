import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class MetricsQueryDto {
  @ApiProperty({ example: '2026-07-01', description: 'Inicio del rango (fecha, UTC-5)' })
  @IsDateString()
  from!: string;

  @ApiProperty({ example: '2026-07-31', description: 'Fin del rango, inclusive (fecha, UTC-5)' })
  @IsDateString()
  to!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filtrar por un agente' })
  @IsOptional()
  @IsUUID()
  agentId?: string;
}
