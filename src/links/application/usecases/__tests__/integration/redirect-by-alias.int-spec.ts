import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';

import { DatabaseModule } from '@/shared/infrastructure/database/database.module';
import { setupPrismaTests } from '@/shared/infrastructure/database/prisma/testing/setup-prisma-tests';

import { RedirectByAliasUseCase } from '../../redirect-by-alias.usecase';
import { LinkPrismaRepository } from '@/links/infrastructure/database/prisma/repositories/link-prisma.repository';
import { LinkEntity } from '@/links/domain/entities/link.entity';
import { LinkDataBuilder } from '@/links/domain/testing/helpers/link-data-builder';
import { NotFoundException } from '@nestjs/common';

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

  it('should throw NotFoundException when alias does not exist', async () => {
    await expect(() =>
      sut.execute({ alias: 'unknown-alias' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    3;
  });

  it('should throw NotFoundException when link is soft-deleted', async () => {
    const entity = new LinkEntity({
      ...LinkDataBuilder({ shortCode: 'abc' }),
      ownerId: null,
    });
    entity.softDelete();
    await prisma.link.create({ data: entity.toJSON() });

    await expect(() => sut.execute({ alias: 'abc' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should redirect successfully and increment clicks', async () => {
    const entity = new LinkEntity({
      ...LinkDataBuilder({
        shortCode: 'alias',
        originalUrl: 'https://google.com',
        ownerId: null,
        clicks: 5,
        deletedAt: null,
      }),
      ownerId: null,
    });
    const linkCreated = await prisma.link.create({ data: entity.toJSON() });

    const output = await sut.execute({ alias: 'alias' });

    expect(output.originalUrl).toBe('https://google.com');
    expect(output.shortCode).toBe('alias');

    const updated = await prisma.link.findUnique({
      where: { id: linkCreated.id },
    });

    expect(updated?.clicks).toBe(6);
  });
});
