import { GenerateIdProvider } from '../../generate-id.provider';

describe('GenerateIdProvider (Integration)', () => {
  let provider: GenerateIdProvider;

  beforeEach(() => {
    provider = new GenerateIdProvider();
  });

  it('should generate an ID with default size 6', async () => {
    const id = await provider.generateId();

    expect(typeof id).toBe('string');
    expect(id).toHaveLength(6);
  });

  it('should generate unique IDs', async () => {
    const id1 = await provider.generateId();
    const id2 = await provider.generateId();

    expect(id1).not.toEqual(id2);
  });

  it('should generate an ID with a custom size', async () => {
    const id = await provider.generateId(10);

    expect(id).toHaveLength(10);
  });

  it('should not generate empty IDs', async () => {
    const id = await provider.generateId(1);

    expect(id).not.toBe('');
    expect(id).toHaveLength(1);
  });

  it('should only contain valid base64url characters', async () => {
    const id = await provider.generateId(20);

    // base64url: A-Z a-z 0-9 - _
    const regex = /^[A-Za-z0-9\-_]+$/;

    expect(regex.test(id)).toBeTruthy();
  });
});
