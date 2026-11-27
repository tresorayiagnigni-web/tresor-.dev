import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { User } from '../../users/entities/user.entity.js';
import { FarmEquipmentStock } from './farm-equipment-stock.entity.js';

export enum EquipmentStockMovementType {
  APPROVISIONNEMENT = 'APPROVISIONNEMENT',
  REPARTITION = 'REPARTITION',
}

const decimalTransformer = {
  to: (value: number) => value,
  from: (value: string | number) => Number(value),
};

@Entity('equipment_stock_movements')
@Index('IDX_equipment_stock_movements_date', ['cree_le'])
export class EquipmentStockMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => FarmEquipmentStock, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'stockId' })
  stock: FarmEquipmentStock;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({
    type: 'varchar',
    length: 30,
  })
  type: EquipmentStockMovementType;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  quantite_totale_avant: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  quantite_totale_apres: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  bon_etat_avant: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  bon_etat_apres: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  endommage_avant: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  endommage_apres: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  hors_service_avant: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  hors_service_apres: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  observations: string | null;

  @CreateDateColumn()
  cree_le: Date;
}
