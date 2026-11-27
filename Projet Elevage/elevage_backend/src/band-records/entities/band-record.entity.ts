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

import { Band } from '../../bands/entities/band.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('band_records')
@Index('IDX_band_records_band_date', ['band', 'date_releve'], {
  unique: true,
})
export class BandRecord {
  @PrimaryGeneratedColumn()
  id: number;

  // Date du relevé
  @Column({ type: 'date' })
  date_releve: string;

  // Mortalité et sorties
  @Column({ type: 'int', default: 0 })
  mortalite_jour: number;

  @Column({ type: 'int', default: 0 })
  autres_sorties: number;

  // Production quotidienne d'alvéoles
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | number | null) =>
        value === null ? null : Number(value),
    },
  })
  alveoles_collectees: number | null;

  // Pesée facultative
  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
  })
  poids_moyen_g: number | null;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
  })
  poids_standard_g: number | null;

  @Column({ type: 'int', nullable: true })
  taille_echantillon: number | null;

  // Température
  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  temperature_min_c: number | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  temperature_max_c: number | null;

  // Alimentation
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  code_aliment: string | null;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
  })
  ration_g_par_sujet_jour: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  quantite_aliment_kg: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | number | null) =>
        value === null ? null : Number(value),
    },
  })
  nombre_sacs: number | null;

  @Column({ type: 'int', nullable: true })
  nombre_repas: number | null;

  // Eau
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  eau_litres: number | null;

  // Santé et observations
  @Column({ type: 'text', nullable: true })
  vaccination: string | null;

  @Column({ type: 'text', nullable: true })
  traitement: string | null;

  @Column({ type: 'text', nullable: true })
  observations_sante: string | null;

  @Column({ type: 'text', nullable: true })
  ventilation: string | null;

  @Column({ type: 'text', nullable: true })
  observations: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  photoUrl: string | null;

  // Bande concernée
  @ManyToOne(() => Band, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bandId' })
  band: Band;

  // Auteur du relevé
  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @CreateDateColumn()
  cree_le: Date;

  @UpdateDateColumn()
  modifier_le: Date;
}
