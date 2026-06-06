import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AlertEntity } from './alert.entity';
import { ActionEntity } from './action.entity';

export enum IncidentStatus {
  ACTIVE = 'active',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
}

@Entity('incidents')
export class IncidentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @OneToMany(() => AlertEntity, (alert) => alert.incident)
  alerts: AlertEntity[];

  @OneToMany(() => ActionEntity, (action) => action.incident)
  actions: ActionEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
