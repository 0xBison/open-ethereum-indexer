import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { entityRegistry } from './entity-registry';

@ApiTags('Events')
@Controller('events')
export class EntityListController {
  @Get()
  @ApiOperation({ summary: 'Get a list of all registered entities' })
  getEntities(): string[] {
    const entities = entityRegistry.getAll();
    return entities.map((entity) => entity.name.replace('Entity', ''));
  }
}
