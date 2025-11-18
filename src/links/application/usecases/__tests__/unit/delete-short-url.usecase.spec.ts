import { LinkRepository } from '@/links/domain/repositories/link.repository';
import { NotFoundError } from '@/shared/application/errors/not-found-error';
import { DeleteShortUrlUseCase } from '../../delete-short-url.usecase';
import { LinkEntity } from '@/links/domain/entities/link.entity';
import { ConflictException } from '@nestjs/common';

describe('DeleteShortUrlUseCase Unit Tests', () => {
  let useCase: DeleteShortUrlUseCase.UseCase;
  let repository: jest.Mocked<LinkRepository.Repository>;
  let linkEntity: LinkEntity;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      update: jest.fn(),
    } as any;

    useCase = new DeleteShortUrlUseCase.UseCase(repository);

    linkEntity = new LinkEntity({
      ownerId: 'user-001',
      shortCode: 'abc123',
      originalUrl: 'https://test.com',
      clicks: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    jest.spyOn(linkEntity, 'softDelete');
  });

  it('should delete the short URL successfully', async () => {
    repository.findById.mockResolvedValue(linkEntity);

    const input = {
      id: 'link-001',
      userId: 'user-001',
    };

    await useCase.execute(input);

    expect(repository.findById).toHaveBeenCalledWith('link-001');
    expect(linkEntity.softDelete).toHaveBeenCalledTimes(1);
    expect(repository.update).toHaveBeenCalledWith(linkEntity);
  });

  it('should throw an error if the short URL does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 'not-found', userId: 'user-001' }),
    ).rejects.toThrow(
      new NotFoundError('Short URL with id not-found not found'),
    );
  });

  it('should throw an error if the short URL is deleted', async () => {
    const deletedEntity = {
      ...linkEntity,
      deletedAt: new Date(),
    } as LinkEntity;

    repository.findById.mockResolvedValue(deletedEntity);

    await expect(
      useCase.execute({ id: 'link-001', userId: 'user-001' }),
    ).rejects.toThrow(
      new NotFoundError('Short URL with id link-001 not found'),
    );
  });

  it('should throw an error if the user is not the owner', async () => {
    repository.findById.mockResolvedValue(linkEntity);

    await expect(
      useCase.execute({ id: 'link-001', userId: 'other-user' }),
    ).rejects.toThrow(
      new ConflictException(
        'You do not have permission to delete this short URL',
      ),
    );
  });
});
