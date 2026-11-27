import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';

import { User } from '../../users/entities/user.entity.js';
import { Band } from '../../bands/entities/band.entity.js';
import { PhysicalInventoryItem } from './physical-inventory-item.entity.js';

export enum PhysicalInventoryStatus {
  BROUILLON = 'BROUILLON',
  TERMINE = 'TERMINE',
}

@Entity('physical_inventories')
@Index('IDX_physical_inventories_date', ['date_inventaire'])
@Index('IDX_physical_inventories_bandId', ['band'])
export class PhysicalInventory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date_inventaire: string;

  @Column({
    type: 'enum',
    enum: PhysicalInventoryStatus,
    default: PhysicalInventoryStatus.BROUILLON,
  })
  statut: PhysicalInventoryStatus;

  @Column({ type: 'text', nullable: true })
  observations: string | null;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  // Bande concernée par cet inventaire.
  // Nullable pour conserver les anciens inventaires.
  @ManyToOne(() => Band, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'bandId' })
  band: Band | null;

  @OneToMany(() => PhysicalInventoryItem, (item) => item.inventory, {
    cascade: false,
  })
  items: PhysicalInventoryItem[];

  @CreateDateColumn()
  cree_le: Date;
}
