import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockRepository } from './block.repository';
import { BlockIndex } from '../../database-module/core/BlockIndex.entity';
import { EntityManager } from 'typeorm';

describe('BlockRepository', () => {
  let repository: BlockRepository;
  let entityManager: EntityManager;
  let moduleRef: TestingModule;

  const mockBlocks: BlockIndex[] = [
    {
      id: 1,
      blockNumber: 100,
      processedAt: new Date(),
      undoOperations: '',
    },
    {
      id: 2,
      blockNumber: 99,
      processedAt: new Date(),
      undoOperations: '',
    },
  ];

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [BlockIndex],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([BlockIndex]),
      ],
      providers: [BlockRepository],
    }).compile();

    repository = moduleRef.get<BlockRepository>(BlockRepository);
    entityManager = moduleRef.get<EntityManager>(EntityManager);

    // Seed the database with test data
    await entityManager.save(BlockIndex, mockBlocks);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  describe('findBlocksInRange', () => {
    it('should return blocks within range', async () => {
      const result = await repository.findBlocksInRange(99, 100);
      expect(result).toHaveLength(2);
      expect(result[0].blockNumber).toBe(100);
      expect(result[1].blockNumber).toBe(99);
    });

    it('should add where clauses when range is provided', async () => {
      const result = await repository.findBlocksInRange(99, 99);
      expect(result).toHaveLength(1);
      expect(result[0].blockNumber).toBe(99);
    });
  });

  describe('findRecentBlocks', () => {
    it('should return recent blocks', async () => {
      const result = await repository.findRecentBlocks();
      expect(result).toHaveLength(2);
      expect(result[0].blockNumber).toBe(100);
      expect(result[1].blockNumber).toBe(99);
    });

    it('should respect the limit parameter', async () => {
      const result = await repository.findRecentBlocks(1);
      expect(result).toHaveLength(1);
      expect(result[0].blockNumber).toBe(100);
    });
  });
});
