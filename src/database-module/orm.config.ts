import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { DatabaseConfig } from './database.config';
import { DataSource } from 'typeorm';
import { CreateJsonStore1710000000000, JsonStoreEntity } from 'nest-json-store';
import { Type } from '@nestjs/common';

// Core entities that are always included
const CORE_ENTITIES = [JsonStoreEntity];

export const typeOrmModuleOptions = (
  databaseConfig: DatabaseConfig,
  additionalEntities: Type<any>[] = [],
  additionalMigrations: (string | Function)[] = [],
) => ({
  type: 'postgres' as const,
  host: databaseConfig.SQL_HOST,
  port: databaseConfig.SQL_PORT,
  username: databaseConfig.SQL_USERNAME,
  password: databaseConfig.SQL_PASSWORD,
  database: databaseConfig.SQL_DB,
  migrations: [CreateJsonStore1710000000000, ...additionalMigrations],
  synchronize: false,
  namingStrategy: new SnakeNamingStrategy(),
  migrationsRun: true,
  schema: databaseConfig.SQL_SCHEMA,
  entities: [...CORE_ENTITIES, ...additionalEntities],
});

// This method sets up a transient data source and creates the schema since
// typeorm doesnt support this functionality and will fail if the schema doesnt
// exist. We do this before the real connection is made.
export const initializeSchema = async (
  databaseConfig: DatabaseConfig,
  additionalEntities: Type<any>[] = [],
) => {
  const dataSource = new DataSource({
    ...typeOrmModuleOptions(databaseConfig, additionalEntities), // Pass all parameters
    schema: 'public',
    synchronize: false,
    migrationsRun: false,
    dropSchema: false,
  });

  await dataSource.initialize();

  await dataSource.query(
    `CREATE SCHEMA IF NOT EXISTS ${databaseConfig.SQL_SCHEMA};`,
  );

  await dataSource.destroy();
};

export default typeOrmModuleOptions;
