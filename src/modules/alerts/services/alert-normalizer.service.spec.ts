import { AlertNormalizerService } from './alert-normalizer.service';

describe('AlertNormalizerService', () => {
  let service: AlertNormalizerService;

  beforeEach(() => {
    service = new AlertNormalizerService();
  });

  it('normalizes payload fields and applies defaults', () => {
    const normalized = service.normalize({
      title: 'Test Alert',
      description: 'Something broke',
      service: 'Payments',
      severity: 'CRITICAL',
      source: 'slack',
      metadata: { channel: 'alerts' },
    });

    expect(normalized).toEqual({
      title: 'Test Alert',
      description: 'Something broke',
      service: 'payments',
      severity: 'critical',
      source: 'slack',
      metadata: { channel: 'alerts' },
    });
  });

  it('falls back to default values for missing fields', () => {
    const normalized = service.normalize({});

    expect(normalized).toEqual({
      title: '',
      description: '',
      service: 'unknown',
      severity: 'medium',
      source: 'slack',
      metadata: {},
    });
  });

  it('normalizes unknown severity to medium', () => {
    const normalized = service.normalize({ severity: 'criticality', source: 'datadog' });

    expect(normalized.severity).toBe('medium');
    expect(normalized.source).toBe('datadog');
  });
});
