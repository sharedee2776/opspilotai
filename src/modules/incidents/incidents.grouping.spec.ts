import { Test } from '@nestjs/testing';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { IncidentBuilderService } from './services/incident-builder.service';
import { AiService } from '../ai/ai.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AlertEntity } from '../../common/entities/alert.entity';

describe('IncidentsController grouping flow', () => {
  let controller: IncidentsController;
  let incidentsService: Partial<IncidentsService>;
  let incidentBuilder: Partial<IncidentBuilderService>;
  let aiService: Partial<AiService>;
  let alertRepo: any;

  beforeEach(async () => {
    incidentsService = {
      updateWithAiResults: jest.fn().mockResolvedValue(true),
    } as any;

    incidentBuilder = {
      createIncidentIfThresholdMet: jest.fn().mockImplementation((service: string) => {
        return Promise.resolve({ id: 'incident-1', alertCount: 3, title: `${service} incident` } as any);
      }),
    } as any;

    aiService = {
      summarizeAlerts: jest.fn().mockResolvedValue({ summary: 'Test summary', service: 'payments', severity: 'critical' }),
      analyzeRootCause: jest.fn().mockResolvedValue({ root_cause: 'DB overload', confidence: 'high', explanation: 'Too many queries' }),
    } as any;

    alertRepo = {
      find: jest.fn().mockResolvedValue([
        { id: 'a1', service: 'payments', title: 'CPU spike', severity: 'critical', description: 'High CPU' },
        { id: 'a2', service: 'payments', title: 'DB error', severity: 'critical', description: 'Connection errors' },
      ]),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [IncidentsController],
      providers: [
        { provide: IncidentsService, useValue: incidentsService },
        { provide: IncidentBuilderService, useValue: incidentBuilder },
        { provide: AiService, useValue: aiService },
        { provide: getRepositoryToken(AlertEntity), useValue: alertRepo },
      ],
    }).compile();

    controller = moduleRef.get(IncidentsController);
  });

  it('creates an incident and updates it with AI results', async () => {
    const res = await controller.groupAlertsByService('payments');

    expect(res.success).toBe(true);
    expect(res.incident).toBeDefined();
    expect(aiService.summarizeAlerts).toHaveBeenCalled();
    expect(aiService.analyzeRootCause).toHaveBeenCalled();
    expect(incidentsService.updateWithAiResults).toHaveBeenCalledWith(
      'incident-1',
      'Test summary',
      'DB overload',
      'high',
    );
  });
});
