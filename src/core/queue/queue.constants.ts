export const QUEUE_ALERTS = 'alerts';
export const QUEUE_INCIDENTS = 'incidents';
export const QUEUE_AI_ANALYSIS = 'ai-analysis';

export const JOB_PROCESS_ALERT = 'process-alert';
export const JOB_GROUP_INCIDENT = 'group-incident';
export const JOB_ANALYZE_INCIDENT = 'analyze-incident';

export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 1000 },
  removeOnComplete: 100,
  removeOnFail: 500,
};
