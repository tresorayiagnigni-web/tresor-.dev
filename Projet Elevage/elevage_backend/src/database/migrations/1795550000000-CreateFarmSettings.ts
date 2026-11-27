import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFarmSettings1795550000000 implements MigrationInterface {
  name = 'CreateFarmSettings1795550000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`farm_settings\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`nom_exploitation\` varchar(150) NOT NULL,
        \`logo\` varchar(255) NULL,
        \`adresse\` text NULL,
        \`telephone\` varchar(30) NULL,
        \`email\` varchar(150) NULL,
        \`responsable\` varchar(150) NULL,
        \`latitude\` decimal(10,7) NULL,
        \`longitude\` decimal(10,7) NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE \`farm_settings\`
    `);
  }
}
