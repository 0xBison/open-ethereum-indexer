/* --------------------------------------------------------------------- *\
|  This code was auto-generated by the solidity-event-to-typeorm package. |
|                                                                         |
|  Changes to this file may cause incorrect behavior and will be lost if  |
|  the code is regenerated.                                               |
\* ---------------------------------------------------------------------  */
import { DynamicStructArrayEntity_de916601 } from './DynamicStructArrayEntity_de916601';
import { EventWithStructWithDynamicStructArrayEntity_de916601 } from './EventWithStructWithDynamicStructArrayEntity_de916601';

import {
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'the_struct_de916601' })
export class TheStructEntity_de916601 {
  @PrimaryGeneratedColumn('increment')
  public id: string;

  @OneToMany(
    () => DynamicStructArrayEntity_de916601,
    (dynamicStructArray: DynamicStructArrayEntity_de916601) =>
      dynamicStructArray.theStruct,
    {
      eager: true,
      cascade: true,
    },
  )
  @JoinColumn()
  public dynamicStructArray: DynamicStructArrayEntity_de916601[]; // tuple[]

  @OneToOne(
    () => EventWithStructWithDynamicStructArrayEntity_de916601,
    (
      eventWithStructWithDynamicStructArray: EventWithStructWithDynamicStructArrayEntity_de916601,
    ) => eventWithStructWithDynamicStructArray.theStruct,
  )
  public eventWithStructWithDynamicStructArray: EventWithStructWithDynamicStructArrayEntity_de916601;
}
