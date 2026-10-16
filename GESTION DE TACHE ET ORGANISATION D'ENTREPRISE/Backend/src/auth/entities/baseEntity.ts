import { CreateDateColumn, DeleteDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export class BaseEntity {
    @PrimaryGeneratedColumn()
    id?: number;

    @CreateDateColumn({ type: 'timestamp', precision: null, default: () => 'CURRENT_TIMESTAMP' })
    cree_le?: Date;

    @UpdateDateColumn({ type: 'timestamp', precision: null, default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    modifie_le?: Date;

    @DeleteDateColumn({ type: 'timestamp', precision: null, nullable: true })
    supprime_le?: Date;
}