import { Test } from '@nestjs/testing';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { IncidentBuilderService } from './services/incident-builder.service';
import { AiService } from '../ai/ai.service';
import { OrganizationRole } from '../../common/entities/organization-member.entity';

describe('IncidentsController grouping flow', () => {
  let controller: IncidentsController;
  let incidentsService: Partial<IncidentsService>;
  let incidentBuilder: Partial<IncidentBuilderService>;
  let aiService: Partial<AiService>;

  const user = {
    userId: 'user-1',
    email: 'test@example.com',
    organizationId: 'org-1',
    role: OrganizationRole.OWNER,
  };

  beforeEach(async () => {
    incidentsService = {
      updateWithAiResults: jest.fn().mockResolvedValue(true),
      getAlertsForIncident: jest.fn().mockResolvedValue([
        { id: 'a1', service: 'payments', title: 'CPU spike', severity: 'critical', description: 'High CPU' },
        { id: 'a2', service: 'payments', title: 'DB error', severity: 'critical', description: 'Connection errors' },
      ]),
      findById: jest.fn().mockResolvedValue({ id: 'incident-1', alertCount: 3, title: 'payments incident' }),
    } as any;

    incidentBuilder = {
      createIncidentIfThresholdMet: jest.fn().mockImplementation((organizationId: string, service: string) => {
        expect(organizationId).toBe('org-1');
        return Promise.resolve({ id: 'incident-1', alertCount: 3, title: `${service} incident` } as any);
      }),
    } as any;

    aiService = {
      summarizeAlerts: jest.fn().mockResolvedValue({ summary: 'Test summary', service: 'payments', severity: 'critical' }),
      analyzeRootCause: jest.fn().mockResolvedValue({ root_cause: 'DB overload', confidence: 'high', explanation: 'Too many queries' }),
    } as any;

    const moduleRef = await Test.createTestingModule({
      controllers: [IncidentsController],
      providers: [
        { provide: IncidentsService, useValue: incidentsService },
        { provide: IncidentBuilderService, useValue: incidentBuilder },
        { provide: AiService, useValue: aiService },
      ],
    }).compile();

    controller = moduleRef.get(IncidentsController);
  });

  it('creates an incident and updates it with AI results for the active organization', async () => {
    const res = await controller.groupAlertsByService(user, 'payments');

    expect(res.success).toBe(true);
    expect(res.incident).toBeDefined();
    expect(aiService.summarizeAlerts).toHaveBeenCalled();
    expect(aiService.analyzeRootCause).toHaveBeenCalled();
    expect(incidentsService.updateWithAiResults).toHaveBeenCalledWith(
      'incident-1',
      'org-1',
      'Test summary',
      'DB overload',
    );
  });
});
