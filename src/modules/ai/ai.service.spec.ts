import { AiService } from './ai.service';
import { ConfigService } from '@nestjs/config';

const mockConfig = {
  get: jest.fn((key: string, defaultValue?: string) => {
    if (key === 'OPENAI_API_KEY') return 'test-key';
    if (key === 'OPENAI_MODEL') return 'gpt-4';
    if (key === 'OPENAI_TEMPERATURE') return '0.7';
    return defaultValue;
  }),
} as unknown as ConfigService;

describe('AiService', () => {
  let service: AiService;
  let mockClient: any;

  beforeEach(() => {
    service = new AiService(mockConfig);
    mockClient = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };
    (service as any).client = mockClient;
  });

  it('parses valid summary JSON', async () => {
    mockClient.chat.completions.create.mockResolvedValue({
      choices: [{ message: { content: '{"summary":"Alert summary","service":"payments","severity":"critical"}' } }],
    });

    const result = await service.summarizeAlerts([
      { service: 'payments', title: 'CPU spike', severity: 'critical', description: 'High CPU usage' },
    ] as any);

    expect(result).toEqual({
      summary: 'Alert summary',
      service: 'payments',
      severity: 'critical',
    });
  });

  it('falls back on invalid summary JSON', async () => {
    mockClient.chat.completions.create.mockResolvedValue({
      choices: [{ message: { content: 'Invalid response' } }],
    });

    const result = await service.summarizeAlerts([
      { service: 'payments', title: 'CPU spike', severity: 'critical', description: 'High CPU usage' },
    ] as any);

    expect(result).toEqual({
      summary: 'Invalid response',
      service: 'unknown',
      severity: 'medium',
    });
  });

  it('parses valid root cause JSON', async () => {
    mockClient.chat.completions.create.mockResolvedValue({
      choices: [{ message: { content: '{"root_cause":"Database overload","confidence":"high","explanation":"Too many queries"}' } }],
    });

    const result = await service.analyzeRootCause([
      { service: 'payments', title: 'CPU spike', severity: 'critical', description: 'High CPU usage' },
    ] as any);

    expect(result).toEqual({
      root_cause: 'Database overload',
      confidence: 'high',
      explanation: 'Too many queries',
    });
  });

  it('falls back on invalid root cause JSON', async () => {
    mockClient.chat.completions.create.mockResolvedValue({
      choices: [{ message: { content: 'Unknown root cause' } }],
    });

    const result = await service.analyzeRootCause([
      { service: 'payments', title: 'CPU spike', severity: 'critical', description: 'High CPU usage' },
    ] as any);

    expect(result).toEqual({
      root_cause: 'Unknown root cause',
      confidence: 'low',
      explanation: 'Unknown root cause',
    });
  });
});
