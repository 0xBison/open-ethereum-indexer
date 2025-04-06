/* --------------------------------------------------------------------- *\
|  This code was auto-generated by the solidity-event-to-typeorm package. |
|                                                                         |
|  Changes to this file may cause incorrect behavior and will be lost if  |
|  the code is regenerated.                                               |
\* ---------------------------------------------------------------------  */

import { Column, Entity } from 'typeorm';
import { BlockchainEventEntity } from './BlockchainEventEntity';

@Entity({ name: 'action_paused_87ed0813' })
export class ActionPausedEntity_87ed0813 extends BlockchainEventEntity {
  @Column({
    name: 'action',
    nullable: false,
    type: 'varchar',
    update: false,
  })
  public action: string; // string

  @Column({
    name: 'pause_state',
    nullable: false,
    type: 'boolean',
    update: false,
  })
  public pauseState: boolean; // bool
}
