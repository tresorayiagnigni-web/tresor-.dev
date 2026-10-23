import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,          // ← ajoute
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Departments } from '../../departement/entities/departement.entity';
import { Task } from '../../tasks/entities/task.entity'; // ← adapte le chemin

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  name?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'date', nullable: true })
  dueDate?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdById' })
  createdBy?: User;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @ManyToOne(
    () => Departments,
    (departement) => departement.projets,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'departementId' })
  departement?: Departments;

  // ← NOUVELLE RELATION
  @OneToMany(() => Task, (task) => task.project)
  tasks?: Task[];
}