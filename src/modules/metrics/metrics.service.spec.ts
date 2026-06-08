import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService({} as any, {} as any, {} as any);
  });

  describe('buildPipelineMetrics', () => {
    it('computes duplicate rate and noise reduction from pipeline counters', () => {
      const result = service.buildPipelineMetrics({
        alertsReceived: 100,
        duplicatesSkipped: 40,
        alertsStored: 60,
        incidentsCreated: 2,
      });

      expect(result.duplicateRatePercent).toBe(40);
      expect(result.noiseReductionPercent).toBe(98);
      expect(result.alertsPerIncident).toBe(30);
    });

    it('returns zero rates when no alerts have been received', () => {
      const result = service.buildPipelineMetrics({
        alertsReceived: 0,
        duplicatesSkipped: 0,
        alertsStored: 0,
        incidentsCreated: 0,
      });

      expect(result.duplicateRatePercent).toBe(0);
      expect(result.noiseReductionPercent).toBe(0);
      expect(result.alertsPerIncident).toBeNull();
    });
  });

  describe('noiseReductionPercent', () => {
    it('never returns negative values when incidents exceed alerts received', () => {
      expect(service.noiseReductionPercent(2, 5)).toBe(0);
    });
  });
});
