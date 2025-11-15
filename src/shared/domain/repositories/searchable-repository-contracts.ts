import { Entity } from '../entities/entity';
import { RepositoryInterface } from './repository-contracts';

export type SortDirection = 'asc' | 'desc';

export type SearchProps<Filter = string> = {
  page?: number;
  perPage?: number;
  sort?: string | null;
  sortDir?: SortDirection | null;
  filter?: Filter | null;
};

export type SearchResultProps<E extends Entity, Filter> = {
  items: E[];
  total: number;
  currentPage: number;
  perPage: number;
  sort: string | null;
  sortDir: string | null;
  filter: Filter | null;
};

export class SearchParams<Filter = string> {
  protected _page: number = 1;
  protected _perPage: number = 15;
  protected _sort: string | null;
  protected _sortDir: SortDirection | null;
  protected _filter: Filter | null;

  constructor(props: SearchProps<Filter> = {}) {
    this.page = props.page;
    this.perPage = props.perPage;
    this.sort = props.sort;
    this.sortDir = props.sortDir;
    this.filter = props.filter;
  }

  get page() {
    return this._page;
  }

  private set page(value: number | undefined) {
    let parsed = Number(value);

    if (Number.isNaN(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
      parsed = 1;
    }

    this._page = parsed;
  }

  get perPage() {
    return this._perPage;
  }

  private set perPage(value: number | undefined) {
    if (typeof value === 'boolean') {
      this._perPage = 15;
      return;
    }
    let parsed = Number(value);
    if (Number.isNaN(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
      parsed = 15;
    }

    this._perPage = parsed;
  }

  get sort() {
    return this._sort;
  }

  private set sort(value: string | null) {
    this._sort =
      value === null || value === undefined || value === '' ? null : `${value}`;
  }

  get sortDir() {
    return this._sortDir;
  }

  private set sortDir(value: string | null | undefined) {
    if (!this._sort) {
      this._sortDir = null;
      return;
    }

    const normalized = String(value).toLowerCase();

    this._sortDir =
      normalized === 'asc' || normalized === 'desc'
        ? (normalized as SortDirection)
        : 'desc';
  }

  get filter(): Filter | null {
    return this._filter;
  }

  private set filter(value: Filter | null | undefined) {
    this._filter =
      value === null || value === undefined || value === ''
        ? null
        : (`${value}` as any);
  }
}

export class SearchResult<E extends Entity, Filter = string> {
  readonly items: E[];
  readonly total: number;
  readonly currentPage: number;
  readonly perPage: number;
  readonly lastPage: number;
  readonly sort: string | null;
  readonly sortDir: string | null;
  readonly filter: Filter | null;

  constructor(props: SearchResultProps<E, Filter>) {
    this.items = props.items;
    this.total = props.total;
    this.currentPage = props.currentPage;
    this.perPage = props.perPage;
    this.lastPage = Math.ceil(this.total / this.perPage);
    this.sort = props.sort ?? null;
    this.sortDir = props.sortDir ?? null;
    this.filter = props.filter ?? null;
  }

  toJSON(forceEntity = false) {
    return {
      items: forceEntity ? this.items.map(item => item.toJSON()) : this.items,
      total: this.total,
      currentPage: this.currentPage,
      perPage: this.perPage,
      lastPage: this.lastPage,
      sort: this.sort,
      sortDir: this.sortDir,
      filter: this.filter,
    };
  }
}

export interface SearchableRepositoryInterface<
  E extends Entity,
  Filter = string,
  SearchInput = SearchParams<Filter>,
  SearchOutput = SearchResult<E, Filter>,
> extends RepositoryInterface<E> {
  sortableFields: string[];

  search(props: SearchInput): Promise<SearchOutput>;
}
