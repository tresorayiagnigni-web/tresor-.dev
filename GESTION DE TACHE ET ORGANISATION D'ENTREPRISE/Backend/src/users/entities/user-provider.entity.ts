// src/users/entities/user-provider.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_providers')
@Unique(['provider', 'providerId'])
export class UserProvider {
  @PrimaryGeneratedColumn()
    id?: number;

  @Column()
  provider?: string; // 'google' | 'apple'

  @Column()
  providerId?: string;

  @Column()
  @Index()
  userId?: number;

  @ManyToOne(() => User, (user) => user.providers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user?: User;
}