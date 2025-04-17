# Open Ethereum Indexer

A flexible and modular Ethereum (or any other evm chain) blockchain indexer service built with NestJS that allows you to efficiently index, query, and monitor Ethereum blockchain data.

## Overview

Open Ethereum Indexer is designed to simplify the process of indexing and querying Ethereum (or any other evm chain) blockchain data. It provides a robust framework for monitoring blockchain events and storing indexed data in a structured database for easy access and analysis.

> [!WARNING]
> Since Open Ethereum Indexer is still in development, you should wait until a stable 1.0.0 version is released before using it in production as critical features are not complete (reorg support) and the API is subject to change

## Features

- **Modular Architecture**: Built with NestJS. Follows a modular design pattern for easy extension and customization. Allows you to register block and event handlers for any
- **EVM Network Support**: Supports any network (including custom networks) as long as they conform to the Ethereum JSON RPC Specification
- **Event-Based Indexing**: Index specific events from smart contracts with customizable handlers
- **Block Monitoring**: Track new blocks and process blockchain data in real-time
- **Metrics & Monitoring**: Built-in Prometheus integration for monitoring system metrics
- **RESTful API**: Query indexed data through a REST API
- **GraphQL API**: Experimental.
- **Reorg handling**: Coming soon
- **Websocket API**: Coming soon
- **Frontend**: Coming soon
- **Type-safe Handlers**: Coming soon

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v20+)
- **PostgreSQL** (using Docker is recommended)
- **Access to an Ethereum node** via RPC URL (e.g., from Alchemy, or your own node)

## Getting Started

### Creating a New Project

The easiest way to get started is to use the NestJS CLI:

1. Install the NestJS CLI:
```bash
pnpm install -g @nestjs/cli
```

2. Create a new project:
```bash
nest new my-indexer
```

3. Install the Open Ethereum Indexer package and typeorm:
```bash
pnpm install @open-ethereum/indexer typeorm
```

### Basic Configuration

Create your indexer configuration (`src/indexer.config.ts`):

```typescript
import { IndexerConfig } from '@open-ethereum/indexer';
import ERC20_ABI from './abis/ERC20.json';

export const indexerConfig: IndexerConfig = {
  indexer: {
    network: {
      rpcUrl: process.env.NODE_RPC_URL,
      chainId: parseInt(process.env.CHAIN_ID),
    },
    contracts: {
      USDT: {
        abi: ERC20_ABI,
        address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        startBlock: 22215331,
      },
    },
  },
  database: {
    migrations: [],
  },
};
```

### Working with Entities

There are two approaches to working with entities:

#### 1. Manual Entity Definition

Create and register your entities manually:

```typescript
// entities/Transfer.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Transfer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  from: string;

  @Column()
  to: string;

  @Column('varchar')
  value: string;

  @Column('int')
  blockNumber: number;
}
```

Register your entities (`src/entity-registration.ts`):
```typescript
import { entityRegistry } from '@open-ethereum/indexer';
import { Transfer } from './entities/Transfer.entity';

export const entities = [Transfer];

// Register all entities
Object.keys(entities).forEach((key) => {
  const entity = entities[key];
  if (entity && typeof entity === 'function') {
    entityRegistry.register(entity);
  }
});
```

This MUST be imported into your `src/main.ts` file.

#### 2. Automatic Entity Generation

For simpler use cases, you can automatically generate entities from contract ABIs using the [solidity-events-to-typeorm](https://github.com/0xBison/solidity-events-to-typeorm) utility:

1. Install the utility:
```bash
pnpm install -D solidity-events-to-typeorm
```

2. Create a generation script (`scripts/generate.ts`):
```typescript
import { Config, generate } from 'solidity-events-to-typeorm';
import * as path from 'path';
import ContractABI from '../src/abi/contract.json';

const outputPath = path.resolve(__dirname, '../src/output/');

export const config: Config = {
  output: {
    path: outputPath,
    entities: path.resolve(outputPath, './entities/'),
    abis: path.resolve(outputPath, './abi/'),
  },
  migrations: {
    path: path.resolve(outputPath, './migrations/'),
    migrationName: 'InitialSchema',
    schemaName: 'SQL_SCHEMA',
    schemaVariable: true,
  },
  contracts: {
    YourContract: {
      abi: ContractABI,
    },
  },
};

generate(config);
```

3. Update your indexer config to use the generated entities:
```typescript
import { IndexerConfig } from '@open-ethereum/indexer';
import { InitialSchema } from './output/migrations/InitialSchema';

export const indexerConfig: IndexerConfig = {
  // ... network config ...
  database: {
    migrations: [InitialSchema],
  },
};
```

With this approach, you don't need to write event handlers - events are automatically indexed as they appear on-chain!

### Event Handlers (For Manual Entities)

If using manual entities, create event handlers to process blockchain events:

```typescript
import { onEvent } from '@open-ethereum/indexer';
import { Transfer } from './entities/Transfer.entity';

onEvent('USDT:Transfer', {
  onIndex: async (payload, context) => {
    const { from, to, value } = payload.parsedEvent.args;

    const { moduleRef, entityManager } = context;

    const transferRepo = entityManager.getRepository(Transfer);

    const transfer = new Transfer();
    transfer.from = from;
    transfer.to = to;
    transfer.value = value.toString();
    transfer.blockNumber = payload.block.number;

    await transferRepo.save(transfer);
  },
});
```

## Documentation

For comprehensive documentation, including:
- Detailed setup instructions
- Advanced configuration options
- Complete API reference
- Examples and use cases
- Best practices for entity management
- Event handling patterns
- Generic indexing features

Please visit the documentation at [https://openethereumindexer.com/](https://openethereumindexer.com/) and check out the [examples](https://github.com/0xBison/open-ethereum-indexer/tree/main/examples)

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://openethereumindexer.com/contributing) for details.

## License

MIT