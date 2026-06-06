import { IsEnum, IsObject, IsOptional, IsString, MinLength } from 'class-validator';
import { IntegrationType } from '../../../common/entities/integration.entity';

export class CreateIntegrationDto {
  @IsEnum(IntegrationType)
  type: IntegrationType;

  @IsString()
  @MinLength(1)
  externalId: string;

  @IsOptional()
  @IsObject()
  credentials?: Record<string, unknown>;
}
