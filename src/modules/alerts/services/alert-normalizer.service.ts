import { Injectable } from '@nestjs/common';

const severityValues = ['low', 'medium', 'high', 'critical'] as const;
const sourceValues = ['slack', 'datadog', 'cloudwatch'] as const;

@Injectable()
export class AlertNormalizerService {
  normalize(rawPayload: any) {
    const severity = String(rawPayload.severity || rawPayload.level || 'medium')
      .trim()
      .toLowerCase();
    const source = String(rawPayload.source || 'slack').trim().toLowerCase();

    return {
      title: String(rawPayload.title || rawPayload.summary || rawPayload.message || '').trim(),
      description: String(
        rawPayload.description || rawPayload.body || rawPayload.details || '',
      ).trim(),
      service: String(rawPayload.service || rawPayload.sourceService || 'unknown').trim().toLowerCase(),
      severity: severityValues.includes(severity as any) ? severity : 'medium',
      source: sourceValues.includes(source as any) ? source : 'slack',
      metadata: rawPayload.metadata || rawPayload.context || {},
    };
  }
}
