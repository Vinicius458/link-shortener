import { Exclude, Expose, Transform } from 'class-transformer';
import { PaginationPresenter } from './pagination.presenter';

export abstract class CollectionPresenter {
  @Exclude()
  protected paginationPresenter?: PaginationPresenter;

  constructor(props?: PaginationPresenter | null) {
    if (props) {
      this.paginationPresenter = new PaginationPresenter(props);
    }
  }

  @Expose({ name: 'meta' })
  @Transform(
    ({ obj }) =>
      obj.paginationPresenter ? obj.paginationPresenter : undefined,
    { toPlainOnly: true },
  )
  get meta() {
    return this.paginationPresenter;
  }
  abstract get data();
}
