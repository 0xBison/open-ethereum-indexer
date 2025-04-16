# Basic Example

This example demonstrates a simple indexer configuration for monitoring USDT transfer events on Ethereum. It shows the minimal setup required to get an indexer running.

## Key Components

### 1. Configuration
The example uses a straightforward configuration that:
- Targets the USDT contract (`0xdac17f958d2ee523a2206206994597c13d831ec7`)
- Focuses on a specific block range (22215331)
- Filters out all events except Transfer events

```typescript
export const indexerConfig: IndexerConfig = {
  indexer: {
    network: {
      rpcUrl: process.env.NODE_RPC_URL,
      chainId: parseInt(process.env.NODE_CHAIN_ID),
    },
    contracts: {
      USDT: {
        abi: USDTAbi,
        address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        excludeEvents: [
          'Issue',
          'Redeem',
          'Deprecate',
          'Params',
          'DestroyedBlackFunds',
          'AddedBlackList',
          'RemovedBlackList',
          'Approval',
          'Pause',
          'Unpause',
        ],
        startBlock: 22215331,
      },
    },
  },
  database: {
    migrations: [],
  },
  app: {
    disablePino: false,
    disableBlockMonitorController: false,
    disableRootController: false,
    disableMetrics: true,
  },
};
```

### 2. Event Filtering
Shows how to:
- Focus on specific events by excluding others using `excludeEvents`
- Monitor a precise block range for testing/demonstration
- Configure basic application settings

## Features

1. **Minimal Setup**: Demonstrates the minimum configuration needed for an indexer
2. **Event Filtering**: Shows how to filter out unwanted events
3. **Block Range**: Examples of precise block targeting
4. **Basic Monitoring**: Includes standard monitoring endpoints

## Setup and Usage

1. Copy `.env.example` to `.env` and configure:
```env
NODE_RPC_URL=<your-ethereum-node-url>
NODE_CHAIN_ID=1
```

2. Install dependencies:
```bash
pnpm install
```

3. Run the indexer:
```bash
pnpm start
```

This example serves as a starting point for building more complex indexers, demonstrating the minimal setup required while still including essential monitoring capabilities.