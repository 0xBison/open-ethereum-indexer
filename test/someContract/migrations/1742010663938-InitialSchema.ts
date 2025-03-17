
import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1742010663938 implements MigrationInterface {
  name = 'InitialSchema1742010663938';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create schema if it doesn't exist
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "public"`);
    
    await queryRunner.query(`CREATE TABLE "public"."uint64_array_439e6b8c" ("id" SERIAL NOT NULL, "uint64_array" numeric(78) NOT NULL, "the_struct_id" integer, CONSTRAINT "PK_add3789072844ffd604e85f1ec3" PRIMARY KEY ("id"))`);

    await queryRunner.query(`CREATE TABLE "public"."event_with_struct_with_arrays_439e6b8c" ("unique_event_id" character varying(64) NOT NULL, "event_origin_address" character varying(66) NOT NULL, "created_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tx_index" numeric(5) NOT NULL, "log_index" numeric(5) NOT NULL, "log_data" character varying NOT NULL, "block_hash" character varying(66) NOT NULL, "block_timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "transaction_hash" character varying(66) NOT NULL, "topics" character varying array NOT NULL, "the_struct_id" integer, CONSTRAINT "REL_73b5dd267ea20f34dc2761a957" UNIQUE ("the_struct_id"), CONSTRAINT "PK_a67b2a15025932b1abb7bc4c0f3" PRIMARY KEY ("unique_event_id"))`);

    await queryRunner.query(`CREATE TABLE "public"."the_struct_439e6b8c" ("id" SERIAL NOT NULL, CONSTRAINT "PK_bf8784b45c7f798569e466e3740" PRIMARY KEY ("id"))`);

    await queryRunner.query(`CREATE TABLE "public"."dynamic_array_439e6b8c" ("id" SERIAL NOT NULL, "dynamic_array" numeric(78) NOT NULL, "the_struct_id" integer, CONSTRAINT "PK_e038818c7ca8d7ad4fda51bd7a5" PRIMARY KEY ("id"))`);

    await queryRunner.query(`CREATE TABLE "public"."dynamic_array_e56f559a" ("id" SERIAL NOT NULL, "dynamic_array" numeric(78) NOT NULL, "event_with_dynamic_array_unique_event_id" character varying(64), CONSTRAINT "PK_658629a8af1f72111515d9cd2f8" PRIMARY KEY ("id"))`);

    await queryRunner.query(`CREATE TABLE "public"."event_with_dynamic_array_e56f559a" ("unique_event_id" character varying(64) NOT NULL, "event_origin_address" character varying(66) NOT NULL, "created_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tx_index" numeric(5) NOT NULL, "log_index" numeric(5) NOT NULL, "log_data" character varying NOT NULL, "block_hash" character varying(66) NOT NULL, "block_timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "transaction_hash" character varying(66) NOT NULL, "topics" character varying array NOT NULL, CONSTRAINT "PK_a9816b7a574837ce8e4e0b6b799" PRIMARY KEY ("unique_event_id"))`);

    await queryRunner.query(`CREATE TABLE "public"."uint64_array_696b4daf" ("id" SERIAL NOT NULL, "uint64_array" numeric(78) NOT NULL, "event_with_fixed_array_unique_event_id" character varying(64), CONSTRAINT "PK_3b7a5f43f483d59780827b5f1ab" PRIMARY KEY ("id"))`);

    await queryRunner.query(`CREATE TABLE "public"."event_with_fixed_array_696b4daf" ("unique_event_id" character varying(64) NOT NULL, "event_origin_address" character varying(66) NOT NULL, "created_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tx_index" numeric(5) NOT NULL, "log_index" numeric(5) NOT NULL, "log_data" character varying NOT NULL, "block_hash" character varying(66) NOT NULL, "block_timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "transaction_hash" character varying(66) NOT NULL, "topics" character varying array NOT NULL, CONSTRAINT "PK_e539ad809acd9d7253aab6cbee3" PRIMARY KEY ("unique_event_id"))`);

    await queryRunner.query(`CREATE TABLE "public"."event_with_struct_with_dynamic_struct_array_de916601" ("unique_event_id" character varying(64) NOT NULL, "event_origin_address" character varying(66) NOT NULL, "created_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tx_index" numeric(5) NOT NULL, "log_index" numeric(5) NOT NULL, "log_data" character varying NOT NULL, "block_hash" character varying(66) NOT NULL, "block_timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "transaction_hash" character varying(66) NOT NULL, "topics" character varying array NOT NULL, "the_struct_id" integer, CONSTRAINT "REL_6e8a03b3552be699debc5b5ca6" UNIQUE ("the_struct_id"), CONSTRAINT "PK_ca2b6fb84dff8661bd6dfa05b33" PRIMARY KEY ("unique_event_id"))`);

    await queryRunner.query(`CREATE TABLE "public"."the_struct_de916601" ("id" SERIAL NOT NULL, CONSTRAINT "PK_6ce34e37d6e7531d182b532ee82" PRIMARY KEY ("id"))`);

    await queryRunner.query(`CREATE TABLE "public"."dynamic_struct_array_de916601" ("id" SERIAL NOT NULL, "a" numeric(78) NOT NULL, "b" numeric(78) NOT NULL, "the_struct_id" integer, CONSTRAINT "PK_17b7f942a005f430f3c314466f9" PRIMARY KEY ("id"))`);

    await queryRunner.query(`CREATE TABLE "public"."struct_array_68e489fd" ("id" SERIAL NOT NULL, "a" numeric(78) NOT NULL, "b" numeric(78) NOT NULL, "the_struct_id" integer, CONSTRAINT "PK_6efb652a07101e06542d7dc49a5" PRIMARY KEY ("id"))`);

    await queryRunner.query(`CREATE TABLE "public"."the_struct_68e489fd" ("id" SERIAL NOT NULL, CONSTRAINT "PK_c44ea2bd95c51b7b3d814e6c9fd" PRIMARY KEY ("id"))`);

    await queryRunner.query(`CREATE TABLE "public"."event_with_struct_with_fixed_struct_array_68e489fd" ("unique_event_id" character varying(64) NOT NULL, "event_origin_address" character varying(66) NOT NULL, "created_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tx_index" numeric(5) NOT NULL, "log_index" numeric(5) NOT NULL, "log_data" character varying NOT NULL, "block_hash" character varying(66) NOT NULL, "block_timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "transaction_hash" character varying(66) NOT NULL, "topics" character varying array NOT NULL, "the_struct_id" integer, CONSTRAINT "REL_388a248d03c3ecd2584defb624" UNIQUE ("the_struct_id"), CONSTRAINT "PK_1de38652eac53679a662576f19e" PRIMARY KEY ("unique_event_id"))`);

    await queryRunner.query(`CREATE TABLE "public"."simple_struct_4ec25295" ("id" SERIAL NOT NULL, "a" numeric(78) NOT NULL, "b" numeric(78) NOT NULL, CONSTRAINT "PK_7a36e7dc9c0492f67821a09f315" PRIMARY KEY ("id"))`);

    await queryRunner.query(`CREATE TABLE "public"."the_struct_4ec25295" ("id" SERIAL NOT NULL, "simple_struct_id" integer, CONSTRAINT "REL_73059d61817a9e5e4a18fd0214" UNIQUE ("simple_struct_id"), CONSTRAINT "PK_94d993b42c3c81cae36e845e4c0" PRIMARY KEY ("id"))`);

    await queryRunner.query(`CREATE TABLE "public"."event_with_struct_with_nested_struct_4ec25295" ("unique_event_id" character varying(64) NOT NULL, "event_origin_address" character varying(66) NOT NULL, "created_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tx_index" numeric(5) NOT NULL, "log_index" numeric(5) NOT NULL, "log_data" character varying NOT NULL, "block_hash" character varying(66) NOT NULL, "block_timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "transaction_hash" character varying(66) NOT NULL, "topics" character varying array NOT NULL, "the_struct_id" integer, CONSTRAINT "REL_095c4404deff21bd8fbbe12d61" UNIQUE ("the_struct_id"), CONSTRAINT "PK_856cb7c232501d70c6e86a7fc34" PRIMARY KEY ("unique_event_id"))`);

    await queryRunner.query(`CREATE TABLE "public"."simple_event_f9536490" ("unique_event_id" character varying(64) NOT NULL, "event_origin_address" character varying(66) NOT NULL, "created_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tx_index" numeric(5) NOT NULL, "log_index" numeric(5) NOT NULL, "log_data" character varying NOT NULL, "block_hash" character varying(66) NOT NULL, "block_timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "transaction_hash" character varying(66) NOT NULL, "topics" character varying array NOT NULL, "num64_value" numeric(20) NOT NULL, "bool_value" boolean NOT NULL, "string_value" character varying NOT NULL, "addr_value" character varying(66) NOT NULL, "bytes1_value" character varying NOT NULL, "bytes32_value" character varying NOT NULL, "int256_value" numeric(77) NOT NULL, "int64_value" numeric(19) NOT NULL, "some_enum" numeric(3) NOT NULL, CONSTRAINT "PK_afcf53a2fd8975221f99d607a5e" PRIMARY KEY ("unique_event_id"))`);

    await queryRunner.query(`ALTER TABLE "public"."uint64_array_439e6b8c" ADD CONSTRAINT "FK_79982d2c47d02e96de1afeff489" FOREIGN KEY ("the_struct_id") REFERENCES "the_struct_439e6b8c"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "public"."event_with_struct_with_arrays_439e6b8c" ADD CONSTRAINT "FK_73b5dd267ea20f34dc2761a9577" FOREIGN KEY ("the_struct_id") REFERENCES "the_struct_439e6b8c"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "public"."dynamic_array_439e6b8c" ADD CONSTRAINT "FK_686f496a49539d84b50aae980e6" FOREIGN KEY ("the_struct_id") REFERENCES "the_struct_439e6b8c"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "public"."dynamic_array_e56f559a" ADD CONSTRAINT "FK_c4e176e194f9bf2303e590011f2" FOREIGN KEY ("event_with_dynamic_array_unique_event_id") REFERENCES "event_with_dynamic_array_e56f559a"("unique_event_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "public"."uint64_array_696b4daf" ADD CONSTRAINT "FK_ffec6f101c80116957f2731e4d2" FOREIGN KEY ("event_with_fixed_array_unique_event_id") REFERENCES "event_with_fixed_array_696b4daf"("unique_event_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "public"."event_with_struct_with_dynamic_struct_array_de916601" ADD CONSTRAINT "FK_6e8a03b3552be699debc5b5ca64" FOREIGN KEY ("the_struct_id") REFERENCES "the_struct_de916601"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "public"."dynamic_struct_array_de916601" ADD CONSTRAINT "FK_bce70786d6c7583a05b75064d9a" FOREIGN KEY ("the_struct_id") REFERENCES "the_struct_de916601"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "public"."struct_array_68e489fd" ADD CONSTRAINT "FK_5dc658dac7b2ebcc698e88b30ef" FOREIGN KEY ("the_struct_id") REFERENCES "the_struct_68e489fd"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "public"."event_with_struct_with_fixed_struct_array_68e489fd" ADD CONSTRAINT "FK_388a248d03c3ecd2584defb624a" FOREIGN KEY ("the_struct_id") REFERENCES "the_struct_68e489fd"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "public"."the_struct_4ec25295" ADD CONSTRAINT "FK_73059d61817a9e5e4a18fd0214d" FOREIGN KEY ("simple_struct_id") REFERENCES "simple_struct_4ec25295"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "public"."event_with_struct_with_nested_struct_4ec25295" ADD CONSTRAINT "FK_095c4404deff21bd8fbbe12d617" FOREIGN KEY ("the_struct_id") REFERENCES "the_struct_4ec25295"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "public"."uint64_array_439e6b8c" CASCADE`);

    await queryRunner.query(`DROP TABLE IF EXISTS "public"."event_with_struct_with_arrays_439e6b8c" CASCADE`);

    await queryRunner.query(`DROP TABLE IF EXISTS "public"."the_struct_439e6b8c" CASCADE`);

    await queryRunner.query(`DROP TABLE IF EXISTS "public"."dynamic_array_439e6b8c" CASCADE`);

    await queryRunner.query(`DROP TABLE IF EXISTS "public"."dynamic_array_e56f559a" CASCADE`);

    await queryRunner.query(`DROP TABLE IF EXISTS "public"."event_with_dynamic_array_e56f559a" CASCADE`);

    await queryRunner.query(`DROP TABLE IF EXISTS "public"."uint64_array_696b4daf" CASCADE`);

    await queryRunner.query(`DROP TABLE IF EXISTS "public"."event_with_fixed_array_696b4daf" CASCADE`);

    await queryRunner.query(`DROP TABLE IF EXISTS "public"."event_with_struct_with_dynamic_struct_array_de916601" CASCADE`);

    await queryRunner.query(`DROP TABLE IF EXISTS "public"."the_struct_de916601" CASCADE`);

    await queryRunner.query(`DROP TABLE IF EXISTS "public"."dynamic_struct_array_de916601" CASCADE`);

    await queryRunner.query(`DROP TABLE IF EXISTS "public"."struct_array_68e489fd" CASCADE`);

    await queryRunner.query(`DROP TABLE IF EXISTS "public"."the_struct_68e489fd" CASCADE`);

    await queryRunner.query(`DROP TABLE IF EXISTS "public"."event_with_struct_with_fixed_struct_array_68e489fd" CASCADE`);

    await queryRunner.query(`DROP TABLE IF EXISTS "public"."simple_struct_4ec25295" CASCADE`);

    await queryRunner.query(`DROP TABLE IF EXISTS "public"."the_struct_4ec25295" CASCADE`);

    await queryRunner.query(`DROP TABLE IF EXISTS "public"."event_with_struct_with_nested_struct_4ec25295" CASCADE`);

    await queryRunner.query(`DROP TABLE IF EXISTS "public"."simple_event_f9536490" CASCADE`);

    await queryRunner.query(`ALTER TABLE "uint64_array_439e6b8c" DROP CONSTRAINT "FK_79982d2c47d02e96de1afeff489"`);

    await queryRunner.query(`ALTER TABLE "event_with_struct_with_arrays_439e6b8c" DROP CONSTRAINT "FK_73b5dd267ea20f34dc2761a9577"`);

    await queryRunner.query(`ALTER TABLE "dynamic_array_439e6b8c" DROP CONSTRAINT "FK_686f496a49539d84b50aae980e6"`);

    await queryRunner.query(`ALTER TABLE "dynamic_array_e56f559a" DROP CONSTRAINT "FK_c4e176e194f9bf2303e590011f2"`);

    await queryRunner.query(`ALTER TABLE "uint64_array_696b4daf" DROP CONSTRAINT "FK_ffec6f101c80116957f2731e4d2"`);

    await queryRunner.query(`ALTER TABLE "event_with_struct_with_dynamic_struct_array_de916601" DROP CONSTRAINT "FK_6e8a03b3552be699debc5b5ca64"`);

    await queryRunner.query(`ALTER TABLE "dynamic_struct_array_de916601" DROP CONSTRAINT "FK_bce70786d6c7583a05b75064d9a"`);

    await queryRunner.query(`ALTER TABLE "struct_array_68e489fd" DROP CONSTRAINT "FK_5dc658dac7b2ebcc698e88b30ef"`);

    await queryRunner.query(`ALTER TABLE "event_with_struct_with_fixed_struct_array_68e489fd" DROP CONSTRAINT "FK_388a248d03c3ecd2584defb624a"`);

    await queryRunner.query(`ALTER TABLE "the_struct_4ec25295" DROP CONSTRAINT "FK_73059d61817a9e5e4a18fd0214d"`);

    await queryRunner.query(`ALTER TABLE "event_with_struct_with_nested_struct_4ec25295" DROP CONSTRAINT "FK_095c4404deff21bd8fbbe12d617"`);
  }
}