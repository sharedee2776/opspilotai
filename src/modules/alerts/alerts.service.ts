import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { AlertEntity, AlertSeverity, AlertSource, AlertStatus } from '../../common/entities/alert.entity';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { AlertNormalizerService } from './services/alert-normalizer.service';
import { DeduplicationService } from './services/deduplication.service';

export interface IngestAlertInput {
  organizationId: string;
  integrationId?: string;
  rawPayload: Record<string, unknown>;
}

export interface IngestAlertResult {
  alert: AlertEntity | null;
  duplicate: boolean;
  service: string;
}

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(AlertEntity)
    private readonly alertRepository: Repository<AlertEntity>,
    private readonly alertNormalizer: AlertNormalizerService,
    private readonly deduplicationService: DeduplicationService,
  ) {}

  async ingestAlert(input: IngestAlertInput): Promise<IngestAlertResult> {
    const normalized = this.alertNormalizer.normalize(input.rawPayload);
    const dedupHash = this.deduplicationService.generateDedupHash(normalized, input.organizationId);
    const service = normalized.service;

    if (await this.deduplicationService.isDuplicate(dedupHash, input.organizationId)) {
      return { alert: null, duplicate: true, service };
    }

    const partialAlert: DeepPartial<AlertEntity> = {
      organizationId: input.organizationId,
      integrationId: input.integrationId ?? null,
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

  async findAll(
    organizationId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<AlertEntity>> {
    const [data, total] = await this.alertRepository.findAndCount({
      where: { organizationId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string, organizationId: string): Promise<AlertEntity | null> {
    return this.alertRepository.findOne({ where: { id, organizationId } });
  }

  async markGrouped(id: string, organizationId: string, incidentId: string): Promise<AlertEntity | null> {
    const alert = await this.findById(id, organizationId);
    if (!alert) {
      return null;
    }

    alert.status = AlertStatus.GROUPED;
    alert.incident = { id: incidentId } as any;

    return this.alertRepository.save(alert);
  }
}
