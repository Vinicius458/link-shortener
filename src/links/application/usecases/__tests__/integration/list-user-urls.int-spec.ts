import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';

import { DatabaseModule } from '@/shared/infrastructure/database/database.module';
import { setupPrismaTests } from '@/shared/infrastructure/database/prisma/testing/setup-prisma-tests';

import { ListUserUrlsUseCase } from '../../list-user-urls.usecase';
import { LinkPrismaRepository } from '@/links/infrastructure/database/prisma/repositories/link-prisma.repository';

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
    const output = await sut.execute({ userId: 'user1' });

    expect(output.items).toHaveLength(0);
  });

  it('should return only URLs belonging to the specified user', async () => {
    await prisma.link.createMany({
      data: [
        {
          id: 'l1',
          shortCode: 'u1-a',
          originalUrl: 'https://site1.com',
          ownerId: 'user1',
          clicks: 0,
          deletedAt: null,
        },
        {
          id: 'l2',
          shortCode: 'u1-b',
          originalUrl: 'https://site2.com',
          ownerId: 'user1',
          clicks: 3,
          deletedAt: null,
        },
        {
          id: 'l3',
          shortCode: 'u2-a',
          originalUrl: 'https://othersite.com',
          ownerId: 'user2',
          clicks: 2,
          deletedAt: null,
        },
      ],
    });

    const output = await sut.execute({ userId: 'user1' });

    expect(output.items).toHaveLength(2);

    const shortCodes = output.items.map(i => i.shortCode);

    expect(shortCodes).toContain('u1-a');
    expect(shortCodes).toContain('u1-b');
    expect(shortCodes).not.toContain('u2-a');
  });

  it('should not return soft-deleted URLs', async () => {
    await prisma.link.createMany({
      data: [
        {
          id: 'l1',
          shortCode: 'active',
          originalUrl: 'https://active.com',
          ownerId: 'user1',
          clicks: 0,
          deletedAt: null,
        },
        {
          id: 'l2',
          shortCode: 'deleted',
          originalUrl: 'https://deleted.com',
          ownerId: 'user1',
          clicks: 1,
          deletedAt: new Date(),
        },
      ],
    });

    const output = await sut.execute({ userId: 'user1' });

    expect(output.items).toHaveLength(1);
    expect(output.items[0].shortCode).toBe('active');
  });
});
