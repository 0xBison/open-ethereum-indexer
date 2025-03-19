# Open Ethereum Indexer

A flexible and modular Ethereum (or any other evm chain) blockchain indexer service built with NestJS that allows you to efficiently index, query, and monitor Ethereum blockchain data.

## Overview

Open Ethereum Indexer is designed to simplify the process of indexing and querying Ethereum (or any other evm chain) blockchain data. It provides a robust framework for monitoring blockchain events and storing indexed data in a structured database for easy access and analysis.

## Features

- **Modular Architecture**: Built with NestJS. Follows a modular design pattern for easy extension and customization. Allows you to register block and event handlers for any
- **EVM Network Support**: Supports many networks (and custom networks) as long as they conform to the Ethereum JSON RPC Specification
- **Event-Based Indexing**: Index specific events from smart contracts with customizable handlers
- **Block Monitoring**: Track new blocks and process blockchain data in real-time
- **Metrics & Monitoring**: Built-in Prometheus integration for monitoring system metrics
- **RESTful API**: Query indexed data through a REST API
- **Reorg handling**: Coming soon
- **Websocket API**: Coming soon
- **GraphQL API**: Coming soon
- **Frontend**: Coming soon
- **Type-safe Handlers**: Coming soon

## Prerequisites

- Node.js (v20+)
- PostgreSQL
- Access to an Ethereum node (via RPC URL)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/open-ethereum-indexer.git
   cd open-ethereum-indexer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your specific configuration.

## Configuration

The following environment variables can be configured:

```bash
PORT=3033                  # API server port
METRICS_PORT=3066          # Prometheus metrics port

# Database config
SQL_DB="db_name"           # PostgreSQL database name
SQL_USERNAME="db_username" # Database username
SQL_PASSWORD="db_password" # Database password
SQL_HOST="localhost"       # Database host
SQL_PORT=5432              # Database port
SQL_SCHEMA="db_schema"     # Database schema

# Block monitor config
SLEEP_INTERVAL=1000        # Interval between block checks (ms)
MAX_BLOCKS_PER_QUERY=10    # Maximum blocks to process in one query
```

## Usage

### Starting the Service

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### Indexing Events

The indexer can be configured to monitor specific smart contract events. Example configuration in `app.module.ts`:

```typescript
// Register event handlers
onEvent('*:*', {
  onIndex: async (payload) => {
    console.log('ON EVENT');
    // Process event data
  },
});

// Register block handlers
onBlock({
  onIndex: async (payload) => {
    console.log('ON BLOCK');
    // Process block data
  },
});
```