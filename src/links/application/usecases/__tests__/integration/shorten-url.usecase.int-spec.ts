import { DatabaseModule } from '@/shared/infrastructure/database/database.module';
import { setupPrismaTests } from '@/shared/infrastructure/database/prisma/testing/setup-prisma-tests';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';

import { ShortenUrlUseCase } from '../../shorten-url.usecase';

import { LinkPrismaRepository } from '@/links/infrastructure/database/prisma/repositories/link-prisma.repository';
import { UserPrismaRepository } from '@/users/infrastructure/database/prisma/repositories/user-prisma.repository';

import { UserEntity } from '@/users/domain/entities/user.entity';
import { UserDataBuilder } from '@/users/domain/testing/helpers/user-data-builder';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';

describe('CreateShortUrlUseCase integration tests', () => {
  const prismaService = new PrismaClient();
  let sut: ShortenUrlUseCase.UseCase;

  let linkRepository: LinkPrismaRepository;
  let userRepository: UserPrismaRepository;
  let module: TestingModule;

  const idProviderMock = {
    generateId: jest.fn(),
  };

  beforeAll(async () => {
    setupPrismaTests();

    module = await Test.createTestingModule({
      imports: [DatabaseModule.forTest(prismaService)],
    }).compile();

    linkRepository = new LinkPrismaRepository(prismaService as any);
    userRepository = new UserPrismaRepository(prismaService as any);
  });

  beforeEach(async () => {
    await prismaService.link.deleteMany();
    await prismaService.user.deleteMany();

    idProviderMock.generateId.mockReset();
    idProviderMock.generateId.mockReturnValue('abc123');

    sut = new ShortenUrlUseCase.UseCase(
      linkRepository,
      userRepository,
      idProviderMock,
    );
  });

  afterAll(async () => {
    await module.close();
  });

  it('should throw BadRequestError when ownerId is provided but user does not exist', async () => {
    await expect(() =>
      sut.execute({
        url: 'https://google.com',
        ownerId: 'non-existing-id',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should create a short url WITHOUT ownerId', async () => {
    const output = await sut.execute({
      url: 'https://google.com',
      ownerId: null,
    });

    expect(output.originalUrl).toBe('https://google.com');
    expect(output.shortCode).toBe('abc123');
    expect(output.ownerId).toBeNull();

    const saved = await prismaService.link.findUnique({
      where: { id: output.id },
    });

    expect(saved).not.toBeNull();
    expect(saved?.shortCode).toBe('abc123');
  });

  it('should create a short url WITH ownerId when user exists', async () => {
    const user = new UserEntity(UserDataBuilder({}));

    await prismaService.user.create({
      data: user.toJSON(),
    });

    const output = await sut.execute({
      url: 'https://google.com',
      ownerId: user.id,
    });

    expect(output.ownerId).toBe(user.id);
    expect(output.shortCode).toBe('abc123');

    const saved = await prismaService.link.findUnique({
      where: { id: output.id },
    });

    expect(saved).not.toBeNull();
    expect(saved?.ownerId).toBe(user.id);
  });

  it('should generate a unique shortCode (checking existsShortCode)', async () => {
    idProviderMock.generateId
      .mockReturnValueOnce('dup1')
      .mockReturnValueOnce('unique');

    await prismaService.link.create({
      data: {
        id: 'id-1',
        shortCode: 'dup1',
        originalUrl: 'https://github.com',
        ownerId: null,
      },
    });

    const output = await sut.execute({
      url: 'https://google.com',
    });

    expect(output.shortCode).toBe('unique');
  });
});
