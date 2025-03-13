import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { LoggerService } from '@nestjs/common';

@Entity()
export class A {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  value1: number;

  @Column()
  value2: number;
}

@Entity()
export class B {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  value1: number;

  @Column()
  value2: number;
}

@Entity()
export class C {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  value1: number;

  @Column()
  value2: number;
}

@Entity()
export class BlockIndex {
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
export class TestLogger implements LoggerService {
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
