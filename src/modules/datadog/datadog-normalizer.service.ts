import { Injectable } from '@nestjs/common';

const severityValues = ['low', 'medium', 'high', 'critical'] as const;

export interface NormalizedAlertPayload {
  title: string;
  description: string;
  service: string;
  severity: (typeof severityValues)[number];
  source: 'datadog';
  metadata: Record<string, unknown>;
}

@Injectable()
export class DatadogNormalizerService {
  normalize(rawPayload: Record<string, unknown>): NormalizedAlertPayload {
    const title = this.pickString(rawPayload, [
      'title',
      'alert_title',
      'alertTitle',
      'incident_title',
      'security_signal_title',
    ]);
    const description = this.pickString(rawPayload, [
      'body',
      'event_msg',
      'eventMessage',
      'text',
      'message',
      'incident_msg',
      'security_signal_msg',
    ]);
    const alertType = this.pickString(rawPayload, ['alert_type', 'type', 'alertType']).toLowerCase();
    const tags = this.parseTags(rawPayload.tags);
    const service =
      this.extractTagValue(tags, 'service') ||
      this.extractTagValue(tags, 'kube_deployment') ||
      this.extractTagValue(tags, 'service_name') ||
      this.pickString(rawPayload, ['hostname', 'host', 'alert_scope']).toLowerCase() ||
      'unknown';

    return {
      title: title || 'Datadog alert',
      description: description || title || 'Datadog monitor notification',
      service,
      severity: this.mapSeverity(alertType, rawPayload),
      source: 'datadog',
      metadata: {
        alertType,
        monitorId: rawPayload.monitor_id ?? rawPayload.monitorId ?? null,
        alertId: rawPayload.alert_id ?? rawPayload.alertId ?? rawPayload.event_id ?? null,
        tags,
        link: rawPayload.link ?? rawPayload.url ?? null,
        hostname: rawPayload.hostname ?? null,
        eventType: rawPayload.event_type ?? rawPayload.eventType ?? null,
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

  private parseTags(tags: unknown): string[] {
    if (Array.isArray(tags)) {
      return tags.map((tag) => String(tag).trim()).filter(Boolean);
    }
    if (typeof tags === 'string') {
      return tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
    return [];
  }

  private extractTagValue(tags: string[], key: string): string | null {
    const prefix = `${key}:`;
    const match = tags.find((tag) => tag.toLowerCase().startsWith(prefix));
    if (!match) {
      return null;
    }
    return match.slice(prefix.length).trim().toLowerCase() || null;
  }

  private mapSeverity(
    alertType: string,
    payload: Record<string, unknown>,
  ): (typeof severityValues)[number] {
    const priority = String(payload.priority ?? payload.alert_priority ?? '').toLowerCase();
    if (priority.includes('critical') || priority.includes('p1')) {
      return 'critical';
    }

    switch (alertType) {
      case 'error':
        return 'high';
      case 'warning':
        return 'medium';
      case 'success':
      case 'info':
        return 'low';
      default:
        return 'medium';
    }
  }
}
