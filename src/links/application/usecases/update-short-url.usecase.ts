import { LinkRepository } from '@/links/domain/repositories/link.repository';
import { LinkOutput, LinkOutputMapper } from '../dtos/link-output';
import { UseCase as DefaultUseCase } from '@/shared/application/usecases/use-case';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { ForbiddenError } from '@/shared/application/errors/forbidden-error';

export namespace UpdateShortUrlDestinationUseCase {
  export type Input = {
    id: string;
    userId: string;
    newOriginalUrl: string;
  };

  export type Output = LinkOutput;

  export class UseCase implements DefaultUseCase<Input, Output> {
    constructor(private linkRepository: LinkRepository.Repository) {}

    async execute(input: Input): Promise<Output> {
      const entity = await this.linkRepository.findById(input.id);

      if (!entity || entity.deletedAt) {
        throw new NotFoundError(`Short URL with id ${input.id} not found`);
      }

      // Garante que apenas o dono pode editar
      if (entity.ownerId !== input.userId) {
        throw new ForbiddenError(
          'You do not have permission to update this short URL',
        );
      }

      entity.updateOriginalUrl(input.newOriginalUrl);

      await this.linkRepository.update(entity);

      return LinkOutputMapper.toOutput(entity);
    }
  }
}
