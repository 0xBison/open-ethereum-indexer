import { Config, generate } from 'solidity-events-to-typeorm';
import * as path from 'path';
import ComptrollerImplementation from '../src/abi/implementation.json';

const outputPath = path.resolve(__dirname, './output/');

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
  docs: {
    path: path.resolve(outputPath, './docs/'),
  },
  contracts: {
    ComptrollerProxy: {
      abi: ComptrollerImplementation,
    },
  },
};

generate(config).catch((err) => {
  console.error('Fatal error during generation:', err);
  process.exit(1);
});
