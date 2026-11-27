import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFeedDeliveries1795530000000
  implements MigrationInterface
{
  name = 'CreateFeedDeliveries1795530000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`feed_deliveries\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`code_aliment\` varchar(100) NOT NULL,
        \`date_reception\` date NOT NULL,
        \`quantite_tonnes\` decimal(10,3) NOT NULL,
        \`nombre_sacs\` decimal(10,2) NOT NULL,
        \`fournisseur\` varchar(150) NULL,
        \`observations\` text NULL,
        \`createdById\` int NOT NULL,
        \`cree_le\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_feed_deliveries_code\` (\`code_aliment\`),
        INDEX \`IDX_feed_deliveries_date\` (\`date_reception\`),
        CONSTRAINT \`FK_feed_deliveries_createdBy\`
          FOREIGN KEY (\`createdById\`)
          REFERENCES \`users\`(\`id\`)
          ON DELETE RESTRICT
          ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE \`feed_deliveries\`
    `);
  }
}
