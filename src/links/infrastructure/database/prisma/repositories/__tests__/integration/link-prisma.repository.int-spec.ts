import { PrismaClient } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { setupPrismaTests } from '@/shared/infrastructure/database/prisma/testing/setup-prisma-tests';
import { DatabaseModule } from '@/shared/infrastructure/database/database.module';
import { NotFoundError } from '@/shared/domain/errors/not-found-error';
import { LinkEntity } from '@/links/domain/entities/link.entity';
import { LinkPrismaRepository } from '../../link-prisma.repository';
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

  afterAll(async () => {
    await prismaService.$disconnect();
  });

  it('should throw error when entity is not found (findById)', async () => {
    const id = randomUUID();
    await expect(() => sut.findById(id)).rejects.toThrow(
      new NotFoundError(`LinkModel not found using ID ${id}`),
    );
  });

  it('should find a entity by id', async () => {
    const user = await prismaService.user.create({
      data: {
        id: randomUUID(),
        name: 'Test User',
        email: `${randomUUID()}@mail.com`,
        password: '123456',
      },
    });

    const entity = new LinkEntity(LinkDataBuilder({ ownerId: user.id }));
    await prismaService.link.create({ data: entity.toJSON() });

    const output = await sut.findById(entity._id);

    expect(output.toJSON()).toStrictEqual(entity.toJSON());
  });

  it('should find a entity by alias', async () => {
    const user = await prismaService.user.create({
      data: {
        id: randomUUID(),
        name: 'Test User',
        email: `${randomUUID()}@mail.com`,
        password: '123456',
      },
    });

    const entity = new LinkEntity(LinkDataBuilder({ ownerId: user.id }));
    await prismaService.link.create({ data: entity.toJSON() });

    const output = await sut.findByAlias(entity.shortCode);

    expect(output.toJSON()).toStrictEqual(entity.toJSON());
  });

  it('should insert a new entity', async () => {
    const user = await prismaService.user.create({
      data: {
        id: randomUUID(),
        name: 'Test User',
        email: `${randomUUID()}@mail.com`,
        password: '123456',
      },
    });

    const entity = new LinkEntity(LinkDataBuilder({ ownerId: user.id }));
    await sut.insert(entity);

    const created = await prismaService.link.findUnique({
      where: { id: entity._id },
    });

    expect(created).toStrictEqual(entity.toJSON());
  });

  it('should return all links', async () => {
    const user = await prismaService.user.create({
      data: {
        id: randomUUID(),
        name: 'Test User',
        email: `${randomUUID()}@mail.com`,
        password: '123456',
      },
    });

    const entity = new LinkEntity(LinkDataBuilder({ ownerId: user.id }));
    await prismaService.link.create({ data: entity.toJSON() });

    const links = await sut.findAll();

    expect(links).toHaveLength(1);
    expect(links[0].toJSON()).toStrictEqual(entity.toJSON());
  });

  it('should throw error on update if entity not found', async () => {
    const user = await prismaService.user.create({
      data: {
        id: randomUUID(),
        name: 'Test User',
        email: `${randomUUID()}@mail.com`,
        password: '123456',
      },
    });

    const entity = new LinkEntity(LinkDataBuilder({ ownerId: user.id }));

    await expect(() => sut.update(entity)).rejects.toThrow(
      new NotFoundError(`LinkModel not found using ID ${entity._id}`),
    );
  });

  it('should update an entity', async () => {
    const user = await prismaService.user.create({
      data: {
        id: randomUUID(),
        name: 'Test User',
        email: `${randomUUID()}@mail.com`,
        password: '123456',
      },
    });

    const entity = new LinkEntity(LinkDataBuilder({ ownerId: user.id }));
    await prismaService.link.create({ data: entity.toJSON() });

    entity.updateOriginalUrl('https://updated-url.com');
    await sut.update(entity);

    const updated = await prismaService.link.findUnique({
      where: { id: entity._id },
    });

    expect(updated.originalUrl).toBe('https://updated-url.com');
  });

  it('should throw error on delete when entity not found', async () => {
    const user = await prismaService.user.create({
      data: {
        id: randomUUID(),
        name: 'Test User',
        email: `${randomUUID()}@mail.com`,
        password: '123456',
      },
    });

    await expect(() => sut.delete(user.id)).rejects.toThrow(
      new NotFoundError(`LinkModel not found using ID ${user.id}`),
    );
  });

  it('should soft delete entity', async () => {
    const user = await prismaService.user.create({
      data: {
        id: randomUUID(),
        name: 'Test User',
        email: `${randomUUID()}@mail.com`,
        password: '123456',
      },
    });

    const entity = new LinkEntity(LinkDataBuilder({ ownerId: user.id }));
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
    const user = await prismaService.user.create({
      data: {
        id: randomUUID(),
        name: 'Test User',
        email: `${randomUUID()}@mail.com`,
        password: '123456',
      },
    });

    const entity = new LinkEntity(
      LinkDataBuilder({
        ownerId: user.id,
        shortCode: 'abc123',
      }),
    );
    await prismaService.link.create({ data: entity.toJSON() });

    const result = await sut.findByShortCode('abc123');

    expect(result.toJSON()).toStrictEqual(entity.toJSON());
  });

  it('should validate existsShortCode', async () => {
    const user = await prismaService.user.create({
      data: {
        id: randomUUID(),
        name: 'Test User',
        email: `${randomUUID()}@mail.com`,
        password: '123456',
      },
    });

    const entity = new LinkEntity(
      LinkDataBuilder({
        ownerId: user.id,
        shortCode: 'exist1',
      }),
    );
    await prismaService.link.create({ data: entity.toJSON() });

    expect(await sut.existsShortCode('exist1')).toBe(true);
    expect(await sut.existsShortCode('nope')).toBe(false);
  });

  it('should find all links by ownerId', async () => {
    const user = await prismaService.user.create({
      data: {
        id: randomUUID(),
        name: 'Test User',
        email: `${randomUUID()}@mail.com`,
        password: '123456',
      },
    });

    const user2 = await prismaService.user.create({
      data: {
        id: randomUUID(),
        name: 'Test User 2',
        email: `${randomUUID()}@mail.com`,
        password: '1234567',
      },
    });

    const owner1 = user.id;
    const owner2 = user2.id;

    const link1 = new LinkEntity(
      LinkDataBuilder({ shortCode: 'codee1', ownerId: owner1 }),
    );
    const link2 = new LinkEntity(
      LinkDataBuilder({ shortCode: 'codee2', ownerId: owner1 }),
    );
    const link3 = new LinkEntity(
      LinkDataBuilder({ shortCode: 'codee3', ownerId: owner2 }),
    );

    await prismaService.link.createMany({
      data: [link1.toJSON(), link2.toJSON(), link3.toJSON()],
    });

    const results = await sut.findAllByOwner(owner1);

    expect(results.length).toBe(2);
    results.forEach(r => expect(r.ownerId).toBe(owner1));
  });
});
