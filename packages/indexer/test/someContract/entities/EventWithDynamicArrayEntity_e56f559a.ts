/* --------------------------------------------------------------------- *\
|  This code was auto-generated by the solidity-event-to-typeorm package. |
|                                                                         |
|  Changes to this file may cause incorrect behavior and will be lost if  |
|  the code is regenerated.                                               |
\* ---------------------------------------------------------------------  */
import { DynamicArrayEntity_e56f559a } from './DynamicArrayEntity_e56f559a';

import { Entity, JoinColumn, OneToMany } from 'typeorm';
import { BlockchainEventEntity } from './BlockchainEventEntity';

@Entity({ name: 'event_with_dynamic_array_e56f559a' })
export class EventWithDynamicArrayEntity_e56f559a extends BlockchainEventEntity {
  @OneToMany(
    () => DynamicArrayEntity_e56f559a,
    (dynamicArray: DynamicArrayEntity_e56f559a) =>
      dynamicArray.eventWithDynamicArray,
    {
      eager: true,
      cascade: true,
    },
  )
  @JoinColumn()
  public dynamicArray: DynamicArrayEntity_e56f559a[]; // uint64[]
}
