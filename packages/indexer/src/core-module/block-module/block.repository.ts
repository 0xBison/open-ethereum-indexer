import { Repository } from 'typeorm';
import { BlockIndex } from '../../database-module/core/BlockIndex.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class BlockRepository extends Repository<BlockIndex> {
  constructor(
    @InjectRepository(BlockIndex)
    repository: Repository<BlockIndex>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findBlocksInRange(
    from?: number,
    to?: number,
    limit: number = 1000,
  ): Promise<BlockIndex[]> {
    const queryBuilder = this.createQueryBuilder('block')
      .orderBy('block.blockNumber', 'DESC')
      .take(limit);

    if (from !== undefined) {
      queryBuilder.andWhere('block.blockNumber >= :from', { from });
    }
    if (to !== undefined) {
      queryBuilder.andWhere('block.blockNumber <= :to', { to });
    }

    return queryBuilder.getMany();
  }

  async findRecentBlocks(limit: number = 1000): Promise<BlockIndex[]> {
    return this.createQueryBuilder('block')
      .orderBy('block.blockNumber', 'DESC')
      .take(limit)
      .getMany();
  }
}
