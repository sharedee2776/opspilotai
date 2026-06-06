import { DeduplicationService } from './deduplication.service';

describe('DeduplicationService', () => {
  let service: DeduplicationService;

  beforeEach(() => {
    service = new DeduplicationService();
  });

  it('generates a consistent hash for an alert payload', () => {
    const payload = { service: 'payments', title: 'CPU spike' };
    const hash1 = service.generateDedupHash(payload);
    const hash2 = service.generateDedupHash({ service: 'Payments', title: 'cpu spike' });

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('returns different hashes for different services or titles', () => {
    const hashA = service.generateDedupHash({ service: 'payments', title: 'CPU spike' });
    const hashB = service.generateDedupHash({ service: 'payments', title: 'Memory leak' });
    const hashC = service.generateDedupHash({ service: 'auth', title: 'CPU spike' });

    expect(hashA).not.toBe(hashB);
    expect(hashA).not.toBe(hashC);
  });
});
