
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateFarmEquipmentStock1795710000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'farm_equipment_stock',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'farmId',
            type: 'int',
          },
          {
            name: 'equipmentId',
            type: 'int',
          },
          {
            name: 'quantite_totale',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'bon_etat',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'endommage',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'hors_service',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'cree_le',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
          },
          {
            name: 'modifier_le',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
            onUpdate: 'CURRENT_TIMESTAMP(6)',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('farm_equipment_stock', [
      new TableForeignKey({
        name: 'FK_farm_equipment_stock_farm',
        columnNames: ['farmId'],
        referencedTableName: 'farms',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
      new TableForeignKey({
        name: 'FK_farm_equipment_stock_equipment',
        columnNames: ['equipmentId'],
        referencedTableName: 'inventory_equipment',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    ]);

    await queryRunner.createIndex(
      'farm_equipment_stock',
      new TableIndex({
        name: 'UQ_farm_equipment_stock_farm_equipment',
        columnNames: ['farmId', 'equipmentId'],
        isUnique: true,
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'equipment_stock_movements',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'stockId',
            type: 'int',
          },
          {
            name: 'createdById',
            type: 'int',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '30',
          },
          ...[
            'quantite_totale_avant',
            'quantite_totale_apres',
            'bon_etat_avant',
            'bon_etat_apres',
            'endommage_avant',
            'endommage_apres',
            'hors_service_avant',
            'hors_service_apres',
          ].map((name) => ({
            name,
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          })),
          {
            name: 'observations',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'cree_le',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('equipment_stock_movements', [
      new TableForeignKey({
        name: 'FK_equipment_stock_movements_stock',
        columnNames: ['stockId'],
        referencedTableName: 'farm_equipment_stock',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
      new TableForeignKey({
        name: 'FK_equipment_stock_movements_user',
        columnNames: ['createdById'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    ]);

    await queryRunner.createIndex(
      'equipment_stock_movements',
      new TableIndex({
        name: 'IDX_equipment_stock_movements_date',
        columnNames: ['cree_le'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('equipment_stock_movements');
    await queryRunner.dropTable('farm_equipment_stock');
  }
}
