import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { applyGlobalConfig } from '@/global-config';
import { setupPrismaTests } from '@/shared/infrastructure/database/prisma/testing/setup-prisma-tests';
import { EnvConfigModule } from '@/shared/infrastructure/env-config/env-config.module';
import { DatabaseModule } from '@/shared/infrastructure/database/database.module';
import { LinksModule } from '../../links.module';
import { UsersModule } from '@/users/infrastructure/users.module';
import { AuthModule } from '@/auth/infrastructure/auth.module';
import { AuthService } from '@/auth/infrastructure/auth.service';
import { LinkEntity } from '@/links/domain/entities/link.entity';
import { LinkRepository } from '@/links/domain/repositories/link.repository';
import { LinkDataBuilder } from '@/links/domain/testing/helpers/link-data-builder';
import { instanceToPlain } from 'class-transformer';
import { ShortUrlCollectionPresenter } from '../../presenters/short-url.presenter';
import { SignupDto } from '@/users/infrastructure/dtos/signup.dto';
import { SigninDto } from '@/users/infrastructure/dtos/signin.dto';
import { LinkModelMapper } from '../../database/prisma/models/link-model.mapper';

describe('LinksController e2e tests - list URLs', () => {
  let app: INestApplication;
  let module: TestingModule;
  let prisma: PrismaClient;
  let auth: AuthService;
  let repository: LinkRepository.Repository;

  const signupDto: SignupDto = {
    name: 'Test',
    email: 'test@test.com',
    password: '12345678Ab',
  };

  const signinDto: SigninDto = {
    email: signupDto.email,
    password: signupDto.password,
  };

  beforeAll(async () => {
    prisma = new PrismaClient();
    setupPrismaTests();

    module = await Test.createTestingModule({
      imports: [
        EnvConfigModule,
        LinksModule,
        UsersModule,
        AuthModule,
        DatabaseModule.forTest(prisma),
      ],
    }).compile();

    app = module.createNestApplication();
    applyGlobalConfig(app);
    await app.init();

    auth = module.get<AuthService>(AuthService);
    repository = module.get<LinkRepository.Repository>('LinkRepository');
  });

  beforeEach(async () => {
    await prisma.link.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /urls', () => {
    it('should return 401 when no token is sent', async () => {
      const res = await request(app.getHttpServer()).get('/urls').expect(401);
      expect(res.body.message).toBe('Unauthorized');
    });

    it('should return an empty list when user has no URLs', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send(signupDto)
        .expect(201);

      const resSign = await request(app.getHttpServer())
        .post('/users/login')
        .send(signinDto)
        .expect(200);

      const token = resSign.body.accessToken;
      const res = await request(app.getHttpServer())
        .get('/urls')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toEqual({ data: [] });
    });

    it('should list all URLs from authenticated user', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send(signupDto)
        .expect(201);

      const resSign = await request(app.getHttpServer())
        .post('/users/login')
        .send(signinDto)
        .expect(200);

      const token = resSign.body.accessToken;
      const jwt = await auth.verifyJwt(token);

      const link1 = new LinkEntity(
        LinkDataBuilder({
          ownerId: jwt.id,
          originalUrl: 'https://google.com',
          shortCode: 'ggl',
        }),
      );

      const link2 = new LinkEntity(
        LinkDataBuilder({
          ownerId: jwt.id,
          originalUrl: 'https://github.com',
          shortCode: 'gh',
        }),
      );

      await repository.insert(link1);
      await repository.insert(link2);

      const res = await request(app.getHttpServer())
        .get('/urls')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const dbLinks = await prisma.link.findMany({
        where: { ownerId: jwt.id },
      });

      const entities = dbLinks.map(link =>
        LinkModelMapper.toEntity(link).toJSON(),
      );

      const presenter = new ShortUrlCollectionPresenter({
        items: entities,
      } as any);

      expect(res.body).toStrictEqual(instanceToPlain(presenter));
    });
  });
});
