import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { AlertEntity, AlertSeverity, AlertSource, AlertStatus } from '../../common/entities/alert.entity';
import { AlertNormalizerService } from './services/alert-normalizer.service';
import { DeduplicationService } from './services/deduplication.service';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(AlertEntity)
    private readonly alertRepository: Repository<AlertEntity>,
    private readonly alertNormalizer: AlertNormalizerService,
    private readonly deduplicationService: DeduplicationService,
  ) {}

  async create(rawPayload: any): Promise<AlertEntity> {
    const normalized = this.alertNormalizer.normalize(rawPayload);
    const dedupHash = this.deduplicationService.generateDedupHash(normalized);

    const partialAlert: DeepPartial<AlertEntity> = {
      title: normalized.title,
      description: normalized.description,
      service: normalized.service,
      severity: normalized.severity as AlertSeverity,
      source: normalized.source as AlertSource,
      metadata: normalized.metadata,
      dedupHash,
      status: AlertStatus.PENDING,
    };

    const alert = this.alertRepository.create(partialAlert);
    return this.alertRepository.save(alert as AlertEntity);
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
