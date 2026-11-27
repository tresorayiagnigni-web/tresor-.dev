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

import { Farm } from '../../farms/entities/farm.entity.js';
import { InventoryEquipment } from './inventory-equipment.entity.js';

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string | number) => Number(value),
};

@Entity('farm_equipment_stock')
@Index('UQ_farm_equipment_stock_farm_equipment', ['farm', 'equipment'], {
  unique: true,
})
export class FarmEquipmentStock {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Farm, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'farmId' })
  farm: Farm;

  @ManyToOne(() => InventoryEquipment, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'equipmentId' })
  equipment: InventoryEquipment;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  quantite_totale: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  bon_etat: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  endommage: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  hors_service: number;

  @CreateDateColumn()
  cree_le: Date;

  @UpdateDateColumn()
  modifier_le: Date;
}
