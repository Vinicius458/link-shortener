import { LinkEntity } from '@/links/domain/entities/link.entity';
import {
  SearchParams as DefaultSearchParams,
  SearchResult as DefaultSearchResult,
  SearchableRepositoryInterface,
} from '@/shared/domain/repositories/searchable-repository-contracts';

export namespace LinkRepository {
  export type Filter = string;

  export class SearchParams extends DefaultSearchParams<Filter> {}

  export class SearchResult extends DefaultSearchResult<LinkEntity, Filter> {}

  export interface Repository
    extends SearchableRepositoryInterface<
      LinkEntity,
      Filter,
      SearchParams,
      SearchResult
    > {
    insert(entity: LinkEntity): Promise<void>;
    update(entity: LinkEntity): Promise<void>;
    findById(id: string): Promise<LinkEntity>;
    findByShortCode(shortCode: string): Promise<LinkEntity>;
    existsShortCode(shortCode: string): Promise<boolean>;
    incrementClicks(id: string): Promise<void>;
    findAllByOwner(ownerId: string): Promise<LinkEntity[]>;
    findAll(): Promise<LinkEntity[]>;
    delete(id: string): Promise<void>;
  }
}
