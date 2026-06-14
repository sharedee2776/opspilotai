import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertEntity, AlertStatus } from '../../common/entities/alert.entity';
import { IncidentEntity, IncidentStatus } from '../../common/entities/incident.entity';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(IncidentEntity)
    private readonly incidentRepository: Repository<IncidentEntity>,
    @InjectRepository(AlertEntity)
    private readonly alertRepository: Repository<AlertEntity>,
  ) {}

  async create(data: Partial<IncidentEntity> & { organizationId: string }): Promise<IncidentEntity> {
    const incident = this.incidentRepository.create({
      ...data,
      status: IncidentStatus.ACTIVE,
      alertCount: data.alertCount ?? 0,
    });

    return this.incidentRepository.save(incident);
  }

  async findAll(
    organizationId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<IncidentEntity>> {
    const [data, total] = await this.incidentRepository.findAndCount({
      where: { organizationId },
      relations: ['alerts', 'actions'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string, organizationId?: string): Promise<IncidentEntity | null> {
    return this.incidentRepository.findOne({
      where: organizationId ? { id, organizationId } : { id },
      relations: ['alerts', 'actions'],
    });
  }

  async requireById(id: string, organizationId: string): Promise<IncidentEntity> {
    const incident = await this.findById(id, organizationId);
    if (!incident) {
      throw new NotFoundException('Incident not found');
    }
    return incident;
  }

  async updateStatus(
    id: string,
    organizationId: string,
    status: IncidentStatus,
  ): Promise<IncidentEntity | null> {
    const existing = await this.findById(id, organizationId);
    if (!existing) {
      return null;
    }

    existing.status = status;
    return this.incidentRepository.save(existing);
  }

  async addAlertToIncident(
    incidentId: string,
    organizationId: string,
    alert: AlertEntity,
  ): Promise<IncidentEntity | null> {
    const incident = await this.findById(incidentId, organizationId);
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
    organizationId: string,
    summary: string,
    rootCause: string,
    confidence: string,
  ): Promise<IncidentEntity | null> {
    const incident = await this.findById(incidentId, organizationId);
    if (!incident) {
      return null;
    }

    incident.summary = summary;
    incident.rootCause = `${rootCause} (confidence: ${confidence})`;
    return this.incidentRepository.save(incident);
  }

  async getAlertsForIncident(incidentId: string, organizationId: string): Promise<AlertEntity[]> {
    return this.alertRepository.find({
      where: { incident: { id: incidentId }, organizationId },
      order: { createdAt: 'ASC' },
    });
  }
}
