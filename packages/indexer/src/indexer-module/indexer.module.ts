import {
  DynamicModule,
  ForwardReference,
  Global,
  Module,
  Type,
} from '@nestjs/common';
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
    disableRootController?: boolean;
    disableBlockMonitorController?: boolean;
    disableMetrics?: boolean;
    disablePino?: boolean;
    disableGraphqlPlayground?: boolean;
    disableGraphql?: boolean;
  };
}

@Global()
@Module({})
export class IndexerModule {
  static forRoot(indexerConfig: IndexerConfig): DynamicModule {
    const imports: Array<
      Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference
    > = [];

    const controllers: Array<Type<any>> = [];

    // core imports
    imports.push(
      ConfigModule.register(indexerConfig.indexer),
      DatabaseModule.forRoot(indexerConfig.database),
      CoreModule.register({
        disableBlockMonitorController:
          indexerConfig.app?.disableBlockMonitorController,
      }),
      EthereumClientModule,
      GenericIndexerModule.forRoot(),
      GenericControllerModule.forEntities(),
    );

    if (!indexerConfig.app?.disableMetrics) {
      imports.push(PrometheusModule.register());
    }

    if (!indexerConfig.app?.disablePino) {
      imports.push(LoggerModule);
    }

    if (!indexerConfig.app?.disableGraphql) {
      imports.push(
        GraphQLAppModule.forRoot({
          disablePlayground: indexerConfig.app?.disableGraphqlPlayground,
        }),
      );
    }

    if (!indexerConfig.app?.disableRootController) {
      controllers.push(IndexerController);
    }

    return {
      module: IndexerModule,
      imports,
      controllers,
      exports: [ConfigModule, CoreModule, EthereumClientModule],
    };
  }
}
