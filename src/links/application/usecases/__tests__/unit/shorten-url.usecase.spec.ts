import { ShortenUrlUseCase } from '../../shorten-url.usecase';
import { LinkInMemoryRepository } from '@/links/infrastructure/database/in-memory/repositories/link-in-memory.repository';
import { UserInMemoryRepository } from '@/users/infrastructure/database/in-memory/repositories/user-in-memory.repository';
import { IdProvider } from '@/shared/application/providers/id-provider';
import { InternalServerError } from '@/shared/application/errors/internal-server-error';
import { UserEntity } from '@/users/domain/entities/user.entity';
import { UserDataBuilder } from '@/users/domain/testing/helpers/user-data-builder';
import { NotFoundError } from 'rxjs';

describe('ShortenUrlUseCase unit tests', () => {
  let sut: ShortenUrlUseCase.UseCase;
  let linkRepo: LinkInMemoryRepository;
  let userRepo: UserInMemoryRepository;
  let idProvider: IdProvider;

  beforeEach(() => {
    linkRepo = new LinkInMemoryRepository();
    userRepo = new UserInMemoryRepository();

    idProvider = {
      generateId: jest.fn(),
    };

    sut = new ShortenUrlUseCase.UseCase(linkRepo, userRepo, idProvider);
  });

  it('Should create a short URL successfully', async () => {
    const spyInsert = jest.spyOn(linkRepo, 'insert');
    const spyExistsCode = jest
      .spyOn(linkRepo, 'existsShortCode')
      .mockResolvedValue(false);

    (idProvider.generateId as jest.Mock).mockResolvedValue('abc123');

    const result = await sut.execute({ url: 'https://google.com' });

    expect(spyExistsCode).toHaveBeenCalledTimes(1);
    expect(spyInsert).toHaveBeenCalledTimes(1);
    expect(result.shortCode).toBe('abc123');
    expect(result.originalUrl).toBe('https://google.com');
  });

  it('Should validate ownerId and succeed if user exists', async () => {
    const userEntity = new UserEntity(UserDataBuilder({ email: 'a@a.com' }));
    userRepo.insert(userEntity);

    jest.spyOn(userRepo, 'findById').mockResolvedValue(userEntity);

    jest.spyOn(linkRepo, 'existsShortCode').mockResolvedValue(false);
    (idProvider.generateId as jest.Mock).mockResolvedValue('code1');

    const output = await sut.execute({
      url: 'https://site.com',
      ownerId: userEntity.id,
    });

    expect(output.ownerId).toBe(userEntity.id);
  });

  it('Should throw error when ownerId is provided but user does not exist', async () => {
    jest
      .spyOn(userRepo, 'findById')
      .mockRejectedValue(
        new NotFoundError(`LinkModel not found using ID non-existent-id`),
      );

    const props = {
      url: 'https://google.com',
      ownerId: 'non-existent-id',
    };

    await expect(() => sut.execute(props)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('Should retry generating unique code when collision happens', async () => {
    const spyExists = jest.spyOn(linkRepo, 'existsShortCode');

    (idProvider.generateId as jest.Mock)
      .mockResolvedValueOnce('dup')
      .mockResolvedValueOnce('dup')
      .mockResolvedValueOnce('unique');

    spyExists
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const result = await sut.execute({ url: 'https://google.com' });

    expect(idProvider.generateId).toHaveBeenCalledTimes(3);
    expect(result.shortCode).toBe('unique');
  });

  it('Should throw InternalServerError if cannot generate unique code', async () => {
    (idProvider.generateId as jest.Mock).mockResolvedValue('dup');

    jest.spyOn(linkRepo, 'existsShortCode').mockResolvedValue(true);

    await expect(() =>
      sut.execute({ url: 'https://google.com' }),
    ).rejects.toBeInstanceOf(InternalServerError);
  });

  it('Should insert with ownerId null if not provided', async () => {
    jest.spyOn(linkRepo, 'existsShortCode').mockResolvedValue(false);
    (idProvider.generateId as jest.Mock).mockResolvedValue('abc');

    const result = await sut.execute({ url: 'https://google.com' });

    expect(result.ownerId).toBeNull();
  });
});
