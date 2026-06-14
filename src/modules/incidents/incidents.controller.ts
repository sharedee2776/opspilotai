import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { IncidentsService } from './incidents.service';
import { IncidentStatus } from '../../common/entities/incident.entity';
import { IncidentBuilderService } from './services/incident-builder.service';
import { AiService } from '../ai/ai.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('incidents')
export class IncidentsController {
  constructor(
    private readonly incidentsService: IncidentsService,
    private readonly incidentBuilder: IncidentBuilderService,
    private readonly aiService: AiService,
  ) {}

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateIncidentDto) {
    return this.incidentsService.create({
      ...dto,
      organizationId: user.organizationId,
    });
  }

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query() pagination: PaginationDto) {
    return this.incidentsService.findAll(user.organizationId, pagination.page, pagination.limit);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const incident = await this.incidentsService.findById(id, user.organizationId);
    if (!incident) {
      throw new NotFoundException('Incident not found');
    }
    return incident;
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('status') status: IncidentStatus,
  ) {
    const incident = await this.incidentsService.updateStatus(id, user.organizationId, status);
    if (!incident) {
      throw new NotFoundException('Incident not found');
    }
    return incident;
  }

  @Post('group/:service')
  async groupAlertsByService(
    @CurrentUser() user: AuthenticatedUser,
    @Param('service') service: string,
  ) {
    const minAlerts = parseInt(process.env.MIN_ALERTS_TO_GROUP || '2', 10);
    const incident = await this.incidentBuilder.createIncidentIfThresholdMet(
      user.organizationId,
      service,
      minAlerts,
    );

    if (!incident) {
      return {
        success: false,
        message: `Not enough pending alerts for ${service}`,
        incident: null,
      };
    }

    const alerts = await this.incidentsService.getAlertsForIncident(incident.id, user.organizationId);

    try {
      const summary = await this.aiService.summarizeAlerts(alerts);
      const rootCause = await this.aiService.analyzeRootCause(alerts);
      await this.incidentsService.updateWithAiResults(
        incident.id,
        user.organizationId,
        summary.summary,
        rootCause.root_cause,
        rootCause.confidence,
      );

      const updatedIncident = await this.incidentsService.findById(incident.id, user.organizationId);
      return {
        success: true,
        message: `Grouped incident created with ${incident.alertCount} alerts and AI analysis`,
        incident: updatedIncident,
      };
    } catch (error) {
      return {
        success: true,
        message: `Grouped incident created with ${incident.alertCount} alerts (AI analysis failed)`,
        incident,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
