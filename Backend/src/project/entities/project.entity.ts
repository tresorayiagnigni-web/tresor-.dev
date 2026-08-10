import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Departments } from '../../departement/entities/departement.entity'; // adapte le chemin

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  name?: string;

  @Column({ nullable: true })
  description?: string;

  // Le projet est assigné à un Département (pas à un employé)
  // @ManyToOne(() => Departments, { eager: true })
  // department?: Departments;

  @ManyToOne(() => User, { onDelete: 'CASCADE' }) // ou 'SET NULL'
  @JoinColumn({ name: 'createdById' })
  createdBy?: User;
  
  // Qui a créé le projet (ADMIN)
  // @ManyToOne(() => User, { eager: true })
  // createdBy?: User;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @ManyToOne(
    () => Departments,
    (departement) => departement.projets,
    {
      nullable: false,
      onDelete: 'CASCADE', // ou 'CASCADE' selon ton besoin
    },
  )
  @JoinColumn({ name: 'departementId' })
  departement?: Departments;
}