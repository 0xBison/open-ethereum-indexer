import { MigrationInterface, QueryRunner } from 'typeorm';

export class CoreMigration1741835491000 implements MigrationInterface {
  name = 'BlockIndexMigration1741835491000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "${process.env.SQL_SCHEMA}"."block_index" ("id" SERIAL NOT NULL, "block_number" integer NOT NULL, "processed_at" TIMESTAMP NOT NULL, "undo_operations" text NOT NULL, CONSTRAINT "PK_block_index" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE "${process.env.SQL_SCHEMA}"."block_index"`,
    );
  }
}
