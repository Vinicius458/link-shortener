import { ValidationError } from '@/shared/domain/errors/validation-error';
import { LinkEntity } from '@/links/domain/entities/link.entity';
import { Link } from '@prisma/client';

export class LinkModelMapper {
  static toEntity(model: Link) {
    const data = {
      originalUrl: model.originalUrl,
      shortCode: model.shortCode,
      ownerId: model.ownerId,
      clicks: model.clicks,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: model.deletedAt,
    };

    try {
      return new LinkEntity(data, model.id);
    } catch {
      throw new ValidationError('An entity not be loaded');
    }
  }
}
