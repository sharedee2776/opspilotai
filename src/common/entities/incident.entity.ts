import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AlertEntity } from './alert.entity';
import { ActionEntity } from './action.entity';
import { OrganizationEntity } from './organization.entity';

export enum IncidentStatus {
  ACTIVE = 'active',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
}

@Entity('incidents')
@Index(['organizationId', 'service', 'status'])
export class IncidentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'text', nullable: true })
  rootCause: string;

  @Column({
    type: 'enum',
    enum: IncidentStatus,
    default: IncidentStatus.ACTIVE,
  })
  status: IncidentStatus;

  @Column({ nullable: true })
  service: string;

  @Column({ type: 'int', default: 0 })
  alertCount: number;

  @Column({ type: 'jsonb', default: [] })
  suggestedFixes: string[];

  @Column({ nullable: true })
  slackChannelId: string;

  @Column({ nullable: true })
  slackMessageTs: string;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  organization: OrganizationEntity;

  @OneToMany(() => AlertEntity, (alert) => alert.incident)
  alerts: AlertEntity[];

  @OneToMany(() => ActionEntity, (action) => action.incident)
  actions: ActionEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
