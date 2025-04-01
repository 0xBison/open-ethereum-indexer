import { MigrationInterface, QueryRunner } from 'typeorm';

export class CounterMigrations1742198536891 implements MigrationInterface {
  name = 'CounterMigrations1742198536891';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create schema if it doesn't exist
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "public"`);

    await queryRunner.query(
      `CREATE TABLE "public"."counter_decremented_f4b3f987" ("unique_event_id" character varying(64) NOT NULL, "event_origin_address" character varying(66) NOT NULL, "created_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tx_index" numeric(5) NOT NULL, "log_index" numeric(5) NOT NULL, "log_data" character varying NOT NULL, "block_hash" character varying(66) NOT NULL, "block_number" bigint NOT NULL, "block_timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "transaction_hash" character varying(66) NOT NULL, "topics" character varying array NOT NULL, "new_count" numeric(78) NOT NULL, CONSTRAINT "PK_61949356b6e68f977652018fe36" PRIMARY KEY ("unique_event_id"))`,
    );

    await queryRunner.query(
      `CREATE TABLE "public"."counter_incremented_75bd9fe0" ("unique_event_id" character varying(64) NOT NULL, "event_origin_address" character varying(66) NOT NULL, "created_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tx_index" numeric(5) NOT NULL, "log_index" numeric(5) NOT NULL, "log_data" character varying NOT NULL, "block_hash" character varying(66) NOT NULL, "block_number" bigint NOT NULL, "block_timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "transaction_hash" character varying(66) NOT NULL, "topics" character varying array NOT NULL, "new_count" numeric(78) NOT NULL, CONSTRAINT "PK_f5e0f4dd5ee2dd72a59c2eb5c55" PRIMARY KEY ("unique_event_id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "public"."counter_decremented_f4b3f987" CASCADE`,
    );

    await queryRunner.query(
      `DROP TABLE IF EXISTS "public"."counter_incremented_75bd9fe0" CASCADE`,
    );
  }
}
