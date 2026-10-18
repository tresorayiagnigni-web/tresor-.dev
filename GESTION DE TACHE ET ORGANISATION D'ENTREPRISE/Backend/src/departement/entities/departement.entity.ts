import { Entity, PrimaryGeneratedColumn, Column, OneToOne, CreateDateColumn, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BaseEntity } from 'src/auth/entities/baseEntity';
import { Project } from 'src/project/entities/project.entity';

@Entity('departements')
export class Departments extends BaseEntity{
   
    @Column({ unique: true })
    nom_departement?: string;

    @OneToOne(() => User,{ nullable: true, })
    @JoinColumn({ name: 'chefDepartementId' })
    chef_departement?: User |  null;

    @Column({ nullable: true })
    description?: string;

    @OneToMany(() => User, (user) => user.departement)
    users?: User[];


    @OneToMany(
      () => Project,
    (project) => project.departement,
    )
    projets?: Project[];

    // @CreateDateColumn()
    // date_creation?: Date;


}