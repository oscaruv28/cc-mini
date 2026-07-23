import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { TicketPriority } from '../ticket.types';

export class CreateTicketDto {
  @ApiProperty({ format: 'uuid', description: 'Agente asignado (User con rol AGENT)' })
  @IsUUID()
  agentId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Llamada que originó el ticket' })
  @IsOptional()
  @IsUUID()
  callId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TicketPriority, default: TicketPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiPropertyOptional({ description: 'Timestamp de apertura ISO 8601; por defecto, ahora' })
  @IsOptional()
  @IsDateString()
  openedAt?: string;
}
