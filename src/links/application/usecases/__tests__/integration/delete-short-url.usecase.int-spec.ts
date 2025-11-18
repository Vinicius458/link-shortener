import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';

import { DatabaseModule } from '@/shared/infrastructure/database/database.module';
import { setupPrismaTests } from '@/shared/infrastructure/database/prisma/testing/setup-prisma-tests';

import { DeleteShortUrlUseCase } from '../../delete-short-url.usecase';
import { LinkPrismaRepository } from '@/links/infrastructure/database/prisma/repositories/link-prisma.repository';

import { NotFoundError as NotFoundErrorDomain } from '@/shared/domain/errors/not-found-error';
import { NotFoundError as NotFoundErrorApp } from '@/shared/application/errors/not-found-error';

import { UserEntity } from '@/users/domain/entities/user.entity';
import { UserDataBuilder } from '@/users/domain/testing/helpers/user-data-builder';
import { LinkEntity } from '@/links/domain/entities/link.entity';
import { LinkDataBuilder } from '@/links/domain/testing/helpers/link-data-builder';
import { randomUUID as uuidv4 } from 'node:crypto';
import { ConflictException } from '@nestjs/common';

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
    ).rejects.toBeInstanceOf(NotFoundErrorDomain);
  });

  it('should throw NotFoundError when link is already soft-deleted', async () => {
    const user = new UserEntity(UserDataBuilder({}));
    await prisma.user.createMany({
      data: [user.toJSON()],
    });
    const entity = new LinkEntity(
      LinkDataBuilder({
        shortCode: 'abc123',
        originalUrl: 'https://test.com',
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
      }),
    ).rejects.toBeInstanceOf(NotFoundErrorApp);
  });

  it('should throw ConflictException when user is not owner', async () => {
    const user = new UserEntity(UserDataBuilder({}));
    await prisma.user.createMany({
      data: [user.toJSON()],
    });
    const entity = new LinkEntity(
      LinkDataBuilder({
        shortCode: 'xyz987',
        originalUrl: 'https://google.com',
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
        userId: uuidv4(),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should soft-delete the link when user is owner', async () => {
    const user = new UserEntity(UserDataBuilder({}));
    await prisma.user.createMany({
      data: [user.toJSON()],
    });
    const entity = new LinkEntity(
      LinkDataBuilder({
        shortCode: 'xyz987',
        originalUrl: 'https://google.com',
        ownerId: user.id,
        clicks: 10,
        deletedAt: null,
      }),
    );

    await prisma.link.create({
      data: entity.toJSON(),
    });

    await sut.execute({
      id: entity.id,
      userId: user.id,
    });

    const updated = await prisma.link.findUnique({
      where: { id: entity.id },
    });

    expect(updated?.deletedAt).not.toBeNull();
  });
});
