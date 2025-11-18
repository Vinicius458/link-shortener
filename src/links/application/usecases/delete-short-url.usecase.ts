import { LinkRepository } from '@/links/domain/repositories/link.repository';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { UseCase as DefaultUseCase } from '@/shared/application/usecases/use-case';
import { ConflictException } from '@nestjs/common';

export namespace DeleteShortUrlUseCase {
  export type Input = {
    id: string;
    userId: string;
  };

  export type Output = void;

  export class UseCase implements DefaultUseCase<Input, Output> {
    constructor(private linkRepository: LinkRepository.Repository) {}

    async execute(input: Input): Promise<Output> {
      const entity = await this.linkRepository.findById(input.id);

      if (!entity || entity.deletedAt) {
        throw new NotFoundError(`Short URL with id ${input.id} not found`);
      }

      if (entity.ownerId !== input.userId) {
        throw new ConflictException(
          'You do not have permission to delete this short URL',
        );
      }

      entity.softDelete();

      await this.linkRepository.update(entity);
    }
  }
}
