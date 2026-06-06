import { Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { QueueProducerService } from '../../core/queue/queue-producer.service';
import { AlertsService } from './alerts.service';

@Controller('alerts')
export class AlertsController {
  constructor(
    private readonly alertsService: AlertsService,
    private readonly queueProducer: QueueProducerService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async create(@CurrentUser() user: AuthenticatedUser, @Body() payload: Record<string, unknown>) {
    const job = await this.queueProducer.enqueueAlert({
      organizationId: user.organizationId,
      rawPayload: payload,
    });
    return {
      status: 'queued',
      jobId: job.id,
      queue: job.queueName,
      organizationId: user.organizationId,
    };
  }

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.alertsService.findAll(user.organizationId);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const alert = await this.alertsService.findById(id, user.organizationId);
    if (!alert) {
      throw new NotFoundException('Alert not found');
    }
    return alert;
  }
}
