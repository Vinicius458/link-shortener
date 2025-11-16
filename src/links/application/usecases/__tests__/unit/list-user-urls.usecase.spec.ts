import { ListUserUrlsUseCase } from '../../list-user-urls.usecase';
import { LinkInMemoryRepository } from '@/links/infrastructure/database/in-memory/repositories/link-in-memory.repository';
import { LinkEntity } from '@/links/domain/entities/link.entity';

describe('ListUserUrlsUseCase unit tests', () => {
  let sut: ListUserUrlsUseCase.UseCase;
  let linkRepo: LinkInMemoryRepository;

  beforeEach(() => {
    linkRepo = new LinkInMemoryRepository();
    sut = new ListUserUrlsUseCase.UseCase(linkRepo);
  });

  it('Should return a list of URLs owned by the user', async () => {
    const userId = 'user-123';

    const link1 = new LinkEntity({
      ownerId: userId,
      originalUrl: 'https://google.com',
      shortCode: 'abc111',
      clicks: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const link2 = new LinkEntity({
      ownerId: userId,
      originalUrl: 'https://github.com',
      shortCode: 'xyz222',
      clicks: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    linkRepo.items = [link1, link2];

    const spyFind = jest
      .spyOn(linkRepo, 'findAllByOwner')
      .mockResolvedValue([link1, link2]);

    const output = await sut.execute({ userId });

    expect(spyFind).toHaveBeenCalledTimes(1);
    expect(spyFind).toHaveBeenCalledWith(userId);

    expect(output.items.length).toBe(2);

    expect(output.items[0]).toMatchObject({
      id: link1.id,
      originalUrl: link1.originalUrl,
      shortCode: link1.shortCode,
      ownerId: userId,
      clicks: 5,
    });

    expect(output.items[1]).toMatchObject({
      id: link2.id,
      originalUrl: link2.originalUrl,
      shortCode: link2.shortCode,
      ownerId: userId,
      clicks: 10,
    });
  });

  it('Should return an empty list when user has no URLs', async () => {
    const userId = 'no-links-user';

    jest.spyOn(linkRepo, 'findAllByOwner').mockResolvedValue([]);

    const output = await sut.execute({ userId });

    expect(output.items).toEqual([]);
  });
});
