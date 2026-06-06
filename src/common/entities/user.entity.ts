import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationMemberEntity } from './organization-member.entity';
import { TeamMemberEntity } from './team-member.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  passwordHash: string;

  @OneToMany(() => OrganizationMemberEntity, (membership) => membership.user)
  organizationMemberships: OrganizationMemberEntity[];

  @OneToMany(() => TeamMemberEntity, (membership) => membership.user)
  teamMemberships: TeamMemberEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
