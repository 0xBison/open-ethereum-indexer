import { Column, Entity, PrimaryColumn } from 'typeorm';
import * as constants from '../../output/constants';

@Entity({ name: 'example_entity' })
export class ExampleEntity {
  @PrimaryColumn({
    name: 'id',
    type: 'uuid',
    update: false,
  })
  public id: string;

  @Column({
    name: 'example_column_one',
    nullable: false,
    type: 'varchar',
    update: false,
    length: constants.BYTES_32_LENGTH,
  })
  public exampleColumnOne: string;

  @Column({
    name: 'example_column_two',
    nullable: false,
    type: 'numeric',
    precision: constants.UINT_256_MAX_DIGITS,
    update: false,
  })
  public exampleColumnTwo: string;
}
