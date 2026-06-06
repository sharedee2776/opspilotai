import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

@Injectable()
export class DeduplicationService {
  generateDedupHash(payload: Record<string, any>): string {
    const normalized = `${String(payload.service || '').trim().toLowerCase()}:${String(
      payload.title || '',
    )
      .trim()
      .toLowerCase()}`;

    return createHash('sha256').update(normalized).digest('hex');
  }
}
