import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import './database.config';
import { DatabaseConfig } from './database.config';
import { initializeSchema, typeOrmModuleOptions } from './orm.config';
import { dotenvLoader, TypedConfigModule } from 'nest-typed-config';
import { BlockIndex } from './core/BlockIndex.entity';
import { CoreMigration1741835491000 } from './core/1741835491000-CoreMigration';
import { entityRegistry } from '../generic-indexer-module/entity-registry';
import { JsonStoreEntity } from 'nest-json-store';

export interface DatabaseModuleOptions {
  migrations?: (string | Function)[];
}

@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseModuleOptions = {}): DynamicModule {
    const { migrations = [] } = options;
    const registeredEntities = entityRegistry.getAll();

    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          imports: [
            TypedConfigModule.forRoot({
              schema: DatabaseConfig,
              load: dotenvLoader({
                envFilePath:
                  process.env.NODE_ENV === 'test'
                    ? ['.env.test', '.env']
                    : '.env',
              }),
            }),
          ],
          inject: [DatabaseConfig],
          useFactory: async (config: DatabaseConfig) => {
            const allEntities = [
              BlockIndex,
              JsonStoreEntity,
              ...registeredEntities,
            ];
            const allMigrations = [CoreMigration1741835491000, ...migrations];

            await initializeSchema(config, allEntities);
            return typeOrmModuleOptions(config, allEntities, allMigrations);
          },
        }),
      ],
    };
  }
}
