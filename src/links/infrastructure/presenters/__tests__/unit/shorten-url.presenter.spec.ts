import { LinkEntity, LinkProps } from '@/links/domain/entities/link.entity';
import { LinkDataBuilder } from '@/links/domain/testing/helpers/link-data-builder';
import { ShortenUrlPresenter } from '@/links/infrastructure/presenters/shorten-url.presenter';
import { instanceToPlain } from 'class-transformer';

describe('ShortenUrlPresenter unit tests', () => {
  let props: LinkProps;

  beforeEach(() => {
    props = LinkDataBuilder({ shortCode: 'abc123' });
  });

  it('should set the shortUrl property correctly', () => {
    const linkOutput = new LinkEntity(props);
    const sut = new ShortenUrlPresenter(linkOutput);

    expect(sut.shortUrl).toBe(
      `${process.env.APP_BASE_URL}/urls/${linkOutput.shortCode}`,
    );
  });

  it('should serialize correctly using instanceToPlain', () => {
    const linkOutput = new LinkEntity(props);
    const sut = new ShortenUrlPresenter(linkOutput);

    const output = instanceToPlain(sut);

    expect(output).toStrictEqual({
      shortUrl: `${process.env.APP_BASE_URL}/urls/abc123`,
    });
  });
});
