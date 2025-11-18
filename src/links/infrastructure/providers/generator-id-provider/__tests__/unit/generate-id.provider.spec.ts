import { GenerateIdProvider } from '../../generate-id.provider';

describe('GenerateIdProvider unit tests', () => {
  let sut: GenerateIdProvider;

  beforeEach(() => {
    sut = new GenerateIdProvider();
  });

  it('Should generate an ID with default length (6)', async () => {
    const id = await sut.generateId();

    expect(id).toBeDefined();
    expect(id).toHaveLength(6);
  });

  it('Should generate an ID with custom length', async () => {
    const size = 10;
    const id = await sut.generateId(size);

    expect(id).toHaveLength(size);
  });

  it('Should generate different IDs on each call', async () => {
    const id1 = await sut.generateId();
    const id2 = await sut.generateId();

    expect(id1).not.toBe(id2);
  });
});
