import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
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
  async create(@Body() payload: any) {
    const job = await this.queueProducer.enqueueAlert({ rawPayload: payload });
    return {
      status: 'queued',
      jobId: job.id,
      queue: job.queueName,
    };
  }

  @Get()
  async findAll() {
    return this.alertsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.alertsService.findById(id);
  }
}
