
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('farms')
export class Farm {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nom: string;

  @Column({ nullable: true, length: 255 })
  localisation: string;

  @Column({ nullable: true, length: 100 })
  responsable: string;

  @Column({ nullable: true, length: 30 })
  telephone: string;

  @Column({ default: true })
  status: boolean;

  @CreateDateColumn()
  cree_le: Date;

  @UpdateDateColumn()
  modifier_le: Date;
}
