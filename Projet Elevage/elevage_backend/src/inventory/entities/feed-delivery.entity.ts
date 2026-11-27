import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity.js';
import { Farm } from '../../farms/entities/farm.entity.js';

@Entity('feed_deliveries')
export class FeedDeliveryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  code_aliment: string;

  @Column({ type: 'date' })
  date_reception: string;

  // Quantité reçue en tonnes
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 3,
  })
  quantite_tonnes: number;

  // Conversion : 1 tonne = 20 sacs
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => Number(value),
    },
  })
  nombre_sacs: number;

  @Column({ type: 'varchar', length: 150, nullable: true })
  fournisseur: string | null;

  @Column({ type: 'text', nullable: true })
  observations: string | null;

  // Ferme concernée par l'approvisionnement.
  // Nullable pour préserver les anciennes livraisons.
  @ManyToOne(() => Farm, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'farmId' })
  farm: Farm | null;

  // Utilisateur ayant enregistré la livraison
  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @CreateDateColumn()
  cree_le: Date;
}
