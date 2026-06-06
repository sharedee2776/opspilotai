import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertEntity, AlertStatus } from '../../common/entities/alert.entity';
import { IncidentEntity, IncidentStatus } from '../../common/entities/incident.entity';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(IncidentEntity)
    private readonly incidentRepository: Repository<IncidentEntity>,
    @InjectRepository(AlertEntity)
    private readonly alertRepository: Repository<AlertEntity>,
  ) {}

  async create(data: Partial<IncidentEntity>): Promise<IncidentEntity> {
    const incident = this.incidentRepository.create({
      ...data,
      status: IncidentStatus.ACTIVE,
      alertCount: data.alertCount ?? 0,
    });

    return this.incidentRepository.save(incident);
  }

  async findAll(): Promise<IncidentEntity[]> {
    return this.incidentRepository.find({
      relations: ['alerts', 'actions'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<IncidentEntity | null> {
    return this.incidentRepository.findOne({
      where: { id },
      relations: ['alerts', 'actions'],
    });
  }

  async updateStatus(
    id: string,
    status: IncidentStatus,
  ): Promise<IncidentEntity | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    existing.status = status;
    return this.incidentRepository.save(existing);
  }

  async addAlertToIncident(
    incidentId: string,
    alert: AlertEntity,
  ): Promise<IncidentEntity | null> {
    const incident = await this.findById(incidentId);
    if (!incident) {
      return null;
    }

    alert.status = AlertStatus.GROUPED;
    alert.incident = incident;
    await this.alertRepository.save(alert);

    incident.alertCount = (incident.alertCount || 0) + 1;
    return this.incidentRepository.save(incident);
  }

  async updateWithAiResults(
    incidentId: string,
    summary: string,
    rootCause: string,
    confidence: string,
  ): Promise<IncidentEntity | null> {
    const incident = await this.findById(incidentId);
    if (!incident) {
      return null;
    }

    incident.summary = summary;
    incident.rootCause = `${rootCause} (confidence: ${confidence})`;
    return this.incidentRepository.save(incident);
  }
}
