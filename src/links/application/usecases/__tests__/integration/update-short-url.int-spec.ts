import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';

import { DatabaseModule } from '@/shared/infrastructure/database/database.module';
import { setupPrismaTests } from '@/shared/infrastructure/database/prisma/testing/setup-prisma-tests';

import { LinkPrismaRepository } from '@/links/infrastructure/database/prisma/repositories/link-prisma.repository';
import { NotFoundError as NotFoundErrorApp } from '@/shared/application/errors/not-found-error';
import { NotFoundError as NotFoundErrorDomain } from '@/shared/domain/errors/not-found-error';
import { UpdateShortUrlDestinationUseCase } from '../../update-short-url.usecase';
import { LinkDataBuilder } from '@/links/domain/testing/helpers/link-data-builder';
import { LinkEntity } from '@/links/domain/entities/link.entity';
import { UserEntity } from '@/users/domain/entities/user.entity';
import { UserDataBuilder } from '@/users/domain/testing/helpers/user-data-builder';
import { ConflictException } from '@nestjs/common';

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
    await expect(
      sut.execute({
        id: 'nonexistent',
        userId: 'user1',
        newOriginalUrl: 'https://new.com',
      }),
    ).rejects.toBeInstanceOf(NotFoundErrorDomain);
  });

  it('should throw NotFoundError if link is soft-deleted', async () => {
    const user = new UserEntity(UserDataBuilder({}));
    await prisma.user.createMany({
      data: [user.toJSON()],
    });
    const entity = new LinkEntity(
      LinkDataBuilder({
        shortCode: 'abc123',
        originalUrl: 'https://old.com',
        ownerId: user.id,
        clicks: 0,
        deletedAt: new Date(),
      }),
    );

    await prisma.link.create({
      data: entity.toJSON(),
    });

    await expect(() =>
      sut.execute({
        id: entity.id,
        userId: user.id,
        newOriginalUrl: 'https://new.com',
      }),
    ).rejects.toBeInstanceOf(NotFoundErrorApp);
  });

  it('should throw ConflictException if user is not the owner', async () => {
    const user = new UserEntity(UserDataBuilder({}));
    await prisma.user.createMany({
      data: [user.toJSON()],
    });
    const entity = new LinkEntity(
      LinkDataBuilder({
        shortCode: 'xyz789',
        originalUrl: 'https://old.com',
        ownerId: user.id,
        clicks: 0,
        deletedAt: null,
      }),
    );

    await prisma.link.create({
      data: entity.toJSON(),
    });

    await expect(() =>
      sut.execute({
        id: entity.id,
        userId: 'another-user',
        newOriginalUrl: 'https://new.com',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should update originalUrl when user is the owner', async () => {
    const user = new UserEntity(UserDataBuilder({}));
    await prisma.user.createMany({
      data: [user.toJSON()],
    });
    const entity = new LinkEntity(
      LinkDataBuilder({
        shortCode: 'xyz789',
        originalUrl: 'https://old.com',
        ownerId: user.id,
        clicks: 5,
        deletedAt: null,
      }),
    );

    await prisma.link.create({
      data: entity.toJSON(),
    });

    const output = await sut.execute({
      id: entity.id,
      userId: user.id,
      newOriginalUrl: 'https://updated.com',
    });

    expect(output.id).toBe(entity.id);
    expect(output.originalUrl).toBe('https://updated.com');
    expect(output.shortCode).toBe('xyz789');

    const updated = await prisma.link.findUnique({
      where: { id: entity.id },
    });

    expect(updated?.originalUrl).toBe('https://updated.com');
  });
});
