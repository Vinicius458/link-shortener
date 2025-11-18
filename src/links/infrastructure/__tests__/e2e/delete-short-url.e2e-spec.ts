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
import { LinkRepository } from '@/links/domain/repositories/link.repository';
import { LinkEntity } from '@/links/domain/entities/link.entity';
import { LinkDataBuilder } from '@/links/domain/testing/helpers/link-data-builder';

describe('LinksController e2e tests - delete URL', () => {
  let app: INestApplication;
  let module: TestingModule;
  let prisma: PrismaClient;
  let auth: AuthService;
  let repository: LinkRepository.Repository;

  const signupDto = {
    name: 'Test',
    email: 'test@test.com',
    password: '12345678Ab',
  };

  const signinDto = {
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

  // ---------------------------------------------------
  // TESTES DO DELETE
  // ---------------------------------------------------

  describe('DELETE /urls/:id', () => {
    it('should return 401 when no token is sent', async () => {
      await request(app.getHttpServer()).delete('/urls/any-id').expect(401);
    });

    it('should return 404 when URL does not exist', async () => {
      await request(app.getHttpServer()).post('/users').send(signupDto);

      const resSign = await request(app.getHttpServer())
        .post('/users/login')
        .send(signinDto);

      const token = resSign.body.accessToken;

      await request(app.getHttpServer())
        .delete('/urls/non-existing')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('should return 409 when trying to delete a URL owned by another user', async () => {
      // Usuário 1
      await request(app.getHttpServer()).post('/users').send(signupDto);

      const resSign1 = await request(app.getHttpServer())
        .post('/users/login')
        .send(signinDto);

      const token1 = resSign1.body.accessToken;
      const jwt1 = await auth.verifyJwt(token1);

      // Cria URL para o usuário 1
      const urlUser1 = new LinkEntity(
        LinkDataBuilder({
          ownerId: jwt1.id,
          originalUrl: 'https://example.com',
          shortCode: 'ex1',
        }),
      );

      await repository.insert(urlUser1);

      // Usuário 2
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

      // Usuário 2 tenta deletar URL do usuário 1
      await request(app.getHttpServer())
        .delete(`/urls/${urlUser1.id}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(409);
    });

    it('should delete URL successfully (204)', async () => {
      // Cria usuário
      await request(app.getHttpServer()).post('/users').send(signupDto);

      const resSign = await request(app.getHttpServer())
        .post('/users/login')
        .send(signinDto);

      const token = resSign.body.accessToken;
      const jwt = await auth.verifyJwt(token);

      // Cria URL no repositório
      const entity = new LinkEntity(
        LinkDataBuilder({
          ownerId: jwt.id,
          originalUrl: 'https://to-delete.com',
          shortCode: 'del1',
        }),
      );

      await repository.insert(entity);

      // Remove
      await request(app.getHttpServer())
        .delete(`/urls/${entity.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      const res = await request(app.getHttpServer())
        .get('/urls')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toEqual([]);
    });
  });
});
