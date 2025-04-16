interface EntityRegistration {
  entity: any;
  isGeneric: boolean;
}

class EntityRegistry {
  private entities: Map<string, EntityRegistration> = new Map();

  register(entity: any | any[]): void {
    if (Array.isArray(entity)) {
      entity.forEach((e) => this.registerSingleEntity(e, false));
    } else {
      this.registerSingleEntity(entity, false);
    }
  }

  registerGeneric(entity: any | any[]): void {
    if (Array.isArray(entity)) {
      entity.forEach((e) => this.registerSingleEntity(e, true));
    } else {
      this.registerSingleEntity(entity, true);
    }
  }

  private registerSingleEntity(entity: any, isGeneric: boolean): void {
    if (!entity) {
      console.warn('Attempted to register undefined or null entity');
      return;
    }

    const entityName = entity.name || 'Unknown';

    // Update existing registration if it exists
    const existing = this.entities.get(entityName);
    if (existing) {
      // If already registered as generic, keep it generic
      existing.isGeneric = existing.isGeneric || isGeneric;
      return;
    }

    this.entities.set(entityName, { entity, isGeneric });
  }

  getAll(): any[] {
    return Array.from(this.entities.values()).map((reg) => reg.entity);
  }

  getAllGeneric(): any[] {
    return Array.from(this.entities.values())
      .filter((reg) => reg.isGeneric)
      .map((reg) => reg.entity);
  }

  isGenericEntity(entityName: string): boolean {
    return this.entities.get(entityName)?.isGeneric ?? false;
  }

  getEntitiesMap(): Map<string, EntityRegistration> {
    return this.entities;
  }
}

// Singleton instance
export const entityRegistry = new EntityRegistry();
