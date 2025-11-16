import { LinkRepository } from '@/links/domain/repositories/link.repository';
import { UseCase as DefaultUseCase } from '@/shared/application/usecases/use-case';
import { BadRequestError } from '@/shared/application/errors/bad-request-error';
import { LinkOutput, LinkOutputMapper } from '../dtos/link-output';

export namespace RedirectByAliasUseCase {
  export type Input = {
    alias: string;
    // ip?: string | null;
    // userAgent?: string | null;
    // referrer?: string | null;
  };

  export type Output = LinkOutput;

  export class UseCase implements DefaultUseCase<Input, Output> {
    constructor(private shortUrlRepository: LinkRepository.Repository) {}

    async execute(input: Input): Promise<Output> {
      const shortUrl = await this.shortUrlRepository.findByAlias(input.alias);

      if (!shortUrl || shortUrl.deletedAt) {
        throw new BadRequestError('Short URL not found');
      }

      shortUrl.incrementClicks();
      await this.shortUrlRepository.update(shortUrl);

      return LinkOutputMapper.toOutput(shortUrl);
    }
  }
}
