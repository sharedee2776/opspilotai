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

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true, type: 'text' })
  verificationToken: string | null;

  @Column({ nullable: true, type: 'timestamptz' })
  verificationExpires: Date | null;

  @Column({ nullable: true, type: 'text' })
  resetToken: string | null;

  @Column({ nullable: true, type: 'timestamptz' })
  resetExpires: Date | null;

  @OneToMany(() => OrganizationMemberEntity, (membership) => membership.user)
  organizationMemberships: OrganizationMemberEntity[];

  @OneToMany(() => TeamMemberEntity, (membership) => membership.user)
  teamMemberships: TeamMemberEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
