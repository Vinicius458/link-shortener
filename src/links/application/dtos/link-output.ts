import { LinkEntity } from '@/links/domain/entities/link.entity';

export type LinkOutput = {
  id: string;
  originalUrl: string;
  shortCode: string;
  ownerId: string | null;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export class LinkOutputMapper {
  static toOutput(entity: LinkEntity): LinkOutput {
    return entity.toJSON() as LinkOutput;
  }
}
