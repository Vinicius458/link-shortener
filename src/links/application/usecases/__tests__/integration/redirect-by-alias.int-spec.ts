import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';

import { DatabaseModule } from '@/shared/infrastructure/database/database.module';
import { setupPrismaTests } from '@/shared/infrastructure/database/prisma/testing/setup-prisma-tests';

import { RedirectByAliasUseCase } from '../../redirect-by-alias.usecase';
import { LinkPrismaRepository } from '@/links/infrastructure/database/prisma/repositories/link-prisma.repository';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';

describe('RedirectByAliasUseCase Integration Tests', () => {
  const prisma = new PrismaClient();
  let sut: RedirectByAliasUseCase.UseCase;
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
    sut = new RedirectByAliasUseCase.UseCase(linkRepository);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should throw BadRequestError when alias does not exist', async () => {
    await expect(() =>
      sut.execute({ alias: 'unknown-alias' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError when link is soft-deleted', async () => {
    await prisma.link.create({
      data: {
        id: 'link1',
        shortCode: 'abc',
        originalUrl: 'https://test.com',
        ownerId: null,
        clicks: 0,
        deletedAt: new Date(),
      },
    });

    await expect(() => sut.execute({ alias: 'abc' })).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });

  it('should redirect successfully and increment clicks', async () => {
    await prisma.link.create({
      data: {
        id: 'link2',
        shortCode: 'myalias',
        originalUrl: 'https://google.com',
        ownerId: null,
        clicks: 5,
        deletedAt: null,
      },
    });

    const output = await sut.execute({ alias: 'myalias' });

    expect(output.originalUrl).toBe('https://google.com');
    expect(output.shortCode).toBe('myalias');

    const updated = await prisma.link.findUnique({
      where: { id: 'link2' },
    });

    expect(updated?.clicks).toBe(6);
  });
});
