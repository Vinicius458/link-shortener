import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';

import { DatabaseModule } from '@/shared/infrastructure/database/database.module';
import { setupPrismaTests } from '@/shared/infrastructure/database/prisma/testing/setup-prisma-tests';

import { DeleteShortUrlUseCase } from '../../delete-short-url.usecase';
import { LinkPrismaRepository } from '@/links/infrastructure/database/prisma/repositories/link-prisma.repository';

import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { ForbiddenError } from '@/shared/application/errors/forbidden-error';

describe('DeleteShortUrlUseCase Integration Tests', () => {
  const prisma = new PrismaClient();
  let sut: DeleteShortUrlUseCase.UseCase;
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
    sut = new DeleteShortUrlUseCase.UseCase(linkRepository);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should throw NotFoundError when link does not exist', async () => {
    await expect(() =>
      sut.execute({
        id: 'nonexistent',
        userId: 'user1',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should throw NotFoundError when link is already soft-deleted', async () => {
    await prisma.link.create({
      data: {
        id: 'l1',
        shortCode: 'abc123',
        originalUrl: 'https://test.com',
        ownerId: 'user1',
        clicks: 0,
        deletedAt: new Date(),
      },
    });

    await expect(() =>
      sut.execute({
        id: 'l1',
        userId: 'user1',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should throw ForbiddenError when user is not owner', async () => {
    await prisma.link.create({
      data: {
        id: 'l2',
        shortCode: 'xyz987',
        originalUrl: 'https://google.com',
        ownerId: 'owner123',
        clicks: 0,
        deletedAt: null,
      },
    });

    await expect(() =>
      sut.execute({
        id: 'l2',
        userId: 'other-user',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should soft-delete the link when user is owner', async () => {
    await prisma.link.create({
      data: {
        id: 'l3',
        shortCode: 'short321',
        originalUrl: 'https://valid.com',
        ownerId: 'user123',
        clicks: 10,
        deletedAt: null,
      },
    });

    await sut.execute({
      id: 'l3',
      userId: 'user123',
    });

    const updated = await prisma.link.findUnique({
      where: { id: 'l3' },
    });

    expect(updated?.deletedAt).not.toBeNull();
  });
});
