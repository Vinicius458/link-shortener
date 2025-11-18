import { Module } from '@nestjs/common';
import { EnvConfigModule } from './shared/infrastructure/env-config/env-config.module';
import { UsersModule } from './users/infrastructure/users.module';
import { AuthModule } from './auth/infrastructure/auth.module';
import { DatabaseModule } from './shared/infrastructure/database/database.module';
import { LinksModule } from './links/infrastructure/links.module';

@Module({
  imports: [
    EnvConfigModule,
    UsersModule,
    LinksModule,
    DatabaseModule,
    AuthModule,
  ],
})
export class AppModule {}
