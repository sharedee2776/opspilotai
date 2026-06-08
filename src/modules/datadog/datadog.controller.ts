import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { DatadogService } from './datadog.service';

@Controller('webhooks/datadog')
export class DatadogController {
  constructor(private readonly datadogService: DatadogService) {}

  @Public()
  @Post(':integrationId')
  @HttpCode(HttpStatus.ACCEPTED)
  async handleWebhook(
    @Param('integrationId') integrationId: string,
    @Headers('x-opspilot-webhook-secret') webhookSecret: string | undefined,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.datadogService.ingestWebhook(integrationId, webhookSecret, payload);
  }
}
