import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseMigrationService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseMigrationService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.config.get<string>('RUN_MIGRATIONS') === 'false') {
      this.logger.log('Database migrations skipped (RUN_MIGRATIONS=false)');
      return;
    }

    const migrationsDir = join(process.cwd(), 'database', 'migrations');
    let files: string[];

    try {
      files = (await readdir(migrationsDir))
        .filter((file) => file.endsWith('.sql'))
        .sort();
    } catch {
      this.logger.warn(`Migration directory not found at ${migrationsDir}; skipping`);
      return;
    }

    if (!files.length) {
      return;
    }

    await this.ensureTrackingTable();
    const applied = await this.getAppliedMigrations();

    const pending = files.filter((f) => !applied.has(f));
    if (!pending.length) {
      this.logger.log('All migrations already applied');
      return;
    }

    this.logger.log(`Running ${pending.length} pending migration(s)`);

    for (const file of pending) {
      const sql = await readFile(join(migrationsDir, file), 'utf8');
      await this.dataSource.query(sql);
      await this.recordMigration(file);
      this.logger.log(`Applied migration: ${file}`);
    }
  }

  private async ensureTrackingTable(): Promise<void> {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  private async getAppliedMigrations(): Promise<Set<string>> {
    const rows: { filename: string }[] = await this.dataSource.query(
      'SELECT filename FROM schema_migrations',
    );
    return new Set(rows.map((r) => r.filename));
  }

  private async recordMigration(filename: string): Promise<void> {
    await this.dataSource.query(
      'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING',
      [filename],
    );
  }
}
