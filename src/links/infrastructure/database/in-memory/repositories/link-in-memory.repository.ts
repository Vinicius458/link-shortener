import { NotFoundError } from '@/shared/domain/errors/not-found-error';
import { InMemorySearchableRepository } from '@/shared/domain/repositories/in-memory-searchable.repository';
import { SortDirection } from '@/shared/domain/repositories/searchable-repository-contracts';
import { LinkEntity } from '@/links/domain/entities/link.entity';
import { LinkRepository } from '@/links/domain/repositories/link.repository';

export class LinkInMemoryRepository implements LinkRepository.Repository {
  sortableFields: string[] = ['createdAt', 'clicks'];
  public items: LinkEntity[] = [];

  async findByShortCode(shortCode: string): Promise<LinkEntity> {
    const entity = this.items.find(item => item.shortCode === shortCode);

    if (!entity) {
      throw new NotFoundError(`Entity not found using shortCode ${shortCode}`);
    }

    return entity;
  }

  async findByOriginalUrlAndOwnerId(
    url: string,
    ownerId: string | null,
  ): Promise<LinkEntity | null> {
    const entity = this.items.find(
      item => item.originalUrl === url && item.ownerId === ownerId,
    );

    return entity || null;
  }

  async existsShortCode(shortCode: string): Promise<boolean> {
    return !!this.items.find(item => item.shortCode === shortCode);
  }

  async insert(entity: LinkEntity): Promise<void> {
    this.items.push(entity);
  }

  async findById(id: string): Promise<LinkEntity> {
    const entity = this.items.find(item => item._id === id);

    if (!entity) {
      throw new NotFoundError(`Entity not found using ID ${id}`);
    }

    return entity;
  }

  async findByAlias(alias: string): Promise<LinkEntity> {
    const entity = this.items.find(item => item.shortCode === alias);

    if (!entity) {
      throw new NotFoundError(`Entity not found using shortCode ${alias}`);
    }

    return entity;
  }

  async findAll(): Promise<LinkEntity[]> {
    return this.items.filter(item => item.deletedAt === null);
  }

  async update(entity: LinkEntity): Promise<void> {
    const index = this.items.findIndex(item => item._id === entity._id);

    if (index < 0) {
      throw new NotFoundError(`Entity not found using ID ${entity._id}`);
    }

    this.items[index] = entity;
  }

  async delete(id: string): Promise<void> {
    const entity = await this.findById(id);
    entity.softDelete();

    await this.update(entity);
  }

  async incrementClicks(id: string): Promise<void> {
    const entity = await this.findById(id);
    entity.incrementClicks();

    await this.update(entity);
  }

  async findAllByOwner(ownerId: string): Promise<LinkEntity[]> {
    return this.items.filter(
      item => item.ownerId === ownerId && item.deletedAt === null,
    );
  }
}
