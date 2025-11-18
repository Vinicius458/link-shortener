import { LinkRepository } from '@/links/domain/repositories/link.repository';
import { RedirectByAliasUseCase } from '../../redirect-by-alias.usecase';
import { LinkEntity } from '@/links/domain/entities/link.entity';
import { LinkOutputMapper } from '@/links/application/dtos/link-output';
import { NotFoundException } from '@nestjs/common';

describe('RedirectByAliasUseCase', () => {
  let useCase: RedirectByAliasUseCase.UseCase;
  let repository: jest.Mocked<LinkRepository.Repository>;
  let linkEntity: LinkEntity;

  beforeEach(() => {
    repository = {
      findByAlias: jest.fn(),
      update: jest.fn(),
    } as any;

    useCase = new RedirectByAliasUseCase.UseCase(repository);

    linkEntity = new LinkEntity({
      ownerId: 'user-1',
      shortCode: 'abc123',
      originalUrl: 'https://example.com',
      clicks: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    jest.spyOn(linkEntity, 'incrementClicks');
  });

  it('should redirect successfully and increment clicks', async () => {
    repository.findByAlias.mockResolvedValue(linkEntity);

    const result = await useCase.execute({ alias: 'abc123' });

    expect(repository.findByAlias).toHaveBeenCalledWith('abc123');
    expect(linkEntity.incrementClicks).toHaveBeenCalledTimes(1);
    expect(repository.update).toHaveBeenCalledWith(linkEntity);

    const expectedOutput = LinkOutputMapper.toOutput(linkEntity);

    expect(result).toEqual(expectedOutput);
  });

  it('should throw an error if the alias does not exist', async () => {
    repository.findByAlias.mockResolvedValue(null);

    await expect(useCase.execute({ alias: 'notfound' })).rejects.toThrow(
      new NotFoundException('Short URL not found'),
    );
  });

  it('should throw an error if the short URL is deleted', async () => {
    const deletedLink = { ...linkEntity, deletedAt: new Date() } as LinkEntity;

    repository.findByAlias.mockResolvedValue(deletedLink);

    await expect(useCase.execute({ alias: 'abc123' })).rejects.toThrow(
      new NotFoundException('Short URL not found'),
    );
  });
});
