import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertEntity } from '../../common/entities/alert.entity';
import { IncidentEntity } from '../../common/entities/incident.entity';
import { RedisService } from '../../core/redis/redis.service';

export interface MetricsSummary {
  organizationId: string;
  pipeline: {
    alertsReceived: number;
    duplicatesSkipped: number;
    alertsStored: number;
    incidentsCreated: number;
    duplicateRatePercent: number;
    noiseReductionPercent: number;
    alertsPerIncident: number | null;
  };
  persisted: {
    alerts: number;
    incidents: number;
    alertsPerIncident: number | null;
  };
}

const METRIC_PREFIX = 'metrics';

@Injectable()
export class MetricsService {
  constructor(
    private readonly redisService: RedisService,
    @InjectRepository(AlertEntity)
    private readonly alertRepository: Repository<AlertEntity>,
    @InjectRepository(IncidentEntity)
    private readonly incidentRepository: Repository<IncidentEntity>,
  ) {}

  async recordAlertReceived(organizationId: string): Promise<void> {
    await this.increment(organizationId, 'alerts_received');
  }

  async recordDuplicateSkipped(organizationId: string): Promise<void> {
    await this.increment(organizationId, 'duplicates_skipped');
  }

  async recordAlertStored(organizationId: string): Promise<void> {
    await this.increment(organizationId, 'alerts_stored');
  }

  async recordIncidentCreated(organizationId: string): Promise<void> {
    await this.increment(organizationId, 'incidents_created');
  }

  async getSummary(organizationId: string): Promise<MetricsSummary> {
    const client = this.redisService.getClient();
    const [alertsReceivedRaw, duplicatesSkippedRaw, alertsStoredRaw, incidentsCreatedRaw] =
      await Promise.all([
        client.get(this.key(organizationId, 'alerts_received')),
        client.get(this.key(organizationId, 'duplicates_skipped')),
        client.get(this.key(organizationId, 'alerts_stored')),
        client.get(this.key(organizationId, 'incidents_created')),
      ]);

    const alertsReceived = this.parseCounter(alertsReceivedRaw);
    const duplicatesSkipped = this.parseCounter(duplicatesSkippedRaw);
    const alertsStored = this.parseCounter(alertsStoredRaw);
    const incidentsCreated = this.parseCounter(incidentsCreatedRaw);

    const [persistedAlerts, persistedIncidents] = await Promise.all([
      this.alertRepository.count({ where: { organizationId } }),
      this.incidentRepository.count({ where: { organizationId } }),
    ]);

    return {
      organizationId,
      pipeline: this.buildPipelineMetrics({
        alertsReceived,
        duplicatesSkipped,
        alertsStored,
        incidentsCreated,
      }),
      persisted: {
        alerts: persistedAlerts,
        incidents: persistedIncidents,
        alertsPerIncident: this.ratio(persistedAlerts, persistedIncidents),
      },
    };
  }

  buildPipelineMetrics(input: {
    alertsReceived: number;
    duplicatesSkipped: number;
    alertsStored: number;
    incidentsCreated: number;
  }): MetricsSummary['pipeline'] {
    const { alertsReceived, duplicatesSkipped, alertsStored, incidentsCreated } = input;

    return {
      alertsReceived,
      duplicatesSkipped,
      alertsStored,
      incidentsCreated,
      duplicateRatePercent: this.percent(duplicatesSkipped, alertsReceived),
      noiseReductionPercent: this.noiseReductionPercent(alertsReceived, incidentsCreated),
      alertsPerIncident: this.ratio(alertsStored, incidentsCreated),
    };
  }

  noiseReductionPercent(alertsReceived: number, incidentsCreated: number): number {
    if (alertsReceived <= 0) {
      return 0;
    }

    const reduction = ((alertsReceived - incidentsCreated) / alertsReceived) * 100;
    return Math.max(0, this.roundPercent(reduction));
  }

  private async increment(organizationId: string, metric: string): Promise<void> {
    await this.redisService.getClient().incr(this.key(organizationId, metric));
  }

  private key(organizationId: string, metric: string): string {
    return `${METRIC_PREFIX}:${organizationId}:${metric}`;
  }

  private parseCounter(value: string | null): number {
    return Number.parseInt(value || '0', 10);
  }

  private percent(numerator: number, denominator: number): number {
    if (denominator <= 0) {
      return 0;
    }

    return this.roundPercent((numerator / denominator) * 100);
  }

  private ratio(numerator: number, denominator: number): number | null {
    if (denominator <= 0) {
      return null;
    }

    return Math.round((numerator / denominator) * 100) / 100;
  }

  private roundPercent(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
