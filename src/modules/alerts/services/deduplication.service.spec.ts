import { DeduplicationService } from './deduplication.service';

describe('DeduplicationService', () => {
  let service: DeduplicationService;
  let redisSet: jest.Mock;
  let alertRepository: { findOne: jest.Mock };

  beforeEach(() => {
    redisSet = jest.fn().mockResolvedValue('OK');
    alertRepository = { findOne: jest.fn().mockResolvedValue(null) };

    service = new DeduplicationService(
      { get: jest.fn().mockReturnValue('5') } as any,
      { getClient: () => ({ set: redisSet }) } as any,
      alertRepository as any,
    );
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

  it('detects duplicates from the database within the dedup window', async () => {
    alertRepository.findOne.mockResolvedValue({ id: 'existing-alert' });

    const duplicate = await service.isDuplicate('abc123');

    expect(duplicate).toBe(true);
    expect(redisSet).not.toHaveBeenCalled();
  });

  it('detects duplicates from redis when db has no recent match', async () => {
    redisSet.mockResolvedValue(null);

    const duplicate = await service.isDuplicate('abc123');

    expect(duplicate).toBe(true);
    expect(redisSet).toHaveBeenCalledWith('dedup:abc123', '1', expect.objectContaining({ NX: true }));
  });

  it('allows a new alert when neither db nor redis has a match', async () => {
    const duplicate = await service.isDuplicate('abc123');

    expect(duplicate).toBe(false);
    expect(redisSet).toHaveBeenCalled();
  });
});
