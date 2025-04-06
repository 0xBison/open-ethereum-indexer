import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { Config, ConfigModule } from '../../src/config-module';
import {
  DatabaseModule,
  DatabaseModuleOptions,
} from '../../src/database-module/database.module';
import { CoreModule } from '../../src/core-module/core.module';
import { EthereumClientModule } from '../../src/ethereum-client-module/ethereum-client.module';
import { GenericIndexerModule } from '../../src/generic-indexer-module/generic-indexer.module';
import { GenericControllerModule } from '../../src/generic-indexer-module/generic-controller.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { DatabaseConfig } from '../../src/database-module/database.config';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

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
  skipDatabaseContainer?: boolean; // Option to skip database container creation
  databaseSchema?: string;
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
  public moduleRef: TestingModule | null = null;
  private logger: Logger = new Logger('IndexerTestSetup');
  public postgresContainer: StartedPostgreSqlContainer | null = null;

  /**
   * Setup the indexer with optional database container and custom provider overrides
   *
   * @param indexerConfig Configuration for the indexer test
   * @param customizeModule Optional callback to customize the module before compilation
   * @returns Initialized NestJS application
   */
  async setupIndexer(
    indexerConfig: IndexerTestSetupConfig,
    customizeModule?: (
      moduleBuilder: TestingModuleBuilder,
    ) => TestingModuleBuilder | Promise<TestingModuleBuilder>,
  ): Promise<INestApplication> {
    console.log('in setup indexer');

    // Start PostgreSQL container if not skipped
    if (!indexerConfig.skipDatabaseContainer) {
      console.log('Starting PostgreSQL container...');
      this.postgresContainer = await new PostgreSqlContainer()
        .withDatabase('database_name')
        .withUsername('username')
        .withPassword('password')
        .start();

      console.log(
        `PostgreSQL container started at ${this.postgresContainer.getHost()}:${this.postgresContainer.getPort()}`,
      );
    }

    // Create the test module
    const TestAppModule = createTestModule(indexerConfig);

    // Prepare module builder
    let moduleBuilder = Test.createTestingModule({
      imports: [TestAppModule],
    });

    console.log('before postgres container check');

    // If we have a postgres container, override the database config
    if (this.postgresContainer) {
      console.log('WE HAVE A POSTGRES CONTAINER');

      const overrideDatabaseConfig = {
        SQL_HOST: this.postgresContainer.getHost(),
        SQL_PORT: this.postgresContainer.getPort(),
        SQL_USERNAME: this.postgresContainer.getUsername(),
        SQL_PASSWORD: this.postgresContainer.getPassword(),
        SQL_DB: this.postgresContainer.getDatabase(),
        SQL_SCHEMA:
          indexerConfig.databaseSchema || process.env.SQL_SCHEMA || 'public',
      };

      console.log('overrideDatabaseConfig', overrideDatabaseConfig);

      moduleBuilder = moduleBuilder
        .overrideProvider(DatabaseConfig)
        .useValue(overrideDatabaseConfig);
    }

    // Apply custom module customizations if provided
    if (customizeModule) {
      moduleBuilder = await customizeModule(moduleBuilder);
    }

    // Compile the module
    this.moduleRef = await moduleBuilder.compile();

    // Create the app
    this.app = this.moduleRef.createNestApplication({
      logger: this.logger,
    });

    // Initialize the app
    await this.app.init();

    return this.app;
  }

  /**
   * Tear down the indexer and clean up resources
   */
  async teardownIndexer(): Promise<void> {
    this.logger.log('Tearing down indexer...');

    try {
      // Close the app if it exists
      if (this.app) {
        this.logger.log('Closing NestJS application...');
        await this.app.close();
        this.app = null;
      }

      // Clean up PostgreSQL container if it exists
      if (this.postgresContainer) {
        this.logger.log('Stopping PostgreSQL container...');
        await this.postgresContainer.stop();
        this.postgresContainer = null;
      }

      this.logger.log('Indexer teardown complete');
    } catch (error) {
      this.logger.error('Error during indexer teardown:', error);
      throw error;
    }
  }
}
