import { UserEntity } from '../entities/user.entity';

export namespace UserRepository {
  export interface Repository {
    findByEmail(email: string): Promise<UserEntity>;
    emailExists(email: string): Promise<void>;
    insert(entity: UserEntity): Promise<void>;
    findById(id: string): Promise<UserEntity>;
    findAll(): Promise<UserEntity[]>;
    update(entity: UserEntity): Promise<void>;
    delete(id: string): Promise<void>;
  }
}
