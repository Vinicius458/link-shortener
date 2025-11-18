import { LinkProps } from '../../entities/link.entity';
import { randomUUID as uuidv4 } from 'node:crypto';
type Props = {
  originalUrl?: string;
  shortCode?: string;
  ownerId?: string | null;
  clicks?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
};

export function LinkDataBuilder(props: Props): LinkProps {
  return {
    originalUrl: props.originalUrl ?? 'https://example.com/test',
    shortCode: props.shortCode ?? 'abc123',
    ownerId: props.ownerId ?? uuidv4(),
    clicks: props.clicks ?? 0,
    createdAt: props.createdAt ?? new Date(),
    updatedAt: props.updatedAt ?? new Date(),
    deletedAt: props.deletedAt ?? null,
  };
}
