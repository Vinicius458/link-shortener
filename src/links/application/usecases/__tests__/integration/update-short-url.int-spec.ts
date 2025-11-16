import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';

import { DatabaseModule } from '@/shared/infrastructure/database/database.module';
import { setupPrismaTests } from '@/shared/infrastructure/database/prisma/testing/setup-prisma-tests';

import { LinkPrismaRepository } from '@/links/infrastructure/database/prisma/repositories/link-prisma.repository';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { ForbiddenError } from '@/shared/application/errors/forbidden-error';
import { UpdateShortUrlDestinationUseCase } from '../../update-short-url.usecase';

describe('UpdateShortUrlDestinationUseCase Integration Tests', () => {
  const prisma = new PrismaClient();
  let sut: UpdateShortUrlDestinationUseCase.UseCase;
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
    sut = new UpdateShortUrlDestinationUseCase.UseCase(linkRepository);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should throw NotFoundError if link does not exist', async () => {
    await expect(() =>
      sut.execute({
        id: 'nonexistent',
        userId: 'user1',
        newOriginalUrl: 'https://new.com',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should throw NotFoundError if link is soft-deleted', async () => {
    await prisma.link.create({
      data: {
        id: 'l1',
        shortCode: 'abc123',
        originalUrl: 'https://old.com',
        ownerId: 'user1',
        clicks: 0,
        deletedAt: new Date(),
      },
    });

    await expect(() =>
      sut.execute({
        id: 'l1',
        userId: 'user1',
        newOriginalUrl: 'https://new.com',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should throw ForbiddenError if user is not the owner', async () => {
    await prisma.link.create({
      data: {
        id: 'l2',
        shortCode: 'xyz789',
        originalUrl: 'https://old.com',
        ownerId: 'owner-user',
        clicks: 0,
        deletedAt: null,
      },
    });

    await expect(() =>
      sut.execute({
        id: 'l2',
        userId: 'another-user',
        newOriginalUrl: 'https://new.com',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should update originalUrl when user is the owner', async () => {
    await prisma.link.create({
      data: {
        id: 'l3',
        shortCode: 'short123',
        originalUrl: 'https://old.com',
        ownerId: 'user123',
        clicks: 5,
        deletedAt: null,
      },
    });

    const output = await sut.execute({
      id: 'l3',
      userId: 'user123',
      newOriginalUrl: 'https://updated.com',
    });

    expect(output.id).toBe('l3');
    expect(output.originalUrl).toBe('https://updated.com');
    expect(output.shortCode).toBe('short123');

    const updated = await prisma.link.findUnique({
      where: { id: 'l3' },
    });

    expect(updated?.originalUrl).toBe('https://updated.com');
  });
});
