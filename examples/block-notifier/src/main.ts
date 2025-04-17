import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { setupSwagger } from '@open-ethereum/indexer';
import './subscriptions';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const metricsApp = await NestFactory.create(
    PrometheusModule.register({ path: '/metrics' }),
  );

  // Wait for logger to be initialized
  const logger = app.get(Logger);
  app.useLogger(logger);

  // Setup Swagger
  setupSwagger(app);

  const port = process.env.PORT ?? 3050;
  await app.listen(port);

  const metricsPort = process.env.METRICS_PORT ?? 3051;
  await metricsApp.listen(metricsPort);

  logger.log(`Application started on port ${port}`);
  logger.log(`Swagger documentation available at http://localhost:${port}/api`);
  logger.log(`Block notifier active - watching for millionth blocks!`);
}

void bootstrap();
