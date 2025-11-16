export interface IdProvider {
  generateId(size?: number): Promise<string>;
}
