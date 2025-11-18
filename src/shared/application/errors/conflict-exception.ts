export class ConflictExceptionError extends Error {
  constructor(public message: string) {
    super(message);
    this.name = 'ConflictExceptionError';
  }
}
