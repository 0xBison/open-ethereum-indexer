import { Injectable } from '@nestjs/common';
import { ExampleEntity } from './custom/entities/ExampleEntity';
import { v4 as uuidv4 } from 'uuid';
import {
  AbstractEventSubscriber,
  LogContext,
  LogEvent,
} from '@open-ethereum/indexer';

@Injectable()
export class TransferSubscriber extends AbstractEventSubscriber {
  readonly eventPattern = '*:Transfer';

  async onIndex(payload: LogEvent, context: LogContext): Promise<void> {
    const { moduleRef, entityManager } = context;

    const exampleRepository = entityManager.getRepository(ExampleEntity);

    const exampleEntity = new ExampleEntity();
    exampleEntity.id = uuidv4();
    exampleEntity.exampleColumnOne = 'something';
    exampleEntity.exampleColumnTwo = '123';
    await exampleRepository.save(exampleEntity);
  }
}
