/* --------------------------------------------------------------------- *\
|  This code was auto-generated by the solidity-event-to-typeorm package. |
|                                                                         |
|  Changes to this file may cause incorrect behavior and will be lost if  |
|  the code is regenerated.                                               |
\* ---------------------------------------------------------------------  */
import { StructArrayEntity_68e489fd } from './StructArrayEntity_68e489fd';
import { EventWithStructWithFixedStructArrayEntity_68e489fd } from './EventWithStructWithFixedStructArrayEntity_68e489fd';

import {
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'the_struct_68e489fd' })
export class TheStructEntity_68e489fd {
  @PrimaryGeneratedColumn('increment')
  public id: string;

  @OneToMany(
    () => StructArrayEntity_68e489fd,
    (structArray: StructArrayEntity_68e489fd) => structArray.theStruct,
    {
      eager: true,
      cascade: true,
    },
  )
  @JoinColumn()
  public structArray: StructArrayEntity_68e489fd[]; // tuple[2]

  @OneToOne(
    () => EventWithStructWithFixedStructArrayEntity_68e489fd,
    (
      eventWithStructWithFixedStructArray: EventWithStructWithFixedStructArrayEntity_68e489fd,
    ) => eventWithStructWithFixedStructArray.theStruct,
  )
  public eventWithStructWithFixedStructArray: EventWithStructWithFixedStructArrayEntity_68e489fd;
}
