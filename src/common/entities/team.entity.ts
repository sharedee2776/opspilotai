import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { TeamMemberEntity } from './team-member.entity';

@Entity('teams')
export class TeamEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column()
  name: string;

  @ManyToOne(() => OrganizationEntity, (organization) => organization.teams, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;

  @OneToMany(() => TeamMemberEntity, (membership) => membership.team)
  members: TeamMemberEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
