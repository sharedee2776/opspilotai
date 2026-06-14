import { Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { QueueProducerService } from '../../core/queue/queue-producer.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AlertsService } from './alerts.service';
import { IngestAlertDto } from './dto/ingest-alert.dto';

@Controller('alerts')
export class AlertsController {
  constructor(
    private readonly alertsService: AlertsService,
    private readonly queueProducer: QueueProducerService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async create(@CurrentUser() user: AuthenticatedUser, @Body() payload: IngestAlertDto) {
    const job = await this.queueProducer.enqueueAlert({
      organizationId: user.organizationId,
      rawPayload: payload as unknown as Record<string, unknown>,
    });
    return {
      status: 'queued',
      jobId: job.id,
      queue: job.queueName,
      organizationId: user.organizationId,
    };
  }

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query() pagination: PaginationDto) {
    return this.alertsService.findAll(user.organizationId, pagination.page, pagination.limit);
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
