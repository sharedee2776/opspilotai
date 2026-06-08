import { DatadogNormalizerService } from './datadog-normalizer.service';

describe('DatadogNormalizerService', () => {
  let service: DatadogNormalizerService;

  beforeEach(() => {
    service = new DatadogNormalizerService();
  });

  it('normalizes a standard Datadog monitor webhook payload', () => {
    const result = service.normalize({
      title: '[Triggered] High CPU on payments-api',
      body: 'CPU usage exceeded 90% for 5 minutes',
      alert_type: 'error',
      tags: 'env:production,service:payments-api,team:platform',
      monitor_id: 12345,
      link: 'https://app.datadoghq.com/monitors/12345',
    });

    expect(result.source).toBe('datadog');
    expect(result.title).toContain('High CPU');
    expect(result.service).toBe('payments-api');
    expect(result.severity).toBe('high');
    expect(result.metadata.monitorId).toBe(12345);
  });

  it('extracts service from kube_deployment tag when service tag is missing', () => {
    const result = service.normalize({
      alert_title: 'Pod restart loop',
      event_msg: 'Pods are restarting frequently',
      alert_type: 'warning',
      tags: ['env:staging', 'kube_deployment:checkout-api'],
    });

    expect(result.service).toBe('checkout-api');
    expect(result.severity).toBe('medium');
  });

  it('falls back to hostname when no service tag exists', () => {
    const result = service.normalize({
      title: 'Host CPU high',
      text: 'CPU saturation detected',
      alert_type: 'error',
      hostname: 'web-01',
      tags: 'env:prod',
    });

    expect(result.service).toBe('web-01');
  });

  it('maps success alerts to low severity', () => {
    const result = service.normalize({
      title: 'Recovered',
      alert_type: 'success',
      tags: 'service:auth',
    });

    expect(result.severity).toBe('low');
  });
});
