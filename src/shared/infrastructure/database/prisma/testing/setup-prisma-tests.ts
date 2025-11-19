import { execSync } from 'node:child_process';
import path from 'path';

export function setupPrismaTests() {
  const root = process.cwd();

  const schemaPath = path.join(
    root,
    'src/shared/infrastructure/database/prisma/schema.prisma',
  );

  const isDocker = process.env.DOCKERIZED === 'true';

  const envPath = isDocker
    ? path.join(root, '.env.test')
    : path.join(root, '.env.test.local');
  execSync(
    `npx dotenv-cli --override -e ${envPath} -- npx prisma migrate deploy --schema ${schemaPath}`,
    { stdio: 'inherit' },
  );
}
