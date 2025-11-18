import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

import { applyGlobalConfig } from '@/global-config';
import { setupPrismaTests } from '@/shared/infrastructure/database/prisma/testing/setup-prisma-tests';

import { EnvConfigModule } from '@/shared/infrastructure/env-config/env-config.module';
import { DatabaseModule } from '@/shared/infrastructure/database/database.module';
import { LinksModule } from '../../links.module';
import { LinkRepository } from '@/links/domain/repositories/link.repository';

import { LinkEntity } from '@/links/domain/entities/link.entity';
import { LinkDataBuilder } from '@/links/domain/testing/helpers/link-data-builder';
import { UsersModule } from '@/users/infrastructure/users.module';
import { AuthModule } from '@/auth/infrastructure/auth.module';
import { AuthService } from '@/auth/infrastructure/auth.service';
import { ShortenUrlDto } from '../../dtos/shorten-url.dto';
import { SignupDto } from '@/users/infrastructure/dtos/signup.dto';
import { SigninDto } from '@/users/infrastructure/dtos/signin.dto';
import { LinkModelMapper } from '../../database/prisma/models/link-model.mapper';

describe('LinksController e2e tests - redirect url', () => {
  let app: INestApplication;
  let module: TestingModule;
  let repository: LinkRepository.Repository;
  let auth: AuthService;
  let shortenDto: ShortenUrlDto;
  let signupDto: SignupDto;
  let signinDto: SigninDto;

  const prisma = new PrismaClient();

  beforeAll(async () => {
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

    repository = module.get<LinkRepository.Repository>('LinkRepository');
    auth = module.get<AuthService>(AuthService);

    signupDto = {
      name: 'test name',
      email: 'a@a.com',
      password: 'TestPassword123',
    };

    signinDto = {
      email: signupDto.email,
      password: signupDto.password,
    };
  });

  beforeEach(async () => {
    await prisma.link.deleteMany();
    shortenDto = {
      url: 'https://google.com',
    };
    // await request(app.getHttpServer()).post('/users').send(signupDto);

    // const res_sign = await request(app.getHttpServer())
    //   .post('/users/login')
    //   .send(signinDto)
    //   .expect(200);

    // const token = res_sign.body.accessToken;

    // const jwt = await auth.verifyJwt(token);

    // await request(app.getHttpServer())
    // .post('/urls')
    // .set('Authorization', `Bearer ${token}`)
    // .send(shortenDto);
    // .expect(201);

    // const linkResult = await prisma.link.findFirst({
    //   where: { originalUrl: shortenDto.url, ownerId: null },
    // });

    // const link = LinkModelMapper.toEntity(linkResult);
    // const presenter = new ShortenUrlPresenter(link.toJSON());
    // const serialized = instanceToPlain(presenter);

    // expect(res.body.data).toStrictEqual(serialized);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /:alias', () => {
    it('should redirect to the original URL (302)', async () => {
      const entity = new LinkEntity({
        ...LinkDataBuilder({
          originalUrl: 'https://google.com',
          shortCode: 'abc123',
        }),
        ownerId: null,
      });

      await repository.insert(entity);

      const res = await request(app.getHttpServer())
        .get('/urls/abc123')
        .expect(302);

      expect(res.header.location).toBe('https://google.com');
    });

    it('should return 404 when alias does not exist', async () => {
      const res = await request(app.getHttpServer())
        .get('/urls/nonexistent')
        .expect(404);
      expect(res.body).toEqual({
        statusCode: 404,
        error: 'Not Found',
        message: 'Short URL not found',
      });
    });
  });
});
