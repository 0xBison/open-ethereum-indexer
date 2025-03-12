import {
  Controller,
  Get,
  Query,
  Type,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { Repository, FindOptionsOrder, ObjectLiteral } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiTags } from '@nestjs/swagger';

export interface PaginationQuery {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export function createGenericEntityController<T extends ObjectLiteral>(
  entity: Type<T>,
  entityName: string,
): Type<any> {
  @ApiTags(entityName)
  @Controller(entityName.toLowerCase())
  class GenericEntityController {
    constructor(
      @InjectRepository(entity)
      private readonly repository: Repository<T>,
    ) {}

    @Get()
    async findAll(@Query() query: PaginationQuery): Promise<T[]> {
      const {
        limit = 10,
        offset = 0,
        orderBy,
        orderDirection = 'DESC',
      } = query;

      const order: FindOptionsOrder<T> = {};
      if (orderBy) {
        order[orderBy as keyof T] = orderDirection as any;
      }

      return this.repository.find({
        take: limit,
        skip: offset,
        order: Object.keys(order).length > 0 ? order : undefined,
      });
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<T> {
      const entity = await this.repository.findOne({
        where: { uniqueEventId: id } as any,
      });

      if (!entity) {
        throw new NotFoundException(`${entityName} with ID ${id} not found`);
      }

      return entity;
    }
  }

  return GenericEntityController;
}
