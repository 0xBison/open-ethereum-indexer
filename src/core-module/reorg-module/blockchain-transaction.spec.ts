import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockchainTransactionService } from './blockchain-transaction.service';
import { BlockchainReorgService } from './blockchain-reorg.service';
import { Entity, Column, PrimaryGeneratedColumn, EntityManager } from 'typeorm';
import { Logger, LoggerService } from '@nestjs/common';

@Entity()
class A {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  value1: number;

  @Column()
  value2: number;
}

@Entity()
class B {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  value1: number;

  @Column()
  value2: number;
}

@Entity()
class C {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  value1: number;

  @Column()
  value2: number;
}

@Entity()
class BlockIndex {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  blockNumber: number;

  @Column()
  processedAt: Date;

  @Column('text')
  undoOperations: string;
}

// Custom logger for tests
class TestLogger implements LoggerService {
  log(message: any, context?: string) {
    console.log(`[${context || 'LOG'}] ${message}`);
  }

  error(message: any, trace?: string, context?: string) {
    console.error(`[${context || 'ERROR'}] ${message}`, trace || '');
  }

  warn(message: any, context?: string) {
    console.warn(`[${context || 'WARN'}] ${message}`);
  }

  debug(message: any, context?: string) {
    console.debug(`[${context || 'DEBUG'}] ${message}`);
  }

  verbose(message: any, context?: string) {
    console.log(`[${context || 'VERBOSE'}] ${message}`);
  }
}

describe('Blockchain Services', () => {
  let transactionService: BlockchainTransactionService;
  let reorgService: BlockchainReorgService;
  let entityManager: EntityManager;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [A, B, C, BlockIndex],
          synchronize: true,
          logging: false, // Set to true for debugging
        }),
        TypeOrmModule.forFeature([A, B, C, BlockIndex]),
      ],
      providers: [
        BlockchainTransactionService,
        BlockchainReorgService,
        {
          provide: Logger,
          useClass: TestLogger,
        },
      ],
    }).compile();

    transactionService = moduleRef.get<BlockchainTransactionService>(
      BlockchainTransactionService,
    );
    reorgService = moduleRef.get<BlockchainReorgService>(
      BlockchainReorgService,
    );
    entityManager = moduleRef.get<EntityManager>(EntityManager);
  });

  it('should process and revert blocks with entity operations', async () => {
    console.log('\n--- Block Monitor Demo ---');

    // Process block 1
    const blockResult = await reorgService.processBlock(1, async () => {
      // The transaction service is already set up with the transaction manager
      // No need to reset undo operations as it's handled by the reorg service

      // Store A
      await transactionService.storeEntity<A>({ value1: 1, value2: 2 }, A);

      // Store B
      await transactionService.storeEntity<B>({ value1: 3, value2: 4 }, B);

      // No need to return undo operations - they're collected automatically
    });

    console.log('Block 1 processing result:', blockResult);

    // Process block 2
    const block2Result = await reorgService.processBlock(2, async () => {
      // Store C
      await transactionService.storeEntity<C>({ value1: 1, value2: 3 }, C);

      // Edit A
      await transactionService.editEntity<A>(1, { value1: 9, value2: 9 }, A);
    });

    console.log('Block 2 processing result:', block2Result);

    // Process block 3
    const block3Result = await reorgService.processBlock(3, async () => {
      // Delete B
      await transactionService.deleteEntity<B>(1, B);
    });

    console.log('Block 3 processing result:', block3Result);

    // Verify entities after processing all blocks
    console.log('\n--- Verifying Entities After Processing ---');

    const aEntities = await entityManager.find(A);
    console.log('A entities:', aEntities);

    const bEntities = await entityManager.find(B);
    console.log('B entities:', bEntities);

    const cEntities = await entityManager.find(C);
    console.log('C entities:', cEntities);

    // Simulate reorg by reverting blocks in reverse order
    console.log('\n--- Simulating Reorg: Reverting Blocks 3, 2, 1 ---');

    // Revert block 3
    const revertBlock3Result = await reorgService.revertBlock(3);
    console.log('Revert Block 3 Result:', revertBlock3Result);

    // Revert block 2
    const revertBlock2Result = await reorgService.revertBlock(2);
    console.log('Revert Block 2 Result:', revertBlock2Result);

    // Revert block 1
    const revertBlock1Result = await reorgService.revertBlock(1);
    console.log('Revert Block 1 Result:', revertBlock1Result);

    // Verify entities after reverting all blocks
    console.log('\n--- Verifying Entities After Reorg ---');

    const aEntitiesAfterReorg = await entityManager.find(A);
    console.log('A entities after reorg:', aEntitiesAfterReorg);

    const bEntitiesAfterReorg = await entityManager.find(B);
    console.log('B entities after reorg:', bEntitiesAfterReorg);

    const cEntitiesAfterReorg = await entityManager.find(C);
    console.log('C entities after reorg:', cEntitiesAfterReorg);
  }, 30000);

  it('should demonstrate how developers would use the transaction service', async () => {
    console.log('\n--- Developer API Demo ---');

    // This test won't work correctly without a transaction context
    // In a real application, developers would only use the transaction service
    // within a processBlock callback

    // Let's simulate a transaction context by processing a block
    await reorgService.processBlock(999, async () => {
      console.log('Inside transaction context');

      // Store an entity
      const storeResult = await transactionService.storeEntity<A>(
        { value1: 100, value2: 200 },
        A,
      );
      console.log('Store result:', storeResult);

      // Edit an entity (will fail since we just created it and don't know the ID)
      try {
        // Find the entity we just created to get its ID
        const entity = await entityManager.findOne(A, {
          where: { value1: 100, value2: 200 },
        });

        if (entity) {
          const editResult = await transactionService.editEntity<A>(
            entity.id,
            { value1: 300 },
            A,
          );
          console.log('Edit result:', editResult);
        }
      } catch (error) {
        console.log('Edit operation failed:', error.message);
      }

      // Delete the entity
      try {
        // Find the entity again to get its ID
        const entity = await entityManager.findOne(A, {
          where: { value1: 300, value2: 200 },
        });

        if (entity) {
          const deleteResult = await transactionService.deleteEntity<A>(
            entity.id,
            A,
          );
          console.log('Delete result:', deleteResult);
        }
      } catch (error) {
        console.log('Delete operation failed:', error.message);
      }
    });

    // Get the undo operations (this would be used by the block monitor)
    console.log(
      'Collected undo operations would be available to the reorg service',
    );
  }, 30000);
});
