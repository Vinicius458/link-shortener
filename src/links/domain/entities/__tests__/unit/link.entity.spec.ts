import { LinkEntity, LinkProps } from '../../link.entity';
import { LinkDataBuilder } from '@/links/domain/testing/helpers/link-data-builder';

describe('LinkEntity unit tests', () => {
  let props: LinkProps;
  let sut: LinkEntity;

  beforeEach(() => {
    LinkEntity.validate = jest.fn();
    props = LinkDataBuilder({});
    sut = new LinkEntity(props);
  });

  it('Constructor method', () => {
    expect(LinkEntity.validate).toHaveBeenCalled();
    expect(sut.props.originalUrl).toEqual(props.originalUrl);
    expect(sut.props.shortCode).toEqual(props.shortCode);
    expect(sut.props.ownerId).toEqual(props.ownerId);
    expect(sut.props.clicks).toEqual(0);
    expect(sut.props.createdAt).toBeInstanceOf(Date);
    expect(sut.props.updatedAt).toBeInstanceOf(Date);
    expect(sut.props.deletedAt).toBeNull();
  });

  it('Getter of originalUrl field', () => {
    expect(sut.originalUrl).toBeDefined();
    expect(sut.originalUrl).toEqual(props.originalUrl);
  });

  it('Setter of originalUrl field (private setter)', () => {
    sut['originalUrl'] = 'https://updated.com';
    expect(sut.props.originalUrl).toEqual('https://updated.com');
  });

  it('Getter of shortCode field', () => {
    expect(sut.shortCode).toBeDefined();
    expect(sut.shortCode).toEqual(props.shortCode);
  });

  it('Getter of ownerId field', () => {
    expect(sut.ownerId).toEqual(props.ownerId);
  });

  it('Getter of clicks field', () => {
    expect(sut.clicks).toBeDefined();
    expect(typeof sut.clicks).toBe('number');
    expect(sut.clicks).toEqual(0); // default
  });

  it('incrementClicks should increase and update timestamp', () => {
    const beforeUpdatedAt = sut.updatedAt;

    sut.incrementClicks();
    expect(sut.clicks).toEqual(1);
    expect(sut.updatedAt.getTime()).toBeGreaterThan(beforeUpdatedAt.getTime());
  });

  it('Getter of createdAt field', () => {
    expect(sut.createdAt).toBeInstanceOf(Date);
  });

  it('Getter of updatedAt field', () => {
    expect(sut.updatedAt).toBeInstanceOf(Date);
  });

  it('updateOriginalUrl should validate and update timestamp', () => {
    const beforeUpdatedAt = sut.updatedAt;

    sut.updateOriginalUrl('https://new.com');

    expect(LinkEntity.validate).toHaveBeenCalled();
    expect(sut.originalUrl).toEqual('https://new.com');
    expect(sut.updatedAt.getTime()).toBeGreaterThan(beforeUpdatedAt.getTime());
  });

  it('softDelete should set deletedAt', () => {
    expect(sut.deletedAt).toBeNull();

    sut.softDelete();
    expect(sut.deletedAt).toBeInstanceOf(Date);
  });
});
