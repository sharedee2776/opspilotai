import { DeduplicationService } from './deduplication.service';

describe('DeduplicationService', () => {
  let service: DeduplicationService;
  let redisSet: jest.Mock;
  let alertRepository: { findOne: jest.Mock };

  const organizationId = 'org-123';

  beforeEach(() => {
    redisSet = jest.fn().mockResolvedValue('OK');
    alertRepository = { findOne: jest.fn().mockResolvedValue(null) };

    service = new DeduplicationService(
      { get: jest.fn().mockReturnValue('5') } as any,
      { getClient: () => ({ set: redisSet }) } as any,
      alertRepository as any,
    );
  });

  it('generates a consistent hash scoped to organization', () => {
    const payload = { service: 'payments', title: 'CPU spike' };
    const hash1 = service.generateDedupHash(payload, organizationId);
    const hash2 = service.generateDedupHash(
      { service: 'Payments', title: 'cpu spike' },
      organizationId,
    );
    const hashOtherOrg = service.generateDedupHash(payload, 'org-999');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hashOtherOrg);
    expect(hash1).toHaveLength(64);
  });

  it('detects duplicates from the database within the dedup window', async () => {
    alertRepository.findOne.mockResolvedValue({ id: 'existing-alert' });

    const duplicate = await service.isDuplicate('abc123', organizationId);

    expect(duplicate).toBe(true);
    expect(alertRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ dedupHash: 'abc123', organizationId }),
      }),
    );
    expect(redisSet).not.toHaveBeenCalled();
  });

  it('detects duplicates from redis when db has no recent match', async () => {
    redisSet.mockResolvedValue(null);

    const duplicate = await service.isDuplicate('abc123', organizationId);

    expect(duplicate).toBe(true);
    expect(redisSet).toHaveBeenCalledWith(`dedup:${organizationId}:abc123`, '1', expect.any(Object));
  });

  it('allows a new alert when neither db nor redis has a match', async () => {
    const duplicate = await service.isDuplicate('abc123', organizationId);

    expect(duplicate).toBe(false);
    expect(redisSet).toHaveBeenCalled();
  });
});
