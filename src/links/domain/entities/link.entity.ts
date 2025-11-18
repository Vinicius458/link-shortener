import { Entity } from '@/shared/domain/entities/entity';
import { EntityValidationError } from '@/shared/domain/errors/validation-error';
import { LinkValidatorFactory } from '../validators/link.validator';

export type LinkProps = {
  originalUrl: string;
  shortCode: string;
  ownerId?: string | null;
  clicks?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
};

export class LinkEntity extends Entity<LinkProps> {
  constructor(
    public readonly props: LinkProps,
    id?: string,
  ) {
    LinkEntity.validate(props);
    super(props, id);
    this.props.createdAt = this.props.createdAt ?? new Date();
    this.props.updatedAt = this.props.updatedAt ?? new Date();
    this.props.clicks = this.props.clicks ?? 0;
    this.props.deletedAt = this.props.deletedAt ?? null;
  }

  updateOriginalUrl(newUrl: string): void {
    LinkEntity.validate({
      ...this.props,
      originalUrl: newUrl,
    });

    this.originalUrl = newUrl;
    this.updatedAt = new Date();
  }

  incrementClicks(): void {
    this.props.clicks = (this.props.clicks ?? 0) + 1;
    this.updatedAt = new Date();
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
  }

  get originalUrl() {
    return this.props.originalUrl;
  }

  private set originalUrl(value: string) {
    this.props.originalUrl = value;
  }

  get shortCode() {
    return this.props.shortCode;
  }

  get ownerId() {
    return this.props.ownerId;
  }

  get clicks() {
    return this.props.clicks ?? 0;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  private set updatedAt(value: Date) {
    this.props.updatedAt = value;
  }

  get deletedAt() {
    return this.props.deletedAt;
  }

  static validate(props: LinkProps) {
    const validator = LinkValidatorFactory.create();
    const isValid = validator.validate(props);
    if (!isValid) {
      throw new EntityValidationError(validator.errors);
    }
  }

  public toJSON() {
    return {
      id: this._id,
      originalUrl: this.originalUrl,
      shortCode: this.shortCode,
      ownerId: this.ownerId,
      clicks: this.clicks,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
