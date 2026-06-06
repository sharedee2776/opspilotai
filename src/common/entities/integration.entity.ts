import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationEntity } from './organization.entity';

export enum IntegrationType {
  SLACK = 'slack',
  DATADOG = 'datadog',
  CLOUDWATCH = 'cloudwatch',
}

@Entity('integrations')
@Unique(['type', 'externalId'])
@Index(['organizationId', 'type'])
export class IntegrationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'enum', enum: IntegrationType })
  type: IntegrationType;

  @Column()
  externalId: string;

  @Column({ type: 'jsonb', default: {} })
  credentials: Record<string, unknown>;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
