import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { BlockIndex } from '../database-module/core/BlockIndex.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Resolver(() => BlockIndex)
export class BlockIndexResolver {
  constructor(
    @InjectRepository(BlockIndex)
    private readonly blockIndexRepository: Repository<BlockIndex>,
  ) {}

  @Query(() => [BlockIndex])
  async blocks(
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<BlockIndex[]> {
    const query = this.blockIndexRepository
      .createQueryBuilder('block')
      .orderBy('block.blockNumber', 'DESC');

    if (limit) {
      query.take(limit);
    }
    if (offset) {
      query.skip(offset);
    }

    return query.getMany();
  }

  @Query(() => BlockIndex, { nullable: true })
  async block(
    @Args('blockNumber', { type: () => Int }) blockNumber: number,
  ): Promise<BlockIndex | null> {
    return this.blockIndexRepository.findOne({
      where: { blockNumber },
    });
  }

  @Query(() => BlockIndex, { nullable: true })
  async latestBlock(): Promise<BlockIndex | null> {
    return this.blockIndexRepository
      .createQueryBuilder('block')
      .orderBy('block.blockNumber', 'DESC')
      .getOne();
  }
}
