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
import { ShortUrlPresenter } from '../../presenters/short-url.presenter';
import { SignupDto } from '@/users/infrastructure/dtos/signup.dto';
import { SigninDto } from '@/users/infrastructure/dtos/signin.dto';
import { LinkModelMapper } from '../../database/prisma/models/link-model.mapper';

describe('LinksController e2e tests - update URL', () => {
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

  describe('PATCH /urls/:id', () => {
    it('should return 401 when no token is sent', async () => {
      const res = await request(app.getHttpServer())
        .patch('/urls/any-id')
        .send({ newOriginalUrl: 'https://updated.com' })
        .expect(401);

      expect(res.body.message).toBe('Unauthorized');
    });

    it('should return 404 when URL does not exist', async () => {
      await request(app.getHttpServer()).post('/users').send(signupDto);

      const resSign = await request(app.getHttpServer())
        .post('/users/login')
        .send(signinDto);

      const token = resSign.body.accessToken;

      await request(app.getHttpServer())
        .patch('/urls/non-existing')
        .set('Authorization', `Bearer ${token}`)
        .send({ newOriginalUrl: 'https://updated.com' })
        .expect(404);
    });

    it('should return 409 when trying to update a URL owned by another user', async () => {
      await request(app.getHttpServer()).post('/users').send(signupDto);

      const resSign1 = await request(app.getHttpServer())
        .post('/users/login')
        .send(signinDto);

      const token1 = resSign1.body.accessToken;
      const jwt1 = await auth.verifyJwt(token1);

      const urlUser1 = new LinkEntity(
        LinkDataBuilder({
          ownerId: jwt1.id,
          originalUrl: 'https://example.com',
          shortCode: 'ex1',
        }),
      );

      await repository.insert(urlUser1);

      await request(app.getHttpServer()).post('/users').send({
        name: 'User 2',
        email: 'user2@test.com',
        password: '12345678Ab',
      });

      const resSign2 = await request(app.getHttpServer())
        .post('/users/login')
        .send({
          email: 'user2@test.com',
          password: '12345678Ab',
        });

      const token2 = resSign2.body.accessToken;

      await request(app.getHttpServer())
        .patch(`/urls/${urlUser1.id}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ newOriginalUrl: 'https://malicious.com' })
        .expect(409);
    });

    it('should update URL successfully (200)', async () => {
      await request(app.getHttpServer()).post('/users').send(signupDto);

      const resSign = await request(app.getHttpServer())
        .post('/users/login')
        .send(signinDto);

      const token = resSign.body.accessToken;
      const jwt = await auth.verifyJwt(token);

      const originalEntity = new LinkEntity(
        LinkDataBuilder({
          ownerId: jwt.id,
          originalUrl: 'https://old.com',
          shortCode: 'old',
        }),
      );

      await repository.insert(originalEntity);

      const res = await request(app.getHttpServer())
        .patch(`/urls/${originalEntity.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ newOriginalUrl: 'https://updated.com' })
        .expect(200);

      const dbLink = await prisma.link.findUnique({
        where: { id: originalEntity.id },
      });

      const updatedEntity = LinkModelMapper.toEntity(dbLink).toJSON();
      const presenter = new ShortUrlPresenter(updatedEntity as any);

      expect(res.body.data).toStrictEqual(instanceToPlain(presenter));
    });
  });
});
