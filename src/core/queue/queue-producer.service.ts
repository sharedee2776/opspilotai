import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { RedisService } from '../redis/redis.service';
import {
  DEFAULT_JOB_OPTIONS,
  JOB_ANALYZE_INCIDENT,
  JOB_GROUP_INCIDENT,
  JOB_PROCESS_ALERT,
  QUEUE_AI_ANALYSIS,
  QUEUE_ALERTS,
  QUEUE_INCIDENTS,
} from './queue.constants';
import {
  AnalyzeIncidentJobPayload,
  GroupIncidentJobPayload,
  ProcessAlertJobPayload,
} from './queue.types';

@Injectable()
export class QueueProducerService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueProducerService.name);
  private readonly alertQueue: Queue;
  private readonly incidentQueue: Queue;
  private readonly aiAnalysisQueue: Queue;

  constructor(
    private readonly redisService: RedisService,
    private readonly config: ConfigService,
  ) {
    const connection = this.redisService.getBullMqConnection();

    this.alertQueue = new Queue(QUEUE_ALERTS, { connection });
    this.incidentQueue = new Queue(QUEUE_INCIDENTS, { connection });
    this.aiAnalysisQueue = new Queue(QUEUE_AI_ANALYSIS, { connection });
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([
      this.alertQueue.close(),
      this.incidentQueue.close(),
      this.aiAnalysisQueue.close(),
    ]);
  }

  async enqueueAlert(payload: ProcessAlertJobPayload) {
    const job = await this.alertQueue.add(JOB_PROCESS_ALERT, payload, DEFAULT_JOB_OPTIONS);
    this.logger.log(`Enqueued alert job ${job.id} for service ${String(payload.rawPayload.service ?? 'unknown')}`);
    return job;
  }

  async enqueueGroupIncident(payload: GroupIncidentJobPayload) {
    const minAlerts = payload.minAlerts ?? Number(this.config.get<string>('MIN_ALERTS_TO_GROUP', '2'));
    const job = await this.incidentQueue.add(
      JOB_GROUP_INCIDENT,
      { ...payload, minAlerts },
      DEFAULT_JOB_OPTIONS,
    );
    this.logger.log(`Enqueued group-incident job ${job.id} for service ${payload.service}`);
    return job;
  }

  async enqueueAnalyzeIncident(payload: AnalyzeIncidentJobPayload) {
    const job = await this.aiAnalysisQueue.add(JOB_ANALYZE_INCIDENT, payload, DEFAULT_JOB_OPTIONS);
    this.logger.log(`Enqueued ai-analysis job ${job.id} for incident ${payload.incidentId}`);
    return job;
  }
}
