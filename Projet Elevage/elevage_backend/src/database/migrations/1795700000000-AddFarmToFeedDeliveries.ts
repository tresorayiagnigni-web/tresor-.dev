import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddFarmToFeedDeliveries1795700000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'feed_deliveries',
      new TableColumn({
        name: 'farmId',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'feed_deliveries',
      new TableForeignKey({
        name: 'FK_feed_deliveries_farm',
        columnNames: ['farmId'],
        referencedTableName: 'farms',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'feed_deliveries',
      'FK_feed_deliveries_farm',
    );

    await queryRunner.dropColumn('feed_deliveries', 'farmId');
  }
}
