import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { IndexerModule } from '@open-ethereum/indexer';
import './entity-registration';
import { indexerConfig } from './indexer.config';

async function bootstrap() {
  const app = await NestFactory.create(IndexerModule.forRoot(indexerConfig), {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  app.useLogger(logger);

  const port = process.env.PORT ?? 3050;
  await app.listen(port);

  logger.log(`Application started on port ${port}`);
}

void bootstrap();
