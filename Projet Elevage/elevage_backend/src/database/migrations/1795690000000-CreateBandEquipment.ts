import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBandEquipment1795690000000
  implements MigrationInterface
{
  name = 'CreateBandEquipment1795690000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`band_equipment\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`bandId\` int NOT NULL,
        \`equipmentId\` int NOT NULL,
        \`quantite_reference\` decimal(12,2) NOT NULL DEFAULT 0,
        \`cree_le\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`modifier_le\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
          ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_band_equipment_band_equipment\` (\`bandId\`, \`equipmentId\`),
        KEY \`IDX_band_equipment_bandId\` (\`bandId\`),
        KEY \`IDX_band_equipment_equipmentId\` (\`equipmentId\`),
        CONSTRAINT \`FK_band_equipment_band\`
          FOREIGN KEY (\`bandId\`)
          REFERENCES \`bands\` (\`id\`)
          ON DELETE CASCADE
          ON UPDATE NO ACTION,
        CONSTRAINT \`FK_band_equipment_equipment\`
          FOREIGN KEY (\`equipmentId\`)
          REFERENCES \`inventory_equipment\` (\`id\`)
          ON DELETE RESTRICT
          ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    // Reprendre les anciennes quantités communes comme valeurs initiales.
    // L'ADMIN pourra ensuite les adapter individuellement par bande.
    await queryRunner.query(`
      INSERT INTO \`band_equipment\`
        (\`bandId\`, \`equipmentId\`, \`quantite_reference\`)
      SELECT
        b.\`id\`,
        e.\`id\`,
        e.\`quantite_reference\`
      FROM \`bands\` b
      CROSS JOIN \`inventory_equipment\` e
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS \`band_equipment\`
    `);
  }
}