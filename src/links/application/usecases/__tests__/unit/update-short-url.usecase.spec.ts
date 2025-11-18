import { LinkRepository } from '@/links/domain/repositories/link.repository';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { UpdateShortUrlDestinationUseCase } from '../../update-short-url.usecase';
import { LinkEntity } from '@/links/domain/entities/link.entity';
import { LinkOutputMapper } from '@/links/application/dtos/link-output';
import { ConflictException } from '@nestjs/common';

describe('UpdateShortUrlDestinationUseCase', () => {
  let useCase: UpdateShortUrlDestinationUseCase.UseCase;
  let repository: jest.Mocked<LinkRepository.Repository>;
  let linkEntity: LinkEntity;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      update: jest.fn(),
    } as any;

    useCase = new UpdateShortUrlDestinationUseCase.UseCase(repository);

    linkEntity = new LinkEntity({
      ownerId: 'user-123',
      shortCode: 'abc123',
      originalUrl: 'https://old-url.com',
      clicks: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    jest.spyOn(linkEntity, 'updateOriginalUrl');
  });

  it('should update the original URL successfully', async () => {
    repository.findById.mockResolvedValue(linkEntity);

    const input = {
      id: 'link-123',
      userId: 'user-123',
      newOriginalUrl: 'https://new-url.com',
    };

    const result = await useCase.execute(input);

    expect(repository.findById).toHaveBeenCalledWith('link-123');
    expect(linkEntity.updateOriginalUrl).toHaveBeenCalledWith(
      'https://new-url.com',
    );
    expect(repository.update).toHaveBeenCalledWith(linkEntity);

    const expectedOutput = LinkOutputMapper.toOutput(linkEntity);

    expect(result).toEqual(expectedOutput);
  });

  it('should throw an error if the short URL does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        id: '404',
        userId: 'user-123',
        newOriginalUrl: 'https://new-url.com',
      }),
    ).rejects.toThrow(new NotFoundError('Short URL with id 404 not found'));
  });

  it('should throw an error if the short URL is deleted', async () => {
    const deletedEntity = {
      ...linkEntity,
      deletedAt: new Date(),
    } as LinkEntity;

    repository.findById.mockResolvedValue(deletedEntity);

    await expect(
      useCase.execute({
        id: 'link-123',
        userId: 'user-123',
        newOriginalUrl: 'https://new-url.com',
      }),
    ).rejects.toThrow(
      new NotFoundError('Short URL with id link-123 not found'),
    );
  });

  it('should throw an error if the user is not the owner', async () => {
    repository.findById.mockResolvedValue(linkEntity);

    await expect(
      useCase.execute({
        id: 'link-123',
        userId: 'other-user',
        newOriginalUrl: 'https://new-url.com',
      }),
    ).rejects.toThrow(
      new ConflictException(
        'You do not have permission to update this short URL',
      ),
    );
  });
});
