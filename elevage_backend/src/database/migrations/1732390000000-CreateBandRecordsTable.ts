
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBandRecordsTable1732390000000
  implements MigrationInterface
{
  name = 'CreateBandRecordsTable1732390000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`band_records\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`date_releve\` date NOT NULL,
        \`mortalite_jour\` int NOT NULL DEFAULT 0,
        \`autres_sorties\` int NOT NULL DEFAULT 0,
        \`poids_moyen_g\` decimal(8,2) DEFAULT NULL,
        \`poids_standard_g\` decimal(8,2) DEFAULT NULL,
        \`taille_echantillon\` int DEFAULT NULL,
        \`temperature_min_c\` decimal(5,2) DEFAULT NULL,
        \`temperature_max_c\` decimal(5,2) DEFAULT NULL,
        \`code_aliment\` varchar(100) DEFAULT NULL,
        \`ration_g_par_sujet_jour\` decimal(8,2) DEFAULT NULL,
        \`quantite_aliment_kg\` decimal(10,2) DEFAULT NULL,
        \`nombre_sacs\` int DEFAULT NULL,
        \`nombre_repas\` int DEFAULT NULL,
        \`eau_litres\` decimal(10,2) DEFAULT NULL,
        \`vaccination\` text DEFAULT NULL,
        \`traitement\` text DEFAULT NULL,
        \`observations_sante\` text DEFAULT NULL,
        \`ventilation\` text DEFAULT NULL,
        \`observations\` text DEFAULT NULL,
        \`photoUrl\` varchar(500) DEFAULT NULL,
        \`bandId\` int NOT NULL,
        \`createdById\` int NOT NULL,
        \`cree_le\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`modifier_le\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
          ON UPDATE CURRENT_TIMESTAMP(6),

        PRIMARY KEY (\`id\`),

        UNIQUE KEY \`IDX_band_records_band_date\`
          (\`bandId\`, \`date_releve\`),

        KEY \`IDX_band_records_createdById\` (\`createdById\`),

        CONSTRAINT \`FK_band_records_band\`
          FOREIGN KEY (\`bandId\`)
          REFERENCES \`bands\` (\`id\`)
          ON DELETE CASCADE ON UPDATE NO ACTION,

        CONSTRAINT \`FK_band_records_createdBy\`
          FOREIGN KEY (\`createdById\`)
          REFERENCES \`users\` (\`id\`)
          ON DELETE RESTRICT ON UPDATE NO ACTION

      ) ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_general_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE \`band_records\`;
    `);
  }
}
