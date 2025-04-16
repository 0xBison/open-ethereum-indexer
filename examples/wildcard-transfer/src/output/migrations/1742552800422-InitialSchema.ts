import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1742552800422 implements MigrationInterface {
  name = 'InitialSchema1742552800422';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE ${process.env.SQL_SCHEMA}."transfer_fab013d9" ("unique_event_id" character varying(64) NOT NULL, "event_origin_address" character varying(66) NOT NULL, "created_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tx_index" numeric(5) NOT NULL, "log_index" numeric(5) NOT NULL, "log_data" character varying NOT NULL, "block_hash" character varying(66) NOT NULL, "block_number" bigint NOT NULL, "block_timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "transaction_hash" character varying(66) NOT NULL, "topics" character varying array NOT NULL, "from" character varying(66) NOT NULL, "to" character varying(66) NOT NULL, "amount" numeric(78) NOT NULL, CONSTRAINT "PK_ff1f533a84669008167e85b6ded" PRIMARY KEY ("unique_event_id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS ${process.env.SQL_SCHEMA} CASCADE."transfer_fab013d9"`,
    );
  }
}
