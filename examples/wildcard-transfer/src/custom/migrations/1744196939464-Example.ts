import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExampleEntitySchema1744196939464 implements MigrationInterface {
  name = 'ExampleEntitySchema1744196939464';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE ${process.env.SQL_SCHEMA}."example_entity" (
        "id" uuid NOT NULL,
        "example_column_one" character varying(${66}) NOT NULL,
        "example_column_two" numeric(78) NOT NULL,
        CONSTRAINT "PK_example_entity" PRIMARY KEY ("id")
      )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS ${process.env.SQL_SCHEMA}."example_entity" CASCADE`,
    );
  }
}
