import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('/')
export class IndexerController {
  @Get()
  public root() {
    return 'This is the root of the indexer';
  }
}
