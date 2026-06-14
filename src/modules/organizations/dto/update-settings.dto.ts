import { IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  defaultSlackChannelId?: string;

  @IsOptional()
  @IsString()
  defaultSlackChannelName?: string;
}
