import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AlertEntity } from '../../common/entities/alert.entity';

export interface SummaryResult {
  summary: string;
  service: string;
  severity: string;
}

export interface RootCauseResult {
  root_cause: string;
  confidence: string;
  explanation: string;
}

export interface SuggestedFix {
  name: string;
  type: string;
  command: string;
  riskLevel: 'low' | 'medium' | 'high';
}

@Injectable()
export class AiService {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly temperature: number;

  constructor(private readonly config: ConfigService) {
    this.client = new OpenAI({ apiKey: this.config.get<string>('OPENAI_API_KEY') });
    this.model = this.config.get<string>('OPENAI_MODEL', 'gpt-4');
    this.temperature = Number(this.config.get<string>('OPENAI_TEMPERATURE', '0.7'));
    console.log(`[AI] Initialized with model: ${this.model}, temperature: ${this.temperature}`);
  }

  async summarizeAlerts(alerts: AlertEntity[]): Promise<SummaryResult> {
    const alertLines = alerts
      .slice(0, 10)
      .map((alert) => `- [${alert.service}] ${alert.title} (${alert.severity})\n  ${alert.description}`)
      .join('\n');

    const prompt = `You are a senior DevOps engineer. Given these alerts, summarize what is happening, which service is affected, and the severity. Respond in valid JSON only.\n\nAlerts:\n${alertLines}\n\nJSON keys: summary, service, severity.`;

    console.log(`[AI] Summarizing alerts with model: ${this.model}`);
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a helpful incident summarization assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: this.temperature,
        max_tokens: 250,
      });

      const raw = response.choices?.[0]?.message?.content ?? '{}';
      console.log(`[AI] Summary response: ${raw}`);
      return this.parseSummary(raw);
    } catch (error) {
      console.error(`[AI] Summarization error:`, error instanceof Error ? error.message : error);
      throw error;
    }
  }

  async analyzeRootCause(alerts: AlertEntity[]): Promise<RootCauseResult> {
    const alertLines = alerts
      .slice(0, 10)
      .map((alert) => `- [${alert.service}] ${alert.title} (${alert.severity})\n  ${alert.description}`)
      .join('\n');

    const prompt = `You are a DevOps expert. Based on these alerts, determine the most likely root cause and describe the highest confidence reason. Respond in valid JSON only.\n\nAlerts:\n${alertLines}\n\nJSON keys: root_cause, confidence, explanation.`;

    console.log(`[AI] Analyzing root cause with model: ${this.model}`);
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a helpful root cause analysis assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: this.temperature,
        max_tokens: 300,
      });

      const raw = response.choices?.[0]?.message?.content ?? '{}';
      console.log(`[AI] Root cause response: ${raw}`);
      return this.parseRootCause(raw);
    } catch (error) {
      console.error(`[AI] Root cause analysis error:`, error instanceof Error ? error.message : error);
      throw error;
    }
  }

  async suggestFixes(alerts: AlertEntity[], rootCause: string): Promise<SuggestedFix[]> {
    const alertLines = alerts
      .slice(0, 10)
      .map((a) => `- [${a.service}] ${a.title} (${a.severity})`)
      .join('\n');

    const prompt = `You are a senior DevOps engineer. Given these alerts and root cause, suggest up to 3 concrete remediation actions. Each action must include a shell command or kubectl/systemctl command that could fix the issue. Respond in valid JSON only.\n\nAlerts:\n${alertLines}\n\nRoot cause: ${rootCause}\n\nRespond with a JSON array of objects. Each object must have these exact keys: name (short label), type (e.g. restart_service, scale_up, rollback, clear_cache, exec), command (the exact shell command to run), riskLevel (low, medium, or high).`;

    console.log(`[AI] Suggesting fixes with model: ${this.model}`);
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a helpful DevOps remediation assistant. Always respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: this.temperature,
        max_tokens: 500,
      });

      const raw = response.choices?.[0]?.message?.content ?? '[]';
      console.log(`[AI] Suggested fixes response: ${raw}`);
      return this.parseSuggestedFixes(raw);
    } catch (error) {
      console.error(`[AI] Suggest fixes error:`, error instanceof Error ? error.message : error);
      return [];
    }
  }

  private parseSuggestedFixes(raw: string): SuggestedFix[] {
    try {
      const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .filter((item) => item && typeof item === 'object')
        .slice(0, 3)
        .map((item) => ({
          name: String(item.name || 'Unnamed fix'),
          type: String(item.type || 'exec'),
          command: String(item.command || ''),
          riskLevel: (['low', 'medium', 'high'] as const).includes(item.riskLevel)
            ? (item.riskLevel as 'low' | 'medium' | 'high')
            : 'medium',
        }))
        .filter((fix) => fix.command.length > 0);
    } catch {
      return [];
    }
  }

  private parseSummary(raw: string): SummaryResult {
    try {
      const parsed = JSON.parse(raw.trim());
      return {
        summary: String(parsed.summary || 'No summary available'),
        service: String(parsed.service || 'unknown'),
        severity: String(parsed.severity || 'medium'),
      };
    } catch {
      return {
        summary: raw.trim(),
        service: 'unknown',
        severity: 'medium',
      };
    }
  }

  private parseRootCause(raw: string): RootCauseResult {
    try {
      const parsed = JSON.parse(raw.trim());
      return {
        root_cause: String(parsed.root_cause || 'Unknown root cause'),
        confidence: String(parsed.confidence || 'low'),
        explanation: String(parsed.explanation || 'No explanation available'),
      };
    } catch {
      return {
        root_cause: raw.trim(),
        confidence: 'low',
        explanation: raw.trim(),
      };
    }
  }
}
