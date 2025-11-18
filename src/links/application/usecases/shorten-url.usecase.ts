import { LinkEntity } from '@/links/domain/entities/link.entity';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { InternalServerError } from '@/shared/application/errors/internal-server-error';
import { IdProvider } from '@/shared/application/providers/id-provider';
import { UseCase as DefaultUseCase } from '@/shared/application/usecases/use-case';
import { LinkOutput, LinkOutputMapper } from '../dtos/link-output';
import { LinkRepository } from '@/links/domain/repositories/link.repository';
import { UserRepository } from '@/users/domain/repositories/user.repository';
import { ConflictExceptionError } from '@/shared/application/errors/conflict-exception';
import { ConflictException } from '@nestjs/common';

export namespace ShortenUrlUseCase {
  export type Input = {
    url: string;
    ownerId?: string | null;
  };

  export type Output = LinkOutput;

  export class UseCase implements DefaultUseCase<Input, Output> {
    constructor(
      private linkRepo: LinkRepository.Repository,
      private userRepo: UserRepository.Repository,
      private idProvider: IdProvider,
    ) {}

    private async generateUniqueCode(retries = 5) {
      for (let i = 0; i < retries; i++) {
        const code = await this.idProvider.generateId();
        const exists = await this.linkRepo.existsShortCode(code);
        if (!exists) return code;
      }
      throw new InternalServerError('Failed to generate unique short code');
    }

    async execute(input: {
      url: string;
      ownerId?: string | null;
    }): Promise<Output> {
      if (input.ownerId !== undefined && input.ownerId !== null) {
        await this.userRepo.findById(input.ownerId);
        const urlExists = await this.linkRepo.findByOriginalUrlAndOwnerId(
          input.url,
          input.ownerId,
        );
        if (urlExists) {
          throw new ConflictException('URL already shortened');
        }
      }
      const code = await this.generateUniqueCode();
      const link = new LinkEntity({
        originalUrl: input.url,
        shortCode: code,
        ownerId: input.ownerId ?? null,
      });

      await this.linkRepo.insert(link);
      return LinkOutputMapper.toOutput(link);
    }
  }
}
