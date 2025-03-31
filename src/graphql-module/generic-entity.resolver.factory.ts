import { Type } from '@nestjs/common';
import {
  Resolver,
  Query,
  Args,
  Int,
  ID,
  Field,
  ObjectType,
  InputType,
} from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ObjectLiteral, FindOptionsWhere } from 'typeorm';
import { getMetadataArgsStorage } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

@InputType('EventFilterInput')
class EventFilterArgs {
  @Field(() => String, { nullable: true })
  uniqueEventId?: string;

  @Field(() => String, { nullable: true })
  eventOriginAddress?: string;

  @Field(() => Int, { nullable: true })
  blockNumber?: number;

  @Field(() => String, { nullable: true })
  transactionHash?: string;
}

export function createGenericEntityResolver<T extends ObjectLiteral>(
  entity: Type<T>,
  entityName: string,
): Type<any> {
  // Create a GraphQL type dynamically
  @ObjectType(entityName)
  class EventType {
    @Field(() => ID)
    uniqueEventId: string;

    @Field(() => String)
    eventOriginAddress: string;

    @Field(() => Int)
    blockNumber: number;

    @Field(() => String)
    blockTimestamp: string;

    @Field(() => String)
    transactionHash: string;

    @Field(() => Int)
    logIndex: number;

    @Field(() => Int)
    txIndex: number;

    @Field(() => [String], { nullable: true })
    topics: string[];

    @Field(() => String, { nullable: true })
    logData: string;

    constructor(partial: Partial<any>) {
      Object.assign(this, partial);
    }
  }

  // Get TypeORM metadata
  const metadata = getMetadataArgsStorage();

  // Handle entity-specific fields
  metadata.columns
    .filter((col) => col.target === entity)
    .forEach((column) => {
      if (
        ![
          'uniqueEventId',
          'eventOriginAddress',
          'blockNumber',
          'blockTimestamp',
          'transactionHash',
          'logIndex',
          'txIndex',
          'topics',
          'logData',
        ].includes(column.propertyName)
      ) {
        if (column.options?.type === 'numeric') {
          Field(() => String)(EventType.prototype, column.propertyName);
        } else if (column.options?.type === 'boolean') {
          Field(() => Boolean)(EventType.prototype, column.propertyName);
        } else if (column.options?.array) {
          Field(() => [String])(EventType.prototype, column.propertyName);
        } else {
          Field(() => String)(EventType.prototype, column.propertyName);
        }
      }
    });

  @Resolver(() => EventType)
  class GenericEntityResolver {
    constructor(
      @InjectRepository(entity)
      private readonly repository: Repository<T>,
    ) {}

    @Query(() => [EventType], { name: entityName })
    async findAll(
      @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
      @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
      @Args('filter', { nullable: true, type: () => EventFilterArgs })
      filter?: EventFilterArgs,
    ): Promise<EventType[]> {
      // Convert filter to FindOptionsWhere
      const where: FindOptionsWhere<T> = {};
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          if (value !== undefined) {
            (where as any)[key] = value;
          }
        });
      }

      const entities = await this.repository.find({
        where,
        take: limit,
        skip: offset,
        order: {
          blockNumber: 'DESC',
        } as any,
      });

      return entities.map((e) => new EventType(e));
    }

    @Query(() => EventType, { name: `${entityName}ById` })
    async findOne(@Args('id') id: string): Promise<EventType> {
      const result = await this.repository.findOne({
        where: { uniqueEventId: id } as unknown as FindOptionsWhere<T>,
      });

      if (!result) {
        throw new NotFoundException(`${entityName} with ID ${id} not found`);
      }

      return new EventType(result);
    }
  }

  return GenericEntityResolver;
}
