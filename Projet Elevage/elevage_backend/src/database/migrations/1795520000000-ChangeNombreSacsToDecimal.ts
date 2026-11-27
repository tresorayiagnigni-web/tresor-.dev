import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeNombreSacsToDecimal1795520000000
  implements MigrationInterface
{
  name = 'ChangeNombreSacsToDecimal1795520000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`band_records\`
      MODIFY \`nombre_sacs\` DECIMAL(10,2) NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const rows: Array<{ count: string | number }> =
      await queryRunner.query(`
        SELECT COUNT(*) AS count
        FROM \`band_records\`
        WHERE \`nombre_sacs\` IS NOT NULL
          AND \`nombre_sacs\` <> FLOOR(\`nombre_sacs\`);
      `);

    if (Number(rows[0]?.count ?? 0) > 0) {
      throw new Error(
        'Retour arrière impossible : des nombres de sacs contiennent des décimales.',
      );
    }

    await queryRunner.query(`
      ALTER TABLE \`band_records\`
      MODIFY \`nombre_sacs\` INT NULL;
    `);
  }
}
