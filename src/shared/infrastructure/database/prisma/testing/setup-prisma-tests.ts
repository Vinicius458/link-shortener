import { execSync } from 'node:child_process';
import path from 'path';

export function setupPrismaTests() {
  const root = process.cwd();

  const schemaPath = path.join(
    root,
    'src/shared/infrastructure/database/prisma/schema.prisma',
  );

  const envPath = path.join(root, '.env.test');

  execSync(
    `npx dotenv-cli -e ${envPath} -- npx prisma migrate deploy --schema ${schemaPath}`,
    { stdio: 'inherit' },
  );
}

// export function setupPrismaTests() {
//   // execSync(
//   //   'npx dotenv-cli -e .env.test -- npx prisma migrate deploy --schema .src/shared/infrastructure/database/prisma/schema.prisma',
//   // );
//   execSync(
//     'npx dotenv-cli -e ../../../../../.env.test -- npx prisma migrate deploy --schema ../../../../../src/shared/infrastructure/database/prisma/schema.prisma',
//   );
// }
