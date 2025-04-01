import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class CoreConfig {
  @IsNumber()
  @Type(() => Number)
  SLEEP_INTERVAL: number;

  @IsNumber()
  @Type(() => Number)
  MAX_BLOCKS_PER_QUERY: number;
}
