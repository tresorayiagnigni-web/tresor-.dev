import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import type { Relation } from 'typeorm';

import { PhysicalInventory } from './physical-inventory.entity.js';

export enum PhysicalInventoryItemType {
  ALIMENT = 'ALIMENT',
  OEUF = 'OEUF',
  MATERIEL = 'MATERIEL',
}

export enum EquipmentCondition {
  BON_ETAT = 'BON_ETAT',
  ENDOMMAGE = 'ENDOMMAGE',
  HORS_SERVICE = 'HORS_SERVICE',
}

@Entity('physical_inventory_items')
@Index('IDX_physical_inventory_items_type', ['type'])
export class PhysicalInventoryItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: PhysicalInventoryItemType,
  })
  type: PhysicalInventoryItemType;

  @Column({ type: 'varchar', length: 150 })
  designation: string;

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
  quantite_theorique: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => Number(value),
    },
  })
  quantite_physique: number;

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
  ecart: number;

  @Column({
    type: 'enum',
    enum: EquipmentCondition,
    nullable: true,
  })
  etat_materiel: EquipmentCondition | null;

  @Column({ type: 'varchar', length: 30 })
  unite: string;

  @Column({ type: 'text', nullable: true })
  observations: string | null;

  @ManyToOne(() => PhysicalInventory, (inventory) => inventory.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'inventoryId' })
  inventory: Relation<PhysicalInventory>;
}
