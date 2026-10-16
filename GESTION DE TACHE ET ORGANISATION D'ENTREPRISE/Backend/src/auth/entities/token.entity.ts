import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn, JoinColumn, ManyToOne } from 'typeorm';
// import { BaseEntity } from './baseEntity';
import { User } from 'src/users/entities/user.entity';

@Entity('tokens')
export class Token {

  @PrimaryGeneratedColumn()          // ← OBLIGATOIRE
  id?: number;

  @Column()
  @Index()
  userId?: number;

  @Column({ type: 'text' })
  refreshToken?: string;

  @Column({ length: 500 })
  accessToken?: string;

  @CreateDateColumn({ type: 'timestamp', precision: null, default: () => 'CURRENT_TIMESTAMP' })
  cree_le?: Date;

  @Column({
  type: 'datetime',
  default: () => 'CURRENT_TIMESTAMP'
  })
  expire_le?: Date;

  @Column({
    type: 'boolean',
    default: true,
  })
  status?: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;


}