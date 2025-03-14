import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from 'config-module';
import { DatabaseModule } from 'database-module/database.module';
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

// Create a test module similar to AppModule but configurable
export function createTestModule(nodeConfig: any) {
  @Module({
    imports: [
      ConfigModule.register(nodeConfig),
      DatabaseModule.forRoot({
        entities: [],
        migrations: [],
      }),
      CoreModule,
      EthereumClientModule,
      PrometheusModule.register(),
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
    rpcUrl: string,
    chainId: number = 1337,
  ): Promise<INestApplication> {
    // Create a custom console logger for tests
    const testLogger = new Logger('TestIndexer');

    // Create indexer configuration
    const config = {
      network: {
        rpcUrl,
        chainId,
      },
      contracts: {},
    };

    console.log('env', process.env.LOG_LEVEL);

    // Create and start the test app with the custom logger
    const TestAppModule = createTestModule(config);
    this.app = await NestFactory.create(TestAppModule, {
      abortOnError: true,
      // Use the native logger instead of Pino
      logger: testLogger,
    });

    await this.app.init();

    testLogger.log(
      `Indexer started with RPC URL: ${rpcUrl}, Chain ID: ${chainId}`,
    );

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
