import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { IncidentStatus } from '../../common/entities/incident.entity';
import { IncidentBuilderService } from './services/incident-builder.service';
import { AiService } from '../ai/ai.service';
import { AlertEntity } from '../../common/entities/alert.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller('incidents')
export class IncidentsController {
  constructor(
    private readonly incidentsService: IncidentsService,
    private readonly incidentBuilder: IncidentBuilderService,
    private readonly aiService: AiService,
    @InjectRepository(AlertEntity)
    private readonly alertRepository: Repository<AlertEntity>,
  ) {}

  @Post()
  async create(@Body() payload: any) {
    return this.incidentsService.create(payload);
  }

  @Get()
  async findAll() {
    return this.incidentsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.incidentsService.findById(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: IncidentStatus,
  ) {
    return this.incidentsService.updateStatus(id, status);
  }

  @Post('group/:service')
  async groupAlertsByService(@Param('service') service: string) {
    const minAlerts = parseInt(process.env.MIN_ALERTS_TO_GROUP || '2', 10);
    const incident = await this.incidentBuilder.createIncidentIfThresholdMet(service, minAlerts);
    
    if (!incident) {
      return {
        success: false,
        message: `Not enough pending alerts for ${service}`,
        incident: null,
      };
    }

    // Fetch alerts for this incident to use in AI analysis
    const alerts = await this.alertRepository.find({ where: { incident: { id: incident.id } } });

    try {
      const summary = await this.aiService.summarizeAlerts(alerts);
      const rootCause = await this.aiService.analyzeRootCause(alerts);
      await this.incidentsService.updateWithAiResults(
        incident.id,
        summary.summary,
        rootCause.root_cause,
        rootCause.confidence,
      );
      
      // Fetch updated incident with AI results
      const updatedIncident = await this.incidentsService.findById(incident.id);
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
