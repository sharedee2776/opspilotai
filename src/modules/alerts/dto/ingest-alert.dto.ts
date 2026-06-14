import { IsIn, IsObject, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
const SOURCES = ['slack', 'datadog', 'cloudwatch'] as const;

export class IngestAlertDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  service: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(SEVERITIES)
  severity?: string;

  @IsOptional()
  @IsIn(SOURCES)
  source?: string;

  @IsOptional()
  @IsUUID()
  integrationId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
