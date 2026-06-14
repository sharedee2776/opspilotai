import { Body, Controller, Headers, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CloudWatchService } from './cloudwatch.service';

@Controller('webhooks/cloudwatch')
export class CloudWatchController {
  constructor(private readonly cloudwatchService: CloudWatchService) {}

  @Public()
  @Post(':integrationId')
  @HttpCode(HttpStatus.ACCEPTED)
  ingest(
    @Param('integrationId') integrationId: string,
    @Headers('x-opspilot-webhook-secret') webhookSecret: string | undefined,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.cloudwatchService.ingestWebhook(integrationId, webhookSecret, payload);
  }
}
