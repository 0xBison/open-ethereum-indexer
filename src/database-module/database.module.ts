import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import './database.config';
import { DatabaseConfig } from './database.config';
import { initializeSchema, typeOrmModuleOptions } from './orm.config';
import { dotenvLoader, TypedConfigModule } from 'nest-typed-config';
import { Type } from '@nestjs/common';
import { BlockIndex } from './core/BlockIndex.entity';
import { CoreMigration1741835491000 } from './core/1741835491000-CoreMigration';

export interface DatabaseModuleOptions {
  entities?: Type<any>[];
  migrations?: (string | Function)[];
}

@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseModuleOptions = {}): DynamicModule {
    const { entities = [], migrations = [] } = options;

    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          imports: [
            TypedConfigModule.forRoot({
              schema: DatabaseConfig,
              load: dotenvLoader(),
            }),
          ],
          inject: [DatabaseConfig],
          useFactory: async (config: DatabaseConfig) => {
            const allEntities = [BlockIndex, ...entities];
            const allMigrations = [CoreMigration1741835491000, ...migrations];

            await initializeSchema(config, allEntities);
            return typeOrmModuleOptions(config, allEntities, allMigrations);
          },
        }),
      ],
    };
  }
}
