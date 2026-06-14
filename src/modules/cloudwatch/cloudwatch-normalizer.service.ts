import { Injectable } from '@nestjs/common';

const severityValues = ['low', 'medium', 'high', 'critical'] as const;

export interface NormalizedCloudWatchPayload {
  title: string;
  description: string;
  service: string;
  severity: (typeof severityValues)[number];
  source: 'cloudwatch';
  metadata: Record<string, unknown>;
}

@Injectable()
export class CloudWatchNormalizerService {
  normalize(rawPayload: Record<string, unknown>): NormalizedCloudWatchPayload {
    const alarmName = this.pickString(rawPayload, ['AlarmName', 'alarmName', 'alarm_name']);
    const alarmDescription = this.pickString(rawPayload, ['AlarmDescription', 'alarmDescription', 'alarm_description']);
    const newStateReason = this.pickString(rawPayload, ['NewStateReason', 'newStateReason', 'new_state_reason', 'StateChangeReason']);
    const newStateValue = this.pickString(rawPayload, ['NewStateValue', 'newStateValue', 'state']).toUpperCase();

    const namespace = this.pickString(rawPayload, ['Namespace', 'namespace']);
    const dimensions = rawPayload['Dimensions'] ?? rawPayload['dimensions'] ?? {};
    const service = this.extractService(namespace, dimensions, rawPayload);

    const title = alarmName || 'CloudWatch alarm';
    const description = alarmDescription || newStateReason || title;

    return {
      title,
      description,
      service,
      severity: this.mapSeverity(newStateValue, rawPayload),
      source: 'cloudwatch',
      metadata: {
        alarmName,
        alarmArn: rawPayload['AlarmArn'] ?? rawPayload['alarmArn'] ?? null,
        newStateValue,
        newStateReason,
        namespace,
        dimensions,
        region: rawPayload['Region'] ?? rawPayload['region'] ?? null,
        accountId: rawPayload['AWSAccountId'] ?? rawPayload['accountId'] ?? null,
        raw: rawPayload,
      },
    };
  }

  private pickString(payload: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const value = payload[key];
      if (value !== undefined && value !== null && String(value).trim()) {
        return String(value).trim();
      }
    }
    return '';
  }

  private extractService(
    namespace: string,
    dimensions: unknown,
    payload: Record<string, unknown>,
  ): string {
    if (namespace) {
      const parts = namespace.split('/');
      const servicePart = parts[parts.length - 1];
      if (servicePart) {
        return servicePart.toLowerCase().replace(/\s+/g, '-');
      }
    }

    if (dimensions && typeof dimensions === 'object') {
      const dims = dimensions as Record<string, unknown>;
      const serviceValue =
        dims['ServiceName'] ?? dims['service'] ?? dims['FunctionName'] ?? dims['ClusterName'];
      if (serviceValue) {
        return String(serviceValue).toLowerCase();
      }
    }

    const fallback = this.pickString(payload, ['source', 'Source', 'account_id']);
    return fallback.toLowerCase() || 'cloudwatch';
  }

  private mapSeverity(
    state: string,
    payload: Record<string, unknown>,
  ): (typeof severityValues)[number] {
    const priority = String(payload['priority'] ?? payload['Priority'] ?? '').toLowerCase();
    if (priority.includes('critical') || priority.includes('p1')) {
      return 'critical';
    }

    switch (state) {
      case 'ALARM':
        return 'high';
      case 'INSUFFICIENT_DATA':
        return 'medium';
      case 'OK':
        return 'low';
      default:
        return 'medium';
    }
  }
}
