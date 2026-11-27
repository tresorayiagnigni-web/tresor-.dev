
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';

import { Farm } from '../../farms/entities/farm.entity.js';
import { User } from '../../users/entities/user.entity.js';

export enum BandStatus {
  GROWING = 'GROWING',
  TRANSFERRED = 'TRANSFERRED',
  ARCHIVED = 'ARCHIVED',
}

@Entity('bands')
export class Band {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nom: string;

  @Column({ length: 50 })
  numero_batiment: string;

  @Column({ length: 100 })
  race: string;

  @Column({ type: 'date' })
  date_demarrage: string;

  @Column({ type: 'int' })
  effectif_initial: number;

  @Column({ nullable: true, length: 100 })
  aliment_demarrage: string;

  @Column({
    type: 'enum',
    enum: BandStatus,
    default: BandStatus.GROWING,
  })
  status: BandStatus;

  // Exploitation à laquelle appartient la bande
  @ManyToOne(() => Farm, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'farmId' })
  farm: Farm;

  // Employés affectés à cette bande
  @ManyToMany(() => User)
  @JoinTable({
    name: 'band_employees',
    joinColumn: {
      name: 'bandId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
  })
  employees: User[];

  @CreateDateColumn()
  cree_le: Date;

  @UpdateDateColumn()
  modifier_le: Date;
}
