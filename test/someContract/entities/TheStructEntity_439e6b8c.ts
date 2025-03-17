/* --------------------------------------------------------------------- *\
|  This code was auto-generated by the solidity-event-to-typeorm package. |
|                                                                         |
|  Changes to this file may cause incorrect behavior and will be lost if  |
|  the code is regenerated.                                               |
\* ---------------------------------------------------------------------  */
import { Uint64ArrayEntity_439e6b8c } from './Uint64ArrayEntity_439e6b8c';
import { DynamicArrayEntity_439e6b8c } from './DynamicArrayEntity_439e6b8c';
import { EventWithStructWithArraysEntity_439e6b8c } from './EventWithStructWithArraysEntity_439e6b8c';

import {
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'the_struct_439e6b8c' })
export class TheStructEntity_439e6b8c {
  @PrimaryGeneratedColumn('increment')
  public id: string;

  @OneToMany(
    () => Uint64ArrayEntity_439e6b8c,
    (uint64Array: Uint64ArrayEntity_439e6b8c) => uint64Array.theStruct,
    {
      eager: true,
      cascade: true,
    },
  )
  @JoinColumn()
  public uint64Array: Uint64ArrayEntity_439e6b8c[]; // uint64[3]

  @OneToMany(
    () => DynamicArrayEntity_439e6b8c,
    (dynamicArray: DynamicArrayEntity_439e6b8c) => dynamicArray.theStruct,
    {
      eager: true,
      cascade: true,
    },
  )
  @JoinColumn()
  public dynamicArray: DynamicArrayEntity_439e6b8c[]; // uint64[]

  @OneToOne(
    () => EventWithStructWithArraysEntity_439e6b8c,
    (eventWithStructWithArrays: EventWithStructWithArraysEntity_439e6b8c) =>
      eventWithStructWithArrays.theStruct,
  )
  public eventWithStructWithArrays: EventWithStructWithArraysEntity_439e6b8c;
}
