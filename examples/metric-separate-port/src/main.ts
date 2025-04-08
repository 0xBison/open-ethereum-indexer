import { NestFactory } from '@nestjs/core';
import { IndexerModule } from '@open-ethereum/indexer';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { Logger } from '@nestjs/common';
import { indexerConfig } from './indexer.config';

async function bootstrap() {
  const app = await NestFactory.create(IndexerModule.forRoot(indexerConfig), {
    bufferLogs: true,
  });

  const metricsApp = await NestFactory.create(
    PrometheusModule.register({ path: '/metrics' }),
  );

  // Wait for logger to be initialized
  const logger = app.get(Logger);
  app.useLogger(logger);

  const port = process.env.PORT ?? 3050;
  await app.listen(port);

  const metricsPort = process.env.METRICS_PORT ?? 3051;
  await metricsApp.listen(metricsPort);

  logger.log(`Application started on port ${port}`);
  logger.log(`Metrics available at http://localhost:${metricsPort}/metrics`);
}

void bootstrap();
