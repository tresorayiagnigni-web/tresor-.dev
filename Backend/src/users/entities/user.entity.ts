import { Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn, OneToMany,ManyToOne, JoinColumn, UpdateDateColumn, CreateDateColumn, OneToOne } from 'typeorm';
import { Role } from '../../auth/enums/role.enum';
import { Task } from '../../tasks/entities/task.entity';
import { Departments } from '../../departement/entities/departement.entity';
import { Token } from '../../auth/entities/token.entity';
import { BaseEntity } from 'src/auth/entities/baseEntity';
import { UserProvider } from './user-provider.entity';


@Entity('users')
export class User extends BaseEntity {

  @Column()
  nom?: string;

  @Column({ unique: true })
  email?: string;

  @Column({ select: false })
  password?: string;

  @ManyToOne(() => Departments, (department) => department.users, {
    nullable: true,                     // ou false si le département est obligatoire
  })
  @JoinColumn({ name: 'departementId' })
  departement?: Departments;

  @Column({ nullable: true })
  departementId?: number;

  @OneToOne(() => Departments, (departement) => departement.chef_departement)
  chef_departement?: Departments;

  @Column()
  telephone?: string;

  @OneToMany(() => UserProvider, (p) => p.user)
  providers?: UserProvider[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  picture?: string;

  @Column({ default: true })
  status?: boolean;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.EMPLOYEE,
  })
  role?: Role;

  @OneToMany(() => Task, (task) => task.user)
  tasks?: Task[];
}