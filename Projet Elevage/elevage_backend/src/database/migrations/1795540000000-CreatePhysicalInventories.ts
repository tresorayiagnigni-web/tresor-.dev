
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePhysicalInventories1795540000000
  implements MigrationInterface
{
  name = 'CreatePhysicalInventories1795540000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Table principale des inventaires physiques
    await queryRunner.query(`
      CREATE TABLE \`physical_inventories\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`date_inventaire\` date NOT NULL,
        \`statut\` enum('BROUILLON', 'TERMINE') NOT NULL DEFAULT 'BROUILLON',
        \`observations\` text NULL,
        \`createdById\` int NOT NULL,
        \`cree_le\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_physical_inventories_date\` (\`date_inventaire\`),
        CONSTRAINT \`FK_physical_inventories_createdBy\`
          FOREIGN KEY (\`createdById\`)
          REFERENCES \`users\`(\`id\`)
          ON DELETE RESTRICT
          ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    // Catalogue du matériel
    await queryRunner.query(`
      CREATE TABLE \`inventory_equipment\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`designation\` varchar(150) NOT NULL,
        \`description\` text NULL,
        \`unite\` varchar(30) NOT NULL DEFAULT 'unité',
        \`quantite_reference\` decimal(12,2) NOT NULL DEFAULT 0,
        \`actif\` tinyint NOT NULL DEFAULT 1,
        \`cree_le\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`modifier_le\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_inventory_equipment_designation\` (\`designation\`)
      ) ENGINE=InnoDB
    `);

    // Éléments contrôlés pendant chaque inventaire
    await queryRunner.query(`
      CREATE TABLE \`physical_inventory_items\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`type\` enum('ALIMENT', 'OEUF', 'MATERIEL') NOT NULL,
        \`designation\` varchar(150) NOT NULL,
        \`quantite_theorique\` decimal(12,2) NOT NULL DEFAULT 0,
        \`quantite_physique\` decimal(12,2) NOT NULL,
        \`ecart\` decimal(12,2) NOT NULL DEFAULT 0,
        \`etat_materiel\` enum('BON_ETAT', 'ENDOMMAGE', 'HORS_SERVICE') NULL,
        \`unite\` varchar(30) NOT NULL,
        \`observations\` text NULL,
        \`inventoryId\` int NOT NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_physical_inventory_items_type\` (\`type\`),
        CONSTRAINT \`FK_physical_inventory_items_inventory\`
          FOREIGN KEY (\`inventoryId\`)
          REFERENCES \`physical_inventories\`(\`id\`)
          ON DELETE CASCADE
          ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE \`physical_inventory_items\`
    `);

    await queryRunner.query(`
      DROP TABLE \`inventory_equipment\`
    `);

    await queryRunner.query(`
      DROP TABLE \`physical_inventories\`
    `);
  }
}
