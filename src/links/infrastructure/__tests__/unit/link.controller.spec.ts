import { ShortenUrlDto } from '../../dtos/shorten-url.dto';
import {
  UpdateShortUrlParamsDto,
  UpdateShortUrlBodyDto,
} from '../../dtos/update-short-url.dto';
import { DeleteShortUrlDto } from '../../dtos/delete-short-url.dto';

import {
  ShortUrlPresenter,
  ShortUrlCollectionPresenter,
} from '../../presenters/short-url.presenter';
import { LinksController } from '../../link.controller';
import { ShortenUrlPresenter } from '../../presenters/shorten-url.presenter';

describe('LinksController unit tests', () => {
  let sut: LinksController;

  const id = 'df96ae94-6128-486e-840c-b6f78abb4801';

  const outputUrl = {
    id,
    alias: `abc123`,
    originalUrl: 'https://google.com',
    ownerId: id,
    createdAt: new Date(),
  };

  beforeEach(() => {
    sut = new LinksController();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should shorten a url', async () => {
    const mockShortenUseCase = {
      execute: jest.fn().mockResolvedValue(outputUrl),
    };
    sut['shortenUrlUseCase'] = mockShortenUseCase as any;

    const dto: ShortenUrlDto = {
      url: 'https://google.com',
    };

    const req: any = {
      user: id,
    };

    const presenter = await sut.shorten(dto, req);

    expect(presenter).toBeInstanceOf(ShortenUrlPresenter);
    expect(mockShortenUseCase.execute).toHaveBeenCalledWith({
      ...dto,
      ownerId: id,
    });
  });

  it('should redirect by alias', async () => {
    const mockRedirectUseCase = {
      execute: jest.fn().mockResolvedValue(outputUrl),
    };
    sut['redirectUseCase'] = mockRedirectUseCase as any;

    const params = { alias: 'abc123' };
    const res = {
      redirect: jest.fn(),
    } as any;

    await sut.redirect(params as any, res);

    expect(mockRedirectUseCase.execute).toHaveBeenCalledWith({
      alias: params.alias,
    });
    expect(res.redirect).toHaveBeenCalledWith(outputUrl.originalUrl);
  });

  it('should list urls of the authenticated user', async () => {
    const outputItems = { items: [outputUrl] };
    const mockListUseCase = {
      execute: jest.fn().mockResolvedValue(outputItems),
    };
    sut['listUserUrlsUseCase'] = mockListUseCase as any;

    const req: any = {
      user: id,
    };

    const presenter = await sut.list(req);
    expect(presenter).toBeInstanceOf(ShortUrlCollectionPresenter);
    expect(mockListUseCase.execute).toHaveBeenCalledWith({
      userId: id,
    });
  });

  it('should update a short url', async () => {
    const mockUpdateUseCase = {
      execute: jest.fn().mockResolvedValue(outputUrl),
    };
    sut['updateShortUrlUseCase'] = mockUpdateUseCase as any;

    const params: UpdateShortUrlParamsDto = { id };
    const req: any = {
      user: id,
    };
    const dto: UpdateShortUrlBodyDto = {
      newOriginalUrl: 'https://github.com',
    };

    const presenter = await sut.update(params, req, dto);

    expect(presenter).toBeInstanceOf(ShortUrlPresenter);
    expect(mockUpdateUseCase.execute).toHaveBeenCalledWith({
      id,
      userId: id,
      ...dto,
    });
  });

  it('should delete a short url', async () => {
    const mockDeleteUseCase = {
      execute: jest.fn().mockResolvedValue(undefined),
    };
    sut['deleteShortUrlUseCase'] = mockDeleteUseCase as any;

    const params: DeleteShortUrlDto = { id };
    const req: any = {
      user: id,
    };

    const result = await sut.remove(params, req);

    expect(result).toBeUndefined();
    expect(mockDeleteUseCase.execute).toHaveBeenCalledWith({
      id,
      userId: id,
    });
  });
});
