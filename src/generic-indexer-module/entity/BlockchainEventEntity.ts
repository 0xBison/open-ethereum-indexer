import { BeforeInsert, Column, CreateDateColumn, PrimaryColumn } from 'typeorm';
import * as crypto from 'crypto';
import * as constants from './constants';

/**
 * An abstract blockchain event entity which every event that is indexed inherits from.
 */
export abstract class BlockchainEventEntity {
  /**
   * The id of the event in the table. id's are unique to a single table only i.e. 2 separate events
   * in different tables can share an id. The id is auto-incremented.
   */
  @BeforeInsert()
  getUniqueEventId() {
    if (!this.uniqueEventIdOverride) {
      this.uniqueEventId = BlockchainEventEntity.generateEventId(
        this.blockHash,
        this.transactionHash,
        this.txIndex,
        this.logIndex,
      );
    } else {
      this.uniqueEventId = this.uniqueEventIdOverride;
    }
  }

  @PrimaryColumn({
    name: 'unique_event_id',
    type: 'varchar',
    nullable: false,
    unique: true,
    length: 64,
  })
  public uniqueEventId: string;

  @Column({
    name: 'event_origin_address',
    type: 'varchar',
    nullable: false,
    length: constants.BYTES_32_LENGTH,
  })
  public eventOriginAddress: string;

  @CreateDateColumn()
  createdDate: Date;

  @Column({
    name: 'tx_index',
    type: 'numeric',
    precision: constants.UINT_16_MAX_DIGITS,
    nullable: false,
  })
  public txIndex: number;

  @Column({
    name: 'log_index',
    type: 'numeric',
    precision: constants.UINT_16_MAX_DIGITS,
    nullable: false,
  })
  public logIndex: number;

  @Column({
    name: 'log_data',
    type: 'varchar',
    select: false,
  })
  public logData: string;

  @Column({
    name: 'block_hash',
    type: 'varchar',
    nullable: false,
    length: constants.BYTES_32_LENGTH,
  })
  public blockHash: string;

  @Column({ name: 'block_timestamp', type: 'timestamptz', nullable: false })
  public blockTimestamp: string;

  @Column({
    name: 'transaction_hash',
    type: 'varchar',
    nullable: false,
    length: constants.BYTES_32_LENGTH,
  })
  public transactionHash: string;

  @Column({ name: 'topics', type: 'varchar', array: true, select: false })
  public topics: Array<string>;

  static generateEventId(
    blockHash: string,
    transactionHash: string,
    txIndex: number,
    logIndex: number,
  ): string {
    const concatenatedUniqueId = blockHash.concat(
      transactionHash,
      txIndex.toString(),
      logIndex.toString(),
    );

    const uniqueEventId = crypto
      .createHash('sha256')
      .update(concatenatedUniqueId)
      .digest('hex');

    return uniqueEventId;
  }

  // You can set this to override the auto-generated uniqueEventId
  public uniqueEventIdOverride?: string;
}
