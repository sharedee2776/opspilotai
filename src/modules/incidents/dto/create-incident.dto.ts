import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { IncidentStatus } from '../../../common/entities/incident.entity';

export class CreateIncidentDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  service: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;
}
