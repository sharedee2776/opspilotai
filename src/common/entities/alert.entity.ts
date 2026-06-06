import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { IncidentEntity } from './incident.entity';
import { OrganizationEntity } from './organization.entity';

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  PENDING = 'pending',
  GROUPED = 'grouped',
  RESOLVED = 'resolved',
}

export enum AlertSource {
  SLACK = 'slack',
  DATADOG = 'datadog',
  CLOUDWATCH = 'cloudwatch',
}

@Entity('alerts')
@Index(['organizationId', 'dedupHash', 'createdAt'])
@Index(['organizationId', 'service', 'status'])
export class AlertEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid', nullable: true })
  integrationId?: string | null;

  @Column({ nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: false })
  service: string;

  @Column({
    type: 'enum',
    enum: AlertSeverity,
    default: AlertSeverity.MEDIUM,
  })
  severity: AlertSeverity;

  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.PENDING,
  })
  status: AlertStatus;

  @Column({
    type: 'enum',
    enum: AlertSource,
    default: AlertSource.SLACK,
  })
  source: AlertSource;

  @Column({ nullable: true })
  dedupHash: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  organization: OrganizationEntity;

  @ManyToOne(() => IncidentEntity, (incident) => incident.alerts, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  incident?: IncidentEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
