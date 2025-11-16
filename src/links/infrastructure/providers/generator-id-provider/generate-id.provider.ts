import { IdProvider } from '@/shared/application/providers/id-provider';
import { nanoid } from 'nanoid';
export class GenerateIdProvider implements IdProvider {
  async generateId(size = 6): Promise<string> {
    return nanoid(size);
  }
}
