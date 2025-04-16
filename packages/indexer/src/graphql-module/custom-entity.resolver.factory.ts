import { Type } from '@nestjs/common';
import { Resolver, Query, Args, Int, Field, ObjectType } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';
import { getMetadataArgsStorage } from 'typeorm';

export function createCustomEntityResolver<T extends ObjectLiteral>(
  entity: Type<T>,
  entityName: string,
): Type<any> {
  // Create a GraphQL type dynamically
  @ObjectType(entityName)
  class CustomType {
    constructor(partial: Partial<any>) {
      Object.assign(this, partial);
    }
  }

  // Get TypeORM metadata and add fields
  const metadata = getMetadataArgsStorage();
  metadata.columns
    .filter((col) => col.target === entity)
    .forEach((column) => {
      if (
        column.options?.type === 'numeric' ||
        column.options?.type === 'bigint'
      ) {
        Field(() => Int)(CustomType.prototype, column.propertyName);
      } else if (column.options?.type === 'boolean') {
        Field(() => Boolean)(CustomType.prototype, column.propertyName);
      } else if (column.options?.array) {
        Field(() => [String])(CustomType.prototype, column.propertyName);
      } else {
        Field(() => String)(CustomType.prototype, column.propertyName);
      }
    });

  @Resolver(() => CustomType)
  class CustomEntityResolver {
    constructor(
      @InjectRepository(entity)
      private readonly repository: Repository<T>,
    ) {}

    @Query(() => [CustomType], { name: entityName })
    async findAll(
      @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
      @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    ): Promise<CustomType[]> {
      const entities = await this.repository.find({
        take: limit,
        skip: offset,
        order: {
          id: 'DESC',
        } as any,
      });

      return entities.map((e) => new CustomType(e));
    }
  }

  return CustomEntityResolver;
}
