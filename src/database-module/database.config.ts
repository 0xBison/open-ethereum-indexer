import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class DatabaseConfig {
  @IsString()
  SQL_HOST: string;

  @IsNumber()
  @Type(() => Number)
  SQL_PORT: number;

  @IsString()
  SQL_USERNAME: string;

  @IsString()
  SQL_PASSWORD: string;

  @IsString()
  SQL_DB: string;

  @IsString()
  SQL_SCHEMA: string;
}
