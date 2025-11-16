import { PrismaClient } from '@prisma/client';
import { LinkModelMapper } from '../../link-model.mapper';
import { ValidationError } from '@/shared/domain/errors/validation-error';
import { LinkEntity } from '@/links/domain/entities/link.entity';
import { setupPrismaTests } from '@/shared/infrastructure/database/prisma/testing/setup-prisma-tests';

describe('LinkModelMapper integration tests', () => {
  let prismaService: PrismaClient;
  let props: any;

  beforeAll(async () => {
    setupPrismaTests();
    prismaService = new PrismaClient();
    await prismaService.$connect();
  });

  beforeEach(async () => {
    await prismaService.link.deleteMany();

    props = {
      id: '2a190c8e-989e-4e3b-b399-926a4f4e9c32',
      originalUrl: 'https://example.com/page',
      shortCode: 'abc123',
      ownerId: null,
      clicks: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
  });

  afterAll(async () => {
    await prismaService.$disconnect();
  });

  it('should throw error when link model is invalid', () => {
    const model = Object.assign({}, props, { originalUrl: null });

    expect(() => LinkModelMapper.toEntity(model)).toThrow(ValidationError);
  });

  it('should convert a link model to a link entity', async () => {
    const model = await prismaService.link.create({
      data: props,
    });

    const sut = LinkModelMapper.toEntity(model);

    expect(sut).toBeInstanceOf(LinkEntity);

    expect(sut.toJSON()).toStrictEqual({
      id: props.id,
      originalUrl: props.originalUrl,
      shortCode: props.shortCode,
      ownerId: null,
      clicks: 0,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      deletedAt: null,
    });
  });
});
