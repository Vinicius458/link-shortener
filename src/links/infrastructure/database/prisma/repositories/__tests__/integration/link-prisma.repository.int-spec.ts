import { PrismaClient } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { setupPrismaTests } from '@/shared/infrastructure/database/prisma/testing/setup-prisma-tests';
import { DatabaseModule } from '@/shared/infrastructure/database/database.module';
import { NotFoundError } from '@/shared/domain/errors/not-found-error';
import { LinkEntity } from '@/links/domain/entities/link.entity';
import { LinkPrismaRepository } from '../../link-prisma.repository';
import { LinkRepository } from '@/links/domain/repositories/link.repository';
import { LinkDataBuilder } from '@/links/domain/testing/helpers/link-data-builder';

describe('LinkPrismaRepository integration tests', () => {
  const prismaService = new PrismaClient();
  let sut: LinkPrismaRepository;
  let module: TestingModule;

  beforeAll(async () => {
    setupPrismaTests();
    module = await Test.createTestingModule({
      imports: [DatabaseModule.forTest(prismaService)],
    }).compile();
  });

  beforeEach(async () => {
    sut = new LinkPrismaRepository(prismaService as any);
    await prismaService.link.deleteMany();
  });

  it('should throw error when entity is not found (findById)', async () => {
    await expect(() => sut.findById('FakeId')).rejects.toThrow(
      new NotFoundError('LinkModel not found using ID FakeId'),
    );
  });

  it('should find a entity by id', async () => {
    const entity = new LinkEntity(LinkDataBuilder({}));
    await prismaService.link.create({ data: entity.toJSON() });

    const output = await sut.findById(entity._id);

    expect(output.toJSON()).toStrictEqual(entity.toJSON());
  });

  it('should insert a new entity', async () => {
    const entity = new LinkEntity(LinkDataBuilder({}));
    await sut.insert(entity);

    const created = await prismaService.link.findUnique({
      where: { id: entity._id },
    });

    expect(created).toStrictEqual(entity.toJSON());
  });

  it('should return all links', async () => {
    const entity = new LinkEntity(LinkDataBuilder({}));
    await prismaService.link.create({ data: entity.toJSON() });

    const links = await sut.findAll();

    expect(links).toHaveLength(1);
    expect(links[0].toJSON()).toStrictEqual(entity.toJSON());
  });

  it('should throw error on update if entity not found', async () => {
    const entity = new LinkEntity(LinkDataBuilder({}));

    await expect(() => sut.update(entity)).rejects.toThrow(
      new NotFoundError(`LinkModel not found using ID ${entity._id}`),
    );
  });

  it('should update an entity', async () => {
    const entity = new LinkEntity(LinkDataBuilder({}));
    await prismaService.link.create({ data: entity.toJSON() });

    entity.updateOriginalUrl('https://updated-url.com');
    await sut.update(entity);

    const updated = await prismaService.link.findUnique({
      where: { id: entity._id },
    });

    expect(updated.originalUrl).toBe('https://updated-url.com');
  });

  it('should throw error on delete when entity not found', async () => {
    await expect(() => sut.delete('FakeId')).rejects.toThrow(
      new NotFoundError('LinkModel not found using ID FakeId'),
    );
  });

  it('should soft delete entity', async () => {
    const entity = new LinkEntity(LinkDataBuilder({}));
    await prismaService.link.create({ data: entity.toJSON() });

    await sut.delete(entity._id);

    const deleted = await prismaService.link.findUnique({
      where: { id: entity._id },
    });

    expect(deleted.deletedAt).not.toBeNull();
  });

  it('should throw error when findByShortCode does not find entity', async () => {
    await expect(() => sut.findByShortCode('unknown')).rejects.toThrow(
      new NotFoundError('LinkModel not found using shortCode unknown'),
    );
  });

  it('should find entity by shortCode', async () => {
    const entity = new LinkEntity(LinkDataBuilder({ shortCode: 'abc123' }));
    await prismaService.link.create({ data: entity.toJSON() });

    const result = await sut.findByShortCode('abc123');

    expect(result.toJSON()).toStrictEqual(entity.toJSON());
  });

  it('should validate existsShortCode', async () => {
    const entity = new LinkEntity(LinkDataBuilder({ shortCode: 'exists1' }));
    await prismaService.link.create({ data: entity.toJSON() });

    expect(await sut.existsShortCode('exists1')).toBe(true);
    expect(await sut.existsShortCode('nope')).toBe(false);
  });

  it('should increment clicks', async () => {
    const entity = new LinkEntity(LinkDataBuilder({ clicks: 0 }));
    await prismaService.link.create({ data: entity.toJSON() });

    await sut.incrementClicks(entity._id);

    const after = await prismaService.link.findUnique({
      where: { id: entity._id },
    });

    expect(after.clicks).toBe(1);
  });

  it('should find all links by ownerId', async () => {
    const link1 = new LinkEntity(LinkDataBuilder({ ownerId: 'user1' }));
    const link2 = new LinkEntity(LinkDataBuilder({ ownerId: 'user1' }));
    const link3 = new LinkEntity(LinkDataBuilder({ ownerId: 'user2' }));

    await prismaService.link.createMany({
      data: [link1.toJSON(), link2.toJSON(), link3.toJSON()],
    });

    const results = await sut.findAllByOwner('user1');

    expect(results.length).toBe(2);
    expect(results[0].ownerId).toBe('user1');
    expect(results[1].ownerId).toBe('user1');
  });

  describe('search method', () => {
    it('should paginate results when no filter/sort provided', async () => {
      const createdAt = new Date();
      const entities: LinkEntity[] = [];

      for (let i = 0; i < 16; i++) {
        entities.push(
          new LinkEntity(
            LinkDataBuilder({
              originalUrl: `https://url${i}.com`,
              createdAt: new Date(createdAt.getTime() + i),
            }),
          ),
        );
      }

      await prismaService.link.createMany({
        data: entities.map(e => e.toJSON()),
      });

      const output = await sut.search(new LinkRepository.SearchParams());

      expect(output.total).toBe(16);
      expect(output.items.length).toBe(15);
      output.items.forEach(item => expect(item).toBeInstanceOf(LinkEntity));
    });

    it('should filter, sort and paginate results', async () => {
      const base = new Date();
      const entities = [
        new LinkEntity(
          LinkDataBuilder({ originalUrl: 'AAA', createdAt: base }),
        ),
        new LinkEntity(
          LinkDataBuilder({
            originalUrl: 'BBB',
            createdAt: new Date(base.getTime() + 1),
          }),
        ),
        new LinkEntity(
          LinkDataBuilder({
            originalUrl: 'AAA-test',
            createdAt: new Date(base.getTime() + 2),
          }),
        ),
      ];

      await prismaService.link.createMany({
        data: entities.map(e => e.toJSON()),
      });

      const output = await sut.search(
        new LinkRepository.SearchParams({
          filter: 'AAA',
          sort: 'originalUrl',
          sortDir: 'asc',
          page: 1,
          perPage: 2,
        }),
      );

      expect(output.items.length).toBe(2);
      expect(output.items[0].originalUrl).toContain('AAA');
      expect(output.items[1].originalUrl).toContain('AAA');
    });
  });
});
