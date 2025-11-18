import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { applyGlobalConfig } from '@/global-config';
import { setupPrismaTests } from '@/shared/infrastructure/database/prisma/testing/setup-prisma-tests';
import { EnvConfigModule } from '@/shared/infrastructure/env-config/env-config.module';
import { DatabaseModule } from '@/shared/infrastructure/database/database.module';
import { LinksModule } from '../../links.module';
import { ShortenUrlDto } from '../../dtos/shorten-url.dto';
import { LinkRepository } from '@/links/domain/repositories/link.repository';
import { instanceToPlain } from 'class-transformer';
import { ShortenUrlPresenter } from '../../presenters/shorten-url.presenter';
import { LinkEntity } from '@/links/domain/entities/link.entity';
import { LinkDataBuilder } from '@/links/domain/testing/helpers/link-data-builder';
import { LinkModelMapper } from '../../database/prisma/models/link-model.mapper';
import { UsersModule } from '@/users/infrastructure/users.module';
import { SignupDto } from '@/users/infrastructure/dtos/signup.dto';
import { AuthModule } from '@/auth/infrastructure/auth.module';
import { AuthService } from '@/auth/infrastructure/auth.service';
import { SigninDto } from '@/users/infrastructure/dtos/signin.dto';

describe('LinksController e2e tests - shorten url', () => {
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
    await prisma.user.deleteMany();

    shortenDto = {
      url: 'https://google.com',
    };
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /urls', () => {
    it('should shorten an URL', async () => {
      const res = await request(app.getHttpServer())
        .post('/urls')
        .send(shortenDto)
        .expect(201);

      expect(Object.keys(res.body)).toStrictEqual(['data']);

      const linkResult = await prisma.link.findFirst({
        where: { originalUrl: shortenDto.url },
      });

      const link = LinkModelMapper.toEntity(linkResult);
      const presenter = new ShortenUrlPresenter(link.toJSON());
      const serialized = instanceToPlain(presenter);

      expect(res.body.data).toStrictEqual(serialized);
    });
    it('should shorten an URL with ownerId', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send(signupDto)
        .expect(201);

      const res_sign = await request(app.getHttpServer())
        .post('/users/login')
        .send(signinDto)
        .expect(200);

      const token = res_sign.body.accessToken;

      const jwt = await auth.verifyJwt(token);

      const res = await request(app.getHttpServer())
        .post('/urls')
        .set('Authorization', `Bearer ${token}`)
        .send(shortenDto)
        .expect(201);

      const linkResult = await prisma.link.findFirst({
        where: { originalUrl: shortenDto.url, ownerId: jwt.id },
      });

      const link = LinkModelMapper.toEntity(linkResult);
      const presenter = new ShortenUrlPresenter(link.toJSON());
      const serialized = instanceToPlain(presenter);

      expect(res.body.data).toStrictEqual(serialized);
    });

    it('should return a 422 validation error when the body is empty', async () => {
      const res = await request(app.getHttpServer())
        .post('/urls')
        .send({})
        .expect(422);

      expect(res.body.error).toBe('Unprocessable Entity');

      expect(res.body.message).toEqual(
        expect.arrayContaining([
          'url should not be empty',
          'url must be a URL address',
          'url must be a string',
        ]),
      );
    });

    it('should return a 422 error when url is missing', async () => {
      delete shortenDto.url;

      const res = await request(app.getHttpServer())
        .post('/urls')
        .send(shortenDto)
        .expect(422);

      expect(res.body.error).toBe('Unprocessable Entity');
      expect(res.body.message).toEqual(
        expect.arrayContaining([
          'url should not be empty',
          'url must be a URL address',
          'url must be a string',
        ]),
      );
    });

    it('should return a 422 error when invalid fields exist', async () => {
      const res = await request(app.getHttpServer())
        .post('/urls')
        .send({ ...shortenDto, xpto: 'fake' })
        .expect(422);

      expect(res.body.error).toBe('Unprocessable Entity');
      expect(res.body.message).toEqual(['property xpto should not exist']);
    });

    it('should return 409 when the URL already exists to user', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send(signupDto)
        .expect(201);

      const res_sign = await request(app.getHttpServer())
        .post('/users/login')
        .send(signinDto)
        .expect(200);

      const token = res_sign.body.accessToken;

      const jwt = await auth.verifyJwt(token);
      const entity = new LinkEntity(
        LinkDataBuilder({ originalUrl: shortenDto.url, ownerId: jwt.id }),
      );
      await repository.insert(entity);

      const res = await request(app.getHttpServer())
        .post('/urls')
        .set('Authorization', `Bearer ${token}`)
        .send(shortenDto)
        .expect(409);

      expect(res.body).toEqual({
        statusCode: 409,
        error: 'Conflict',
        message: 'URL already shortened',
      });
    });
  });
});
