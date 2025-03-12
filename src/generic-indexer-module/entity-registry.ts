// A global registry for entities
class EntityRegistry {
  private entities: Map<string, any> = new Map();

  register(entity: any | any[]): void {
    if (Array.isArray(entity)) {
      entity.forEach((e) => this.registerSingleEntity(e));
    } else {
      this.registerSingleEntity(entity);
    }
  }

  private registerSingleEntity(entity: any): void {
    if (!entity) {
      console.warn('Attempted to register undefined or null entity');
      return;
    }

    const entityName = entity.name || 'Unknown';

    // Check if this entity is already registered
    if (this.entities.has(entityName)) {
      return;
    }

    this.entities.set(entityName, entity);
  }

  getAll(): any[] {
    return Array.from(this.entities.values());
  }
}

// Singleton instance
export const entityRegistry = new EntityRegistry();
