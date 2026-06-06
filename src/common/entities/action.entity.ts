import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { IncidentEntity } from './incident.entity';

export enum ActionStatus {
  SUGGESTED = 'suggested',
  APPROVED = 'approved',
  EXECUTING = 'executing',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('actions')
export class ActionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  type: string;

  @Column({ type: 'text', nullable: true })
  command: string;

  @Column({
    type: 'enum',
    enum: ActionStatus,
    default: ActionStatus.SUGGESTED,
  })
  status: ActionStatus;

  @Column({ nullable: true })
  riskLevel: string;

  @ManyToOne(() => IncidentEntity, (incident) => incident.actions, {
    onDelete: 'CASCADE',
  })
  incident: IncidentEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
