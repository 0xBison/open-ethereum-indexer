import { DynamicModule, Global, Module } from '@nestjs/common';
import { IndexerController } from './indexer.controller';
import { Config, ConfigModule } from '../config-module';
import { CoreModule } from '../core-module';
import {
  DatabaseModule,
  DatabaseModuleOptions,
} from '../database-module/database.module';
import { EthereumClientModule } from '../ethereum-client-module/ethereum-client.module';
import { GenericControllerModule } from '../generic-indexer-module/generic-controller.module';
import { GenericIndexerModule } from '../generic-indexer-module/generic-indexer.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { LoggerModule } from '../logger-module/logger.module';
import { GraphQLAppModule } from '../graphql-module/graphql.module';

export interface IndexerConfig {
  indexer: Config;
  database: DatabaseModuleOptions;
  app?: {
    disableController?: boolean;
    disableMetrics?: boolean;
  };
}

@Global()
@Module({})
export class IndexerModule {
  static forRoot(indexerConfig: IndexerConfig): DynamicModule {
    return {
      module: IndexerModule,
      imports: [
        LoggerModule,
        ConfigModule.register(indexerConfig.indexer),
        DatabaseModule.forRoot(indexerConfig.database),
        CoreModule,
        EthereumClientModule,
        GenericIndexerModule.forRoot(),
        GenericControllerModule.forEntities(),
        // GraphQLAppModule.forRoot(),
        ...(indexerConfig.app?.disableMetrics
          ? []
          : [PrometheusModule.register()]),
      ],
      controllers: indexerConfig.app?.disableController
        ? []
        : [IndexerController],
    };
  }
}
