/* --------------------------------------------------------------------- *\
|  This code was auto-generated by the solidity-event-to-typeorm package. |
|                                                                         |
|  Changes to this file may cause incorrect behavior and will be lost if  |
|  the code is regenerated.                                               |
\* ---------------------------------------------------------------------  */
import { TheStructEntity_68e489fd } from './TheStructEntity_68e489fd';

import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { BlockchainEventEntity } from './BlockchainEventEntity';

@Entity({ name: 'event_with_struct_with_fixed_struct_array_68e489fd' })
export class EventWithStructWithFixedStructArrayEntity_68e489fd extends BlockchainEventEntity {
  @OneToOne(
    () => TheStructEntity_68e489fd,
    (theStruct: TheStructEntity_68e489fd) =>
      theStruct.eventWithStructWithFixedStructArray,
    {
      eager: true,
      cascade: true,
    },
  )
  @JoinColumn()
  public theStruct: TheStructEntity_68e489fd; // tuple
}
