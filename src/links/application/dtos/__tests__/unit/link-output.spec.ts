import { LinkEntity } from '@/links/domain/entities/link.entity';
import { LinkDataBuilder } from '@/links/domain/testing/helpers/link-data-builder';
import { LinkOutputMapper } from '../../link-output';

describe('LinkOutputMapper unit tests', () => {
  it('should convert a link entity into output', () => {
    const entity = new LinkEntity(LinkDataBuilder({}));
    const spyToJson = jest.spyOn(entity, 'toJSON');

    const sut = LinkOutputMapper.toOutput(entity);

    expect(spyToJson).toHaveBeenCalled();
    expect(sut).toStrictEqual(entity.toJSON());
  });
});
