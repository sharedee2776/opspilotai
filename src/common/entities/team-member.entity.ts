import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { TeamEntity } from './team.entity';
import { UserEntity } from './user.entity';

export enum TeamRole {
  LEAD = 'lead',
  MEMBER = 'member',
}

@Entity('team_members')
@Unique(['teamId', 'userId'])
export class TeamMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  teamId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: TeamRole, default: TeamRole.MEMBER })
  role: TeamRole;

  @ManyToOne(() => TeamEntity, (team) => team.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamId' })
  team: TeamEntity;

  @ManyToOne(() => UserEntity, (user) => user.teamMemberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
