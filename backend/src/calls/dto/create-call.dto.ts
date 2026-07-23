import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { CallDirection } from '../call.types';

export class CreateCallDto {
  @ApiProperty({ format: 'uuid', description: 'Agente asignado (User con rol AGENT)' })
  @IsUUID()
  agentId!: string;

  @ApiProperty({ enum: CallDirection })
  @IsEnum(CallDirection)
  direction!: CallDirection;

  @ApiPropertyOptional({ description: 'Duración en segundos' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  durationSec?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Timestamp de apertura ISO 8601; por defecto, ahora' })
  @IsOptional()
  @IsDateString()
  openedAt?: string;
}
