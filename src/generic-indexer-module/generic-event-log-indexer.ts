import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Log } from '@ethersproject/abstract-provider';
import { InjectEntityManager } from '@nestjs/typeorm';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { LogDescription, ParamType } from 'ethers/lib/utils';
import { pascalCase } from 'pascal-case';
import { Gauge } from 'prom-client';
import { EntityManager, DataSource } from 'typeorm';
import { getEventData } from './event/getEventData';
import xxhash, { XXHashAPI } from 'xxhash-wasm';
import { BlockchainEventEntity } from './entity/BlockchainEventEntity';

export const GenericEventLogIndexerIdentifier =
  'GenericEventLogIndexerIdentifier';

@Injectable()
export class GenericEventLogIndexer implements OnModuleInit {
  private readonly logger = new Logger(GenericEventLogIndexer.name);

  private xxhash: XXHashAPI;

  constructor(
    @InjectEntityManager()
    private entityManager: EntityManager,
    private connection: DataSource,
    @InjectMetric('indexed_event') public indexedEventGauge: Gauge<string>,
  ) {}

  async onModuleInit() {
    this.xxhash = await xxhash();
  }

  private createEventEntity(
    log: Log,
    event: LogDescription,
    blockTimestamp: number,
  ): object {
    // Get the event entity from the event data
    const structure: Array<ParamType> = event.eventFragment.inputs;
    const eventEntity = getEventData(structure, -1, event.args);

    // Add common fields to the event entity
    eventEntity['eventOriginAddress'] = log.address;
    eventEntity['txIndex'] = log.transactionIndex;
    eventEntity['logIndex'] = log.logIndex;
    eventEntity['logData'] = log.data;
    eventEntity['blockHash'] = log.blockHash;
    eventEntity['transactionHash'] = log.transactionHash;
    eventEntity['topics'] = log.topics;
    eventEntity['blockTimestamp'] = new Date(
      blockTimestamp * 1000,
    ).toISOString();

    return eventEntity;
  }

  public async processLog(
    log: Log,
    event: LogDescription,
    blockTimestamp: number,
    isRemoved: boolean,
  ): Promise<void> {
    // raw, unparsed event log object
    this.logger.log(`${event.name} event received:\n${JSON.stringify(log)}`);

    // get the xxHash of the event topic, and use it to form the name of the
    // event repository
    const topicXXHash = this.xxhash.h32ToString(event.topic);

    // get an instance of the respective event repository class
    const eventEntityName = `${pascalCase(event.name)}Entity_${topicXXHash}`;
    const eventRepository = this.entityManager.getRepository(eventEntityName);

    // if non-reorg then add else remove from db
    if (!isRemoved) {
      const eventEntity = this.createEventEntity(log, event, blockTimestamp);

      try {
        // create the object to be added to the database
        const eventDBEntity = eventRepository.create(eventEntity);

        // store the properly formatted entity in the database
        await eventRepository.save(eventDBEntity);

        // log the event object just how it was added to the database
        this.logger.log(
          `${event.name} event added to the database:\n${JSON.stringify(
            eventDBEntity,
          )}`,
        );

        this.indexedEventGauge.labels(eventEntityName).inc();
      } catch (err) {
        this.logger.error(`Failed to add ${event.name}`, err);
      }
    } else {
      const eventHash = BlockchainEventEntity.generateEventId(
        log.blockHash,
        log.transactionHash,
        log.transactionIndex,
        log.logIndex,
      );

      await eventRepository.delete(eventHash);

      this.indexedEventGauge.labels(eventEntityName).dec();
    }
  }

  processEventLog(log: Log) {
    // console.log('processEventLog', log);
  }

  processBlockLog(
    logs: Array<Log>,
    blockTimestamp: number,
    areRemoved = false,
  ) {
    // console.log('processBlockLog', logs, blockTimestamp, areRemoved);
  }
}
