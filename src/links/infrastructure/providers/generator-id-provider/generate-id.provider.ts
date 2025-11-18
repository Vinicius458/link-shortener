import { IdProvider } from '@/shared/application/providers/id-provider';
import { randomBytes } from 'node:crypto';
export class GenerateIdProvider implements IdProvider {
  async generateId(size = 6): Promise<string> {
    return randomBytes(size).toString('base64url').slice(0, size);
  }
}
