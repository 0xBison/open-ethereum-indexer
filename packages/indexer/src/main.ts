import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { IndexerModule } from './indexer-module/indexer.module';
import { indexerConfig } from './indexer.config';
import './subscriptions';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { setupSwagger } from './utils/swagger';

async function bootstrap() {
  const appPromise = NestFactory.create(IndexerModule.forRoot(indexerConfig), {
    bufferLogs: true, // Buffer logs until logger is available
  });

  const metricsAppPromise = NestFactory.create(
    PrometheusModule.register({ path: '/metrics' }),
  );

  const [app, metricsApp] = await Promise.all([appPromise, metricsAppPromise]);

  // Use Pino logger instead of default logger
  app.useLogger(app.get(Logger));

  // Setup Swagger
  setupSwagger(app);

  const port = process.env.PORT ?? 3050;
  await app.listen(port);

  const metricsPort = process.env.METRICS_PORT ?? 3051;
  await metricsApp.listen(metricsPort);

  app.get(Logger).log(`Application started on port ${port}`);
  app
    .get(Logger)
    .log(`Swagger documentation available at http://localhost:${port}/api`);
}

void bootstrap();
