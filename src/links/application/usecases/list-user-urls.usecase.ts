import { LinkRepository } from '@/links/domain/repositories/link.repository';
import { LinkOutput, LinkOutputMapper } from '../dtos/link-output';
import { UseCase as DefaultUseCase } from '@/shared/application/usecases/use-case';

export namespace ListUserUrlsUseCase {
  export type Input = {
    userId: string;
  };

  export type Output = {
    items: LinkOutput[];
  };

  export class UseCase implements DefaultUseCase<Input, Output> {
    constructor(private linkRepository: LinkRepository.Repository) {}

    async execute(input: Input): Promise<Output> {
      const result = await this.linkRepository.findAllByOwner(input.userId);

      return {
        items: result.map(LinkOutputMapper.toOutput),
      };
    }
  }
}
