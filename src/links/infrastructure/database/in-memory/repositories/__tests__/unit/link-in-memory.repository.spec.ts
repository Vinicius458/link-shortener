import { LinkInMemoryRepository } from '../../link-in-memory.repository';
import { LinkEntity } from '@/links/domain/entities/link.entity';
import { NotFoundError } from '@/shared/domain/errors/not-found-error';

describe('LinkInMemoryRepository unit tests', () => {
  let sut: LinkInMemoryRepository;

  const makeEntity = (props?: Partial<LinkEntity['props']>) =>
    new LinkEntity({
      originalUrl: props?.originalUrl ?? 'https://example.com',
      shortCode: props?.shortCode ?? Math.random().toString(36).substring(2, 8),
      clicks: props?.clicks ?? 0,
      ownerId: props?.ownerId ?? null,
      createdAt: props?.createdAt ?? new Date(),
      deletedAt: props?.deletedAt ?? null,
    });

  beforeEach(() => {
    sut = new LinkInMemoryRepository();
  });

  it('Should throw error when not found - findByShortCode method', async () => {
    await expect(sut.findByShortCode('xxxxx')).rejects.toThrow(
      new NotFoundError('Entity not found using shortCode xxxxx'),
    );
  });

  it('Should find entity by shortCode - findByShortCode method', async () => {
    const entity = makeEntity({ shortCode: 'abc123' });
    await sut.insert(entity);

    const result = await sut.findByShortCode('abc123');
    expect(result.toJSON()).toStrictEqual(entity.toJSON());
  });

  it('Should return true if shortCode exists - existsShortCode method', async () => {
    const entity = makeEntity({ shortCode: 'abc123' });
    await sut.insert(entity);

    expect(await sut.existsShortCode('abc123')).toBe(true);
  });

  it('Should return false if shortCode does not exist - existsShortCode method', async () => {
    expect(await sut.existsShortCode('fake')).toBe(false);
  });

  it('Should not filter items when filter param is null', async () => {
    const entity = makeEntity();
    await sut.insert(entity);

    const items = await sut.findAll();
    const spy = jest.spyOn(items, 'filter');

    const filtered = await sut['applyFilter'](items, null);

    expect(spy).not.toHaveBeenCalled();
    expect(filtered).toStrictEqual(items);
  });

  it('Should filter by originalUrl - applyFilter', async () => {
    const items = [
      makeEntity({ originalUrl: 'https://google.com' }),
      makeEntity({ originalUrl: 'https://GOOGLE.com' }),
      makeEntity({ originalUrl: 'https://fake.com' }),
    ];

    const spy = jest.spyOn(items, 'filter');
    const filtered = await sut['applyFilter'](items, 'google');

    expect(spy).toHaveBeenCalled();
    expect(filtered).toStrictEqual([items[0], items[1]]);
  });

  it('Should sort by createdAt when sort param is null', async () => {
    const createdAt = new Date();

    const items = [
      makeEntity({ createdAt: createdAt }),
      makeEntity({ createdAt: new Date(createdAt.getTime() + 1) }),
      makeEntity({ createdAt: new Date(createdAt.getTime() + 2) }),
    ];

    const sorted = await sut['applySort'](items, null, null);

    expect(sorted).toStrictEqual([items[2], items[1], items[0]]);
  });

  it('Should sort by clicks field', async () => {
    const items = [
      makeEntity({ clicks: 10 }),
      makeEntity({ clicks: 30 }),
      makeEntity({ clicks: 20 }),
    ];

    let sorted = await sut['applySort'](items, 'clicks', 'asc');
    expect(sorted).toStrictEqual([items[0], items[2], items[1]]);

    sorted = await sut['applySort'](items, 'clicks', 'desc');
    expect(sorted).toStrictEqual([items[1], items[2], items[0]]);
  });

  it('Should insert and findById an entity', async () => {
    const entity = makeEntity();
    await sut.insert(entity);

    const result = await sut.findById(entity._id);
    expect(result.toJSON()).toStrictEqual(entity.toJSON());
  });

  it('Should throw error on findById when entity does not exist', async () => {
    await expect(sut.findById('fake-id')).rejects.toThrow(
      new NotFoundError('Entity not found using ID fake-id'),
    );
  });

  it('Should soft delete an entity', async () => {
    const entity = makeEntity();
    await sut.insert(entity);

    await sut.delete(entity._id);

    const result = await sut.findById(entity._id);
    expect(result.deletedAt).toBeInstanceOf(Date);
  });

  it('Should increment clicks', async () => {
    const entity = makeEntity({ clicks: 0 });
    await sut.insert(entity);

    await sut.incrementClicks(entity._id);

    const updated = await sut.findById(entity._id);
    expect(updated.clicks).toBe(1);
  });

  it('Should return all links from an owner - findAllByOwner', async () => {
    const items = [
      makeEntity({ ownerId: 'user1' }),
      makeEntity({ ownerId: 'user1' }),
      makeEntity({ ownerId: 'user2' }),
      makeEntity({ ownerId: 'user1', deletedAt: new Date() }), // soft deleted
    ];

    for (const i of items) await sut.insert(i);

    const result = await sut.findAllByOwner('user1');

    expect(result).toStrictEqual([items[0], items[1]]);
  });
});
