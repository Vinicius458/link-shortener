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
    create(link: LinkEntity): Promise<void>;
    findByShortCode(shortCode: string): Promise<LinkEntity | null>;
    findById(id: string): Promise<LinkEntity | null>;
    incrementClicks(id: string): Promise<void>;
    findAllByOwner(ownerId: string): Promise<LinkEntity[]>;
    update(link: LinkEntity): Promise<void>;
    softDelete(id: string): Promise<void>;
    existsShortCode(shortCode: string): Promise<boolean>;
  }
}
