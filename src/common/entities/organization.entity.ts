import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationMemberEntity } from './organization-member.entity';
import { TeamEntity } from './team.entity';

@Entity('organizations')
export class OrganizationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, unknown>;

  @OneToMany(() => OrganizationMemberEntity, (membership) => membership.organization)
  members: OrganizationMemberEntity[];

  @OneToMany(() => TeamEntity, (team) => team.organization)
  teams: TeamEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
