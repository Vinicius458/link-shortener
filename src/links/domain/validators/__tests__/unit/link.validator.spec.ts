import { LinkDataBuilder } from '@/links/domain/testing/helpers/link-data-builder';
import {
  LinkRules,
  LinkValidator,
  LinkValidatorFactory,
} from '../../link.validator';
import { LinkProps } from '@/links/domain/entities/link.entity';

let sut: LinkValidator;
let props: LinkProps;

describe('LinkValidator unit tests', () => {
  beforeEach(() => {
    sut = LinkValidatorFactory.create();
    props = LinkDataBuilder({});
  });

  it('Invalidation cases for originalUrl field', () => {
    let isValid = sut.validate(null as any);
    expect(isValid).toBeFalsy();
    expect(sut.errors!['originalUrl']).toStrictEqual([
      'originalUrl should not be empty',
      'originalUrl must be a URL address',
    ]);

    isValid = sut.validate({ ...props, originalUrl: '' });
    expect(isValid).toBeFalsy();
    expect(sut.errors!['originalUrl']).toStrictEqual([
      'originalUrl should not be empty',
      'originalUrl must be a URL address',
    ]);

    isValid = sut.validate({ ...props, originalUrl: 10 as any });
    expect(isValid).toBeFalsy();
    expect(sut.errors!['originalUrl']).toStrictEqual([
      'originalUrl must be a URL address',
    ]);

    isValid = sut.validate({ ...props, originalUrl: 'invalid-url' });
    expect(isValid).toBeFalsy();
    expect(sut.errors!['originalUrl']).toStrictEqual([
      'originalUrl must be a URL address',
    ]);
  });

  it('Invalidation cases for shortCode field', () => {
    let isValid = sut.validate(null as any);
    expect(isValid).toBeFalsy();
    expect(sut.errors!['shortCode']).toEqual(
      expect.arrayContaining([
        'shortCode should not be empty',
        'shortCode must be a string',
        'shortCode must be longer than or equal to 1 characters',
      ]),
    );

    isValid = sut.validate({ ...props, shortCode: '' });
    expect(isValid).toBeFalsy();
    expect(sut.errors!['shortCode']).toEqual(
      expect.arrayContaining([
        'shortCode should not be empty',
        'shortCode must be longer than or equal to 1 characters',
      ]),
    );

    isValid = sut.validate({ ...props, shortCode: 10 as any });
    expect(isValid).toBeFalsy();
    expect(sut.errors!['shortCode']).toEqual(
      expect.arrayContaining([
        'shortCode must be a string',
        'shortCode must be longer than or equal to 1 and shorter than or equal to 6 characters',
      ]),
    );

    isValid = sut.validate({ ...props, shortCode: 'a'.repeat(8) });
    expect(isValid).toBeFalsy();
    expect(sut.errors!['shortCode']).toStrictEqual([
      'shortCode must be shorter than or equal to 6 characters',
    ]);
  });

  it('Invalidation cases for clicks field', () => {
    let isValid = sut.validate({ ...props, clicks: -1 });
    expect(isValid).toBeFalsy();
    expect(sut.errors!['clicks']).toStrictEqual([
      'clicks must not be less than 0',
    ]);

    isValid = sut.validate({ ...props, clicks: 'abc' as any });
    expect(isValid).toBeFalsy();
    expect(sut.errors!['clicks']).toStrictEqual([
      'clicks must not be less than 0',
      'clicks must be an integer number',
    ]);
  });

  it('Invalidation cases for date fields', () => {
    let isValid = sut.validate({ ...props, createdAt: 123 as any });
    expect(isValid).toBeFalsy();
    expect(sut.errors!['createdAt']).toStrictEqual([
      'createdAt must be a Date instance',
    ]);

    isValid = sut.validate({ ...props, updatedAt: 'abc' as any });
    expect(isValid).toBeFalsy();
    expect(sut.errors!['updatedAt']).toStrictEqual([
      'updatedAt must be a Date instance',
    ]);

    isValid = sut.validate({ ...props, deletedAt: '2023-01-01' as any });
    expect(isValid).toBeFalsy();
    expect(sut.errors!['deletedAt']).toStrictEqual([
      'deletedAt must be a Date instance',
    ]);
  });

  it('Valid case for link rules', () => {
    const isValid = sut.validate(props);
    expect(isValid).toBeTruthy();
    expect(sut.validatedData).toStrictEqual(new LinkRules(props));
  });
});
