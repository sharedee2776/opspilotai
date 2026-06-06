import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { AlertEntity, AlertSeverity, AlertSource, AlertStatus } from '../../common/entities/alert.entity';
import { AlertNormalizerService } from './services/alert-normalizer.service';
import { DeduplicationService } from './services/deduplication.service';

export interface IngestAlertResult {
  alert: AlertEntity | null;
  duplicate: boolean;
  service: string;
}

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectRepository(AlertEntity)
    private readonly alertRepository: Repository<AlertEntity>,
    private readonly alertNormalizer: AlertNormalizerService,
    private readonly deduplicationService: DeduplicationService,
  ) {}

  async ingestAlert(rawPayload: any): Promise<IngestAlertResult> {
    const normalized = this.alertNormalizer.normalize(rawPayload);
    const dedupHash = this.deduplicationService.generateDedupHash(normalized);
    const service = normalized.service;

    if (await this.deduplicationService.isDuplicate(dedupHash)) {
      this.logger.log(`Duplicate alert suppressed for service ${service}`);
      return { alert: null, duplicate: true, service };
    }

    const partialAlert: DeepPartial<AlertEntity> = {
      title: normalized.title,
      description: normalized.description,
      service,
      severity: normalized.severity as AlertSeverity,
      source: normalized.source as AlertSource,
      metadata: normalized.metadata,
      dedupHash,
      status: AlertStatus.PENDING,
    };

    const alert = await this.alertRepository.save(this.alertRepository.create(partialAlert));
    return { alert, duplicate: false, service };
  }

  /** @deprecated Prefer ingestAlert via queue for production ingress */
  async create(rawPayload: any): Promise<AlertEntity> {
    const result = await this.ingestAlert(rawPayload);
    if (result.duplicate || !result.alert) {
      throw new Error('Duplicate alert');
    }
    return result.alert;
  }

  async findAll(): Promise<AlertEntity[]> {
    return this.alertRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<AlertEntity | null> {
    return this.alertRepository.findOne({ where: { id } });
  }

  async markGrouped(id: string, incidentId: string): Promise<AlertEntity | null> {
    const alert = await this.findById(id);
    if (!alert) {
      return null;
    }

    alert.status = AlertStatus.GROUPED;
    alert.incident = { id: incidentId } as any;

    return this.alertRepository.save(alert);
  }
}
