import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import type { Relation } from 'typeorm';

import { Band } from '../../bands/entities/band.entity.js';
import { InventoryEquipment } from './inventory-equipment.entity.js';

@Entity('band_equipment')
@Index('UQ_band_equipment_band_equipment', ['band', 'equipment'], {
  unique: true,
})
export class BandEquipment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Band, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bandId' })
  band: Relation<Band>;

  @ManyToOne(() => InventoryEquipment, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'equipmentId' })
  equipment: Relation<InventoryEquipment>;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => Number(value),
    },
  })
  quantite_reference: number;

  @CreateDateColumn()
  cree_le: Date;

  @UpdateDateColumn()
  modifier_le: Date;
}