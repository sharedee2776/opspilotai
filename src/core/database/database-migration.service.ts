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
    } catch (error) {
      this.logger.warn(`Migration directory not found at ${migrationsDir}; skipping`);
      return;
    }

    if (!files.length) {
      return;
    }

    this.logger.log(`Running ${files.length} database migration file(s)`);

    for (const file of files) {
      const sql = await readFile(join(migrationsDir, file), 'utf8');
      await this.dataSource.query(sql);
      this.logger.log(`Applied migration ${file}`);
    }
  }
}
