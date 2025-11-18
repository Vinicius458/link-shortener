import { Module } from '@nestjs/common';
import { PrismaService } from '@/shared/infrastructure/database/prisma/prisma.service';
import { AuthModule } from '@/auth/infrastructure/auth.module';
import { LinksController } from './link.controller';
import { LinkPrismaRepository } from './database/prisma/repositories/link-prisma.repository';
import { GenerateIdProvider } from './providers/generator-id-provider/generate-id.provider';
import { ShortenUrlUseCase } from '../application/usecases/shorten-url.usecase';
import { LinkRepository } from '../domain/repositories/link.repository';
import { RedirectByAliasUseCase } from '../application/usecases/redirect-by-alias.usecase';
import { ListUserUrlsUseCase } from '../application/usecases/list-user-urls.usecase';
import { UpdateShortUrlDestinationUseCase } from '../application/usecases/update-short-url.usecase';
import { DeleteShortUrlUseCase } from '../application/usecases/delete-short-url.usecase';
import { UserPrismaRepository } from '@/users/infrastructure/database/prisma/repositories/user-prisma.repository';
import { UserRepository } from '@/users/domain/repositories/user.repository';

@Module({
  imports: [AuthModule],
  controllers: [LinksController],
  providers: [
    {
      provide: 'PrismaService',
      useClass: PrismaService,
    },
    {
      provide: 'UserRepository',
      useFactory: (prismaService: PrismaService) => {
        return new UserPrismaRepository(prismaService);
      },
      inject: ['PrismaService'],
    },
    {
      provide: 'LinkRepository',
      useFactory: (prismaService: PrismaService) => {
        return new LinkPrismaRepository(prismaService);
      },
      inject: ['PrismaService'],
    },
    {
      provide: 'GenerateIdProvider',
      useClass: GenerateIdProvider,
    },
    {
      provide: ShortenUrlUseCase.UseCase,
      useFactory: (
        linkRepo: LinkRepository.Repository,
        userRepo: UserRepository.Repository,
        idProvider: GenerateIdProvider,
      ) => {
        return new ShortenUrlUseCase.UseCase(linkRepo, userRepo, idProvider);
      },
      inject: ['LinkRepository', 'UserRepository', 'GenerateIdProvider'],
    },
    {
      provide: RedirectByAliasUseCase.UseCase,
      useFactory: (linkRepo: LinkRepository.Repository) => {
        return new RedirectByAliasUseCase.UseCase(linkRepo);
      },
      inject: ['LinkRepository'],
    },
    {
      provide: ListUserUrlsUseCase.UseCase,
      useFactory: (linkRepository: LinkRepository.Repository) => {
        return new ListUserUrlsUseCase.UseCase(linkRepository);
      },
      inject: ['LinkRepository'],
    },

    {
      provide: UpdateShortUrlDestinationUseCase.UseCase,
      useFactory: (linkRepository: LinkRepository.Repository) => {
        return new UpdateShortUrlDestinationUseCase.UseCase(linkRepository);
      },
      inject: ['LinkRepository'],
    },
    {
      provide: DeleteShortUrlUseCase.UseCase,
      useFactory: (linkRepository: LinkRepository.Repository) => {
        return new DeleteShortUrlUseCase.UseCase(linkRepository);
      },
      inject: ['LinkRepository'],
    },
  ],
})
export class LinksModule {}
