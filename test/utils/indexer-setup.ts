import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { Config, ConfigModule } from 'config-module';
import {
  DatabaseModule,
  DatabaseModuleOptions,
} from 'database-module/database.module';
import { CoreModule } from 'core-module/core.module';
import { EthereumClientModule } from 'ethereum-client-module/ethereum-client.module';
import { GenericIndexerModule } from 'generic-indexer-module/generic-indexer.module';
import { GenericControllerModule } from 'generic-indexer-module/generic-controller.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Logger } from '@nestjs/common';

// Load test environment variables
export function loadTestEnvironment() {
  const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
  const envPath = path.resolve(process.cwd(), envFile);

  const result = dotenv.config({ path: envPath });

  if (result.error) {
    console.error(`Error loading environment: ${result.error.message}`);
    throw result.error;
  }
}

export interface IndexerTestSetupConfig {
  config: Config;
  databaseConfig?: DatabaseModuleOptions;
}

// Create a test module similar to AppModule but configurable
export function createTestModule(indexerConfig: IndexerTestSetupConfig) {
  let { rpcUrl, chainId } = indexerConfig.config.network;

  console.log(`Indexer started with RPC URL: ${rpcUrl}, Chain ID: ${chainId}`);

  @Module({
    imports: [
      ConfigModule.register(indexerConfig.config),
      DatabaseModule.forRoot(indexerConfig.databaseConfig),
      CoreModule,
      EthereumClientModule,
      // Skip prometheus or it causes issues with the metrics being registered multiple times:
      // A metric with the name xxx has already been registered.
      // PrometheusModule.register(),
      GenericIndexerModule.forRoot(),
      GenericControllerModule.forEntities(),
    ],
    exports: [CoreModule],
  })
  class TestAppModule {}

  return TestAppModule;
}

export class IndexerTestSetup {
  private app: INestApplication | null = null;
  private logger: Logger | null = null;

  async setupIndexer(
    indexerConfig: IndexerTestSetupConfig,
  ): Promise<INestApplication> {
    // Create a custom console logger for tests
    const testLogger = new Logger('TestIndexer');

    // Create and start the test app with the custom logger
    const TestAppModule = createTestModule(indexerConfig);

    console.log(
      'Available modules to load:',
      Object.keys(TestAppModule.prototype).join(', '),
    );
    console.log('CoreModule providers:', CoreModule);

    this.app = await NestFactory.create(TestAppModule, {
      abortOnError: true,
      // Use the native logger instead of Pino
      logger: testLogger,
    });

    await this.app.init();

    return this.app;
  }

  async teardownIndexer(): Promise<void> {
    if (this.app) {
      this.logger?.log('Shutting down indexer');
      await this.app.close();
      this.logger?.log('Indexer stopped');
    }
  }
}
