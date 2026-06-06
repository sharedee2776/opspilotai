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
