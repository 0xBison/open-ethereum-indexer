import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import './entity-registration';
import './subscriptions';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { AppModule } from './app.module';
import { setupSwagger } from '@open-ethereum/indexer';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const metricsApp = await NestFactory.create(
    PrometheusModule.register({ path: '/metrics' }),
  );

  const metricsPort = process.env.METRICS_PORT ?? 3051;
  await metricsApp.listen(metricsPort);

  setupSwagger(app);

  app.enableCors({
    origin: '*',
    methods: '*',
  });

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
