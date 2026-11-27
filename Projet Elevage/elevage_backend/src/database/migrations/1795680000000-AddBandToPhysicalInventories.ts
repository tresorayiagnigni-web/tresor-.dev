import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBandToPhysicalInventories1795680000000
  implements MigrationInterface
{
  name = 'AddBandToPhysicalInventories1795680000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`physical_inventories\`
      ADD COLUMN \`bandId\` int NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`physical_inventories\`
      ADD INDEX \`IDX_physical_inventories_bandId\` (\`bandId\`)
    `);

    await queryRunner.query(`
      ALTER TABLE \`physical_inventories\`
      ADD CONSTRAINT \`FK_physical_inventories_band\`
      FOREIGN KEY (\`bandId\`)
      REFERENCES \`bands\`(\`id\`)
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`physical_inventories\`
      DROP FOREIGN KEY \`FK_physical_inventories_band\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`physical_inventories\`
      DROP INDEX \`IDX_physical_inventories_bandId\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`physical_inventories\`
      DROP COLUMN \`bandId\`
    `);
  }
}
