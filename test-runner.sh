#!/bin/sh
sleep 5

psql postgresql://postgres:docker@db:5432/projectdb -c "CREATE SCHEMA IF NOT EXISTS test;"

rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

npx prisma generate --schema ./src/shared/infrastructure/database/prisma/schema.prisma

npx prisma migrate deploy --schema ./src/shared/infrastructure/database/prisma/schema.prisma

npm run test

