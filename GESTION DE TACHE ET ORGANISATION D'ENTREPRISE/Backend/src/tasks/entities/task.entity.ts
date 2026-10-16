import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from '../../users/entities/user.entity';
import { TaskStatus } from '../enums/task-status.enum';
import { TaskPriority } from '../enums/task-priority.enum';
import { BaseEntity } from "src/auth/entities/baseEntity";

@Entity('tasks')
export class Task extends BaseEntity {

    @Column()
    title?: string;

    @Column({ nullable: true })
    description?: string;

    @Column({
        type: 'enum',
        enum: TaskStatus,
        default: TaskStatus.A_faire
    })
    status?: TaskStatus;


    @Column({
        type: 'enum',
        enum: TaskPriority,
        default: 'Moyen',
        name: 'priorite',          
        nullable: false,
    })
    priority?: string;

    @Column()
    userId?: number;

    @ManyToOne(() => User, (user) => user.tasks, { 
        nullable: false, 
        onDelete: 'CASCADE' 
    })
    @JoinColumn({ name: 'userId' })
    user?: User;

    @Column({ nullable: true })
    Date_limite?: Date;
}