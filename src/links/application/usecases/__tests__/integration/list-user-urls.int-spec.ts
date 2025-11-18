import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';

import { DatabaseModule } from '@/shared/infrastructure/database/database.module';
import { setupPrismaTests } from '@/shared/infrastructure/database/prisma/testing/setup-prisma-tests';

import { ListUserUrlsUseCase } from '../../list-user-urls.usecase';
import { LinkPrismaRepository } from '@/links/infrastructure/database/prisma/repositories/link-prisma.repository';
import { randomUUID as uuidv4 } from 'node:crypto';
import { LinkDataBuilder } from '@/links/domain/testing/helpers/link-data-builder';
import { LinkEntity } from '@/links/domain/entities/link.entity';
import { UserDataBuilder } from '@/users/domain/testing/helpers/user-data-builder';
import { UserEntity } from '@/users/domain/entities/user.entity';

describe('ListUserUrlsUseCase Integration Tests', () => {
  const prisma = new PrismaClient();
  let sut: ListUserUrlsUseCase.UseCase;
  let linkRepository: LinkPrismaRepository;
  let module: TestingModule;

  beforeAll(async () => {
    setupPrismaTests();

    module = await Test.createTestingModule({
      imports: [DatabaseModule.forTest(prisma)],
    }).compile();

    linkRepository = new LinkPrismaRepository(prisma as any);
  });

  beforeEach(async () => {
    await prisma.link.deleteMany();
    sut = new ListUserUrlsUseCase.UseCase(linkRepository);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should return an empty list when user has no URLs', async () => {
    const output = await sut.execute({ userId: uuidv4() });

    expect(output.items).toHaveLength(0);
  });

  it('should return only URLs belonging to the specified user', async () => {
    const user1 = new UserEntity(UserDataBuilder({}));
    const user2 = new UserEntity(UserDataBuilder({}));
    await prisma.user.createMany({
      data: [user1.toJSON(), user2.toJSON()],
    });
    const entity1 = new LinkEntity(
      LinkDataBuilder({
        shortCode: 'short1',
        originalUrl: 'https://active1.com',
        ownerId: user1.id,
        clicks: 0,
        deletedAt: null,
      }),
    );
    const entity2 = new LinkEntity(
      LinkDataBuilder({
        shortCode: 'short2',
        originalUrl: 'https://active2.com',
        ownerId: user1.id,
        clicks: 3,
        deletedAt: null,
      }),
    );
    const entity3 = new LinkEntity(
      LinkDataBuilder({
        shortCode: 'short3',
        originalUrl: 'https://active3.com',
        ownerId: user2.id,
        clicks: 2,
        deletedAt: null,
      }),
    );
    await prisma.link.createMany({
      data: [entity1.toJSON(), entity2.toJSON(), entity3.toJSON()],
    });

    const output = await sut.execute({ userId: user1.id });
    expect(output.items).toHaveLength(2);

    const shortCodes = output.items.map(i => i.shortCode);

    expect(shortCodes).toContain('short1');
    expect(shortCodes).toContain('short2');
    expect(shortCodes).not.toContain('short3');
  });

  it('should not return soft-deleted URLs', async () => {
    const user1 = new UserEntity(UserDataBuilder({}));
    await prisma.user.createMany({
      data: [user1.toJSON()],
    });
    const entity1 = new LinkEntity(
      LinkDataBuilder({
        shortCode: 'short1',
        originalUrl: 'https://active.com',
        ownerId: user1.id,
        clicks: 0,
        deletedAt: null,
      }),
    );
    const entity2 = new LinkEntity(
      LinkDataBuilder({
        shortCode: 'short2',
        originalUrl: 'https://active2.com',
        ownerId: user1.id,
        clicks: 0,
        deletedAt: new Date(),
      }),
    );
    await prisma.link.createMany({
      data: [entity1.toJSON(), entity2.toJSON()],
    });

    const output = await sut.execute({ userId: user1.id });

    expect(output.items).toHaveLength(1);
    expect(output.items[0].shortCode).toBe('short1');
  });
});
