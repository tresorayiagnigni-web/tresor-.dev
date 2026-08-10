import { Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn, OneToMany,ManyToOne, JoinColumn, UpdateDateColumn, CreateDateColumn } from 'typeorm';
import { Role } from '../../auth/enums/role.enum';
import { Task } from '../../tasks/entities/task.entity';
import { Departments } from '../../departement/entities/departement.entity';
import { Token } from '../../auth/entities/token.entity';
import { BaseEntity } from 'src/auth/entities/baseEntity';


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

  @Column()
  telephone?: string;


  @Column({ default: true })
  status?: boolean;

  // @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIME'})
  // updateAt?: Date;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.EMPLOYEE,
  })
  role?: Role;

  @OneToMany(() => Task, (task) => task.user)
  tasks?: Task[];

  // @OneToMany(() => Token, (token) => token.user)
  // tokens?: Token[];

  // // Dans User entity
  // @Column({ default: true })
  // isActive?: boolean;

  // Ou avec @DeleteDateColumn() de TypeORM
  // @DeleteDateColumn()
  // deletedAt?: Date;

}