import { instanceToPlain } from 'class-transformer';
import {
  ShortUrlPresenter,
  ShortUrlCollectionPresenter,
} from '../../short-url.presenter';

describe('ShortUrlPresenter unit tests', () => {
  const createdAt = new Date();
  const props = {
    id: '123',
    shortCode: `abc123`,
    originalUrl: 'https://google.com',
    clicks: 10,
    createdAt,
    ownerId: null,
    updatedAt: new Date(),
    deletedAt: null,
  };

  let sut: ShortUrlPresenter;

  beforeEach(() => {
    sut = new ShortUrlPresenter(props);
  });

  describe('constructor', () => {
    it('should set values', () => {
      expect(sut.id).toEqual(props.id);
      expect(sut.shortCode).toEqual(
        `${process.env.APP_BASE_URL}/urls/${props.shortCode}`,
      );
      expect(sut.originalUrl).toEqual(props.originalUrl);
      expect(sut.clicks).toEqual(props.clicks);
      expect(sut.createdAt).toEqual(props.createdAt);
    });
  });

  it('should presenter data', () => {
    const output = instanceToPlain(sut);
    expect(output).toStrictEqual({
      id: '123',
      shortCode: `${process.env.APP_BASE_URL}/urls/abc123`,
      originalUrl: 'https://google.com',
      clicks: 10,
      createdAt: createdAt.toISOString(),
    });
  });
});

describe('ShortUrlCollectionPresenter unit tests', () => {
  const createdAt = new Date();
  const props = {
    id: '123',
    shortCode: `abc123`,
    originalUrl: 'https://google.com',
    clicks: 10,
    createdAt,
    ownerId: 'any_id',
    updatedAt: new Date(),
    deletedAt: null,
  };

  it('should presenter data without meta', () => {
    let sut = new ShortUrlCollectionPresenter({
      items: [props],
    });

    const output = instanceToPlain(sut);
    expect(output).toStrictEqual({
      data: [
        {
          id: '123',
          shortCode: `${process.env.APP_BASE_URL}/urls/abc123`,
          originalUrl: 'https://google.com',
          clicks: 10,
          createdAt: createdAt.toISOString(),
        },
      ],
    });
  });
});
