import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  initializeApp,
  getApps,
  cert,
  App,
  ServiceAccount,
} from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private app: App | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
    if (!projectId) {
      this.logger.warn('FIREBASE_PROJECT_ID not set — Firebase auth endpoints will be disabled');
      return;
    }

    // Reuse existing app if already initialized (e.g. during hot reload)
    const existing = getApps().find((a) => a.name === '[DEFAULT]');
    if (existing) {
      this.app = existing;
      this.initialized = true;
      return;
    }

    const serviceAccountJson = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (serviceAccountJson) {
      try {
        const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;
        this.app = initializeApp({ credential: cert(serviceAccount) });
      } catch {
        this.logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON');
        return;
      }
    } else {
      this.app = initializeApp({ projectId });
    }

    this.initialized = true;
    this.logger.log(`Firebase Admin initialized for project: ${projectId}`);
  }

  private initialized = false;

  get isEnabled() {
    return this.initialized;
  }

  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    if (!this.app) throw new Error('Firebase not initialized');
    return getAuth(this.app).verifyIdToken(idToken);
  }
}
