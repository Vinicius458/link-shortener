import { UserRepository } from '@/users/domain/repositories/user.repository';
import { UserEntity } from '@/users/domain/entities/user.entity';
import { NotFoundError } from '@/shared/domain/errors/not-found-error';
import { ConflictError } from '@/shared/domain/errors/conflict-error';

export class UserInMemoryRepository implements UserRepository.Repository {
  sortableFields: string[] = ['name', 'createdAt'];
  public items: UserEntity[] = [];

  async findByEmail(email: string): Promise<UserEntity> {
    const entity = this.items.find(item => item.email === email);
    if (!entity) {
      throw new NotFoundError(`Entity not found using email ${email}`);
    }
    return entity;
  }

  async emailExists(email: string): Promise<void> {
    const entity = this.items.find(item => item.email === email);
    if (entity) {
      throw new ConflictError('Email address already used');
    }
  }

  async insert(entity: UserEntity): Promise<void> {
    this.items.push(entity);
  }
  async findById(id: string): Promise<UserEntity> {
    const entity = this.items.find(item => item.id === id);
    if (!entity) {
      throw new NotFoundError(`Entity not found using id ${id}`);
    }
    return entity;
  }

  async update(entity: UserEntity): Promise<void> {
    const index = this.items.findIndex(item => item.id === entity.id);
    if (index === -1) {
      throw new NotFoundError(`Entity not found using id ${entity.id}`);
    }
    this.items[index] = entity;
  }
  findAll(): Promise<UserEntity[]> {
    return Promise.resolve(this.items);
  }

  delete(id: string): Promise<void> {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) {
      throw new NotFoundError(`Entity not found using id ${id}`);
    }
    this.items.splice(index, 1);
    return Promise.resolve();
  }
}
