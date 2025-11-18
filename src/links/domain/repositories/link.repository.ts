import { LinkEntity } from '@/links/domain/entities/link.entity';

export namespace LinkRepository {
  export interface Repository {
    insert(entity: LinkEntity): Promise<void>;
    update(entity: LinkEntity): Promise<void>;
    findById(id: string): Promise<LinkEntity>;
    findByAlias(alias: string): Promise<LinkEntity>;
    findByShortCode(shortCode: string): Promise<LinkEntity>;
    existsShortCode(shortCode: string): Promise<boolean>;
    findAllByOwner(ownerId: string): Promise<LinkEntity[]>;
    findByOriginalUrlAndOwnerId(
      url: string,
      ownerId: string | null,
    ): Promise<LinkEntity | null>;
    findAll(): Promise<LinkEntity[]>;
    delete(id: string): Promise<void>;
  }
}
