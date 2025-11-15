import { LinkEntity, LinkProps } from '../../link.entity';
import { LinkDataBuilder } from '@/links/domain/testing/helpers/link-data-builder';
import { EntityValidationError } from '@/shared/domain/errors/validation-error';

describe('LinkEntity integration tests', () => {
  describe('Constructor method', () => {
    it('Should throw an error when creating a link with invalid originalUrl', () => {
      let props: LinkProps = {
        ...LinkDataBuilder({}),
        originalUrl: null as any,
      };
      expect(() => new LinkEntity(props)).toThrow(EntityValidationError);

      props = {
        ...LinkDataBuilder({}),
        originalUrl: '',
      };
      expect(() => new LinkEntity(props)).toThrow(EntityValidationError);

      props = {
        ...LinkDataBuilder({}),
        originalUrl: 10 as any,
      };
      expect(() => new LinkEntity(props)).toThrow(EntityValidationError);
    });

    it('Should throw an error when creating a link with invalid shortCode', () => {
      let props: LinkProps = {
        ...LinkDataBuilder({}),
        shortCode: null as any,
      };
      expect(() => new LinkEntity(props)).toThrow(EntityValidationError);

      props = {
        ...LinkDataBuilder({}),
        shortCode: '',
      };
      expect(() => new LinkEntity(props)).toThrow(EntityValidationError);

      props = {
        ...LinkDataBuilder({}),
        shortCode: 10 as any,
      };
      expect(() => new LinkEntity(props)).toThrow(EntityValidationError);

      props = {
        ...LinkDataBuilder({}),
        shortCode: 'a'.repeat(20),
      };
      expect(() => new LinkEntity(props)).toThrow(EntityValidationError);
    });

    it('Should throw an error when creating a link with invalid clicks', () => {
      let props: LinkProps = {
        ...LinkDataBuilder({}),
        clicks: -1,
      };
      expect(() => new LinkEntity(props)).toThrow(EntityValidationError);

      props = {
        ...LinkDataBuilder({}),
        clicks: 'abc' as any,
      };
      expect(() => new LinkEntity(props)).toThrow(EntityValidationError);
    });

    it('Should throw an error when creating a link with invalid timestamps', () => {
      let props: LinkProps = {
        ...LinkDataBuilder({}),
        createdAt: '2023' as any,
      };
      expect(() => new LinkEntity(props)).toThrow(EntityValidationError);

      props = {
        ...LinkDataBuilder({}),
        updatedAt: 10 as any,
      };
      expect(() => new LinkEntity(props)).toThrow(EntityValidationError);

      props = {
        ...LinkDataBuilder({}),
        deletedAt: 'aaa' as any,
      };
      expect(() => new LinkEntity(props)).toThrow(EntityValidationError);
    });

    it('Should create a valid link', () => {
      expect.assertions(0);

      const props: LinkProps = {
        ...LinkDataBuilder({}),
      };

      new LinkEntity(props);
    });
  });

  describe('updateOriginalUrl method', () => {
    it('Should throw an error with invalid URL', () => {
      const entity = new LinkEntity(LinkDataBuilder({}));

      expect(() => entity.updateOriginalUrl(null as any)).toThrow(
        EntityValidationError,
      );
      expect(() => entity.updateOriginalUrl('')).toThrow(EntityValidationError);
      expect(() => entity.updateOriginalUrl(10 as any)).toThrow(
        EntityValidationError,
      );
    });

    it('Should update the originalUrl with a valid URL', () => {
      expect.assertions(0);

      const props = LinkDataBuilder({});
      const entity = new LinkEntity(props);

      entity.updateOriginalUrl('https://new-url.com');
    });
  });

  describe('incrementClicks method', () => {
    it('Should increment clicks correctly', () => {
      const entity = new LinkEntity(LinkDataBuilder({ clicks: 0 }));

      entity.incrementClicks();
      expect(entity.clicks).toBe(1);

      entity.incrementClicks();
      expect(entity.clicks).toBe(2);
    });
  });

  describe('softDelete method', () => {
    it('Should set deletedAt', () => {
      const entity = new LinkEntity(LinkDataBuilder({ deletedAt: null }));

      expect(entity.deletedAt).toBeNull();

      entity.softDelete();

      expect(entity.deletedAt).toBeInstanceOf(Date);
    });
  });
});
