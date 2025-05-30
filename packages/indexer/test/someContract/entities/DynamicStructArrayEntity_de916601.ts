/* --------------------------------------------------------------------- *\
|  This code was auto-generated by the solidity-event-to-typeorm package. |
|                                                                         |
|  Changes to this file may cause incorrect behavior and will be lost if  |
|  the code is regenerated.                                               |
\* ---------------------------------------------------------------------  */
import { TheStructEntity_de916601 } from './TheStructEntity_de916601';

import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import * as constants from '../constants';

@Entity({ name: 'dynamic_struct_array_de916601' })
export class DynamicStructArrayEntity_de916601 {
  @PrimaryGeneratedColumn('increment')
  public id: string;

  @Column({
    name: 'a',
    nullable: false,
    type: 'numeric',
    precision: constants.UINT_256_MAX_DIGITS,
    update: false,
  })
  public a: string; // uint

  @Column({
    name: 'b',
    nullable: false,
    type: 'numeric',
    precision: constants.UINT_256_MAX_DIGITS,
    update: false,
  })
  public b: string; // uint

  @ManyToOne(
    () => TheStructEntity_de916601,
    (theStruct: TheStructEntity_de916601) => theStruct.dynamicStructArray,
  )
  public theStruct: TheStructEntity_de916601;
}
