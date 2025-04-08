import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockController } from './block.controller';
import { BlockService } from './block.service';
import { BlockRepository } from './block.repository';
import { BlockIndex } from '../../database-module/core/BlockIndex.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BlockIndex])],
  controllers: [BlockController],
  providers: [BlockService, BlockRepository],
  exports: [BlockService],
})
export class BlockModule {}
