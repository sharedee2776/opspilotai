import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertEntity, AlertStatus } from '../../../common/entities/alert.entity';
import { IncidentEntity, IncidentStatus } from '../../../common/entities/incident.entity';

@Injectable()
export class IncidentBuilderService {
  constructor(
    @InjectRepository(AlertEntity)
    private readonly alertRepository: Repository<AlertEntity>,
    @InjectRepository(IncidentEntity)
    private readonly incidentRepository: Repository<IncidentEntity>,
  ) {}

  async createIncidentForService(
    organizationId: string,
    service: string,
    alerts: AlertEntity[],
  ): Promise<IncidentEntity> {
    const incident = this.incidentRepository.create({
      organizationId,
      title: `${service} incident`,
      summary: `Grouped ${alerts.length} alerts for ${service}`,
      service,
      status: IncidentStatus.ACTIVE,
      alertCount: alerts.length,
      suggestedFixes: [],
    });

    const savedIncident = await this.incidentRepository.save(incident);

    for (const alert of alerts) {
      alert.status = AlertStatus.GROUPED;
      alert.incident = savedIncident;
      await this.alertRepository.save(alert);
    }

    return savedIncident;
  }

  async findPendingAlertsForService(
    organizationId: string,
    service: string,
  ): Promise<AlertEntity[]> {
    return this.alertRepository.find({
      where: { organizationId, status: AlertStatus.PENDING, service },
      order: { createdAt: 'ASC' },
    });
  }

  async createIncidentIfThresholdMet(
    organizationId: string,
    service: string,
    minAlerts: number,
  ): Promise<IncidentEntity | null> {
    const pendingAlerts = await this.findPendingAlertsForService(organizationId, service);
    if (pendingAlerts.length < minAlerts) {
      return null;
    }

    return this.createIncidentForService(organizationId, service, pendingAlerts);
  }
}
