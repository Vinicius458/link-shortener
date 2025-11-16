import { NotFoundError } from '@/shared/domain/errors/not-found-error';
import { PrismaService } from '@/shared/infrastructure/database/prisma/prisma.service';
import { LinkEntity } from '@/links/domain/entities/link.entity';
import { LinkRepository } from '@/links/domain/repositories/link.repository';
import { LinkModelMapper } from '../models/link-model.mapper';

export class LinkPrismaRepository implements LinkRepository.Repository {
  sortableFields: string[] = ['createdAt', 'clicks'];

  constructor(private prismaService: PrismaService) {}

  async findByShortCode(shortCode: string): Promise<LinkEntity> {
    try {
      const model = await this.prismaService.link.findUnique({
        where: { shortCode },
      });
      return LinkModelMapper.toEntity(model);
    } catch {
      throw new NotFoundError(
        `LinkModel not found using shortCode ${shortCode}`,
      );
    }
  }

  async existsShortCode(shortCode: string): Promise<boolean> {
    const link = await this.prismaService.link.findUnique({
      where: { shortCode },
      select: { id: true },
    });
    return !!link;
  }

  async search(
    props: LinkRepository.SearchParams,
  ): Promise<LinkRepository.SearchResult> {
    const sortable = this.sortableFields.includes(props.sort);
    const orderByField = sortable ? props.sort : 'createdAt';
    const orderByDir = sortable ? props.sortDir : 'desc';

    const where: any = {
      deletedAt: null,
      ...(props.filter && {
        originalUrl: { contains: props.filter, mode: 'insensitive' },
      }),
    };

    const total = await this.prismaService.link.count({ where });

    const models = await this.prismaService.link.findMany({
      where,
      orderBy: { [orderByField]: orderByDir },
      skip: props.page > 0 ? (props.page - 1) * props.perPage : 0,
      take: props.perPage,
    });

    return new LinkRepository.SearchResult({
      items: models.map(LinkModelMapper.toEntity),
      total,
      currentPage: props.page,
      perPage: props.perPage,
      sort: orderByField,
      sortDir: orderByDir,
      filter: props.filter,
    });
  }

  async insert(entity: LinkEntity): Promise<void> {
    await this.prismaService.link.create({
      data: entity.toJSON(),
    });
  }

  async findById(id: string): Promise<LinkEntity> {
    return this._get(id);
  }

  async findByAlias(alias: string): Promise<LinkEntity> {
    const model = await this.prismaService.link.findFirst({
      where: { shortCode: alias, deletedAt: null },
    });

    return LinkModelMapper.toEntity(model);
  }

  async findAll(): Promise<LinkEntity[]> {
    const models = await this.prismaService.link.findMany({
      where: { deletedAt: null },
    });

    return models.map(model => LinkModelMapper.toEntity(model));
  }

  async update(entity: LinkEntity): Promise<void> {
    await this._get(entity._id);

    await this.prismaService.link.update({
      where: { id: entity._id },
      data: entity.toJSON(),
    });
  }

  async delete(id: string): Promise<void> {
    await this._get(id);

    await this.prismaService.link.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findAllByOwner(ownerId: string): Promise<LinkEntity[]> {
    const models = await this.prismaService.link.findMany({
      where: { ownerId, deletedAt: null },
    });

    return models.map(model => LinkModelMapper.toEntity(model));
  }

  protected async _get(id: string): Promise<LinkEntity> {
    try {
      const model = await this.prismaService.link.findUnique({
        where: { id },
      });
      return LinkModelMapper.toEntity(model);
    } catch {
      throw new NotFoundError(`LinkModel not found using ID ${id}`);
    }
  }
}
