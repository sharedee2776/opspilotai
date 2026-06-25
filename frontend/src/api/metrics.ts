import api from './client';
import type { MetricsSummary } from '../types';

export const metricsApi = {
  summary: () => api.get<MetricsSummary>('/metrics/summary').then((r) => r.data),
};
