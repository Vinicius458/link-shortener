# Link Shortener – Documentação de Execução

Este projeto pode ser executado **localmente** (na sua máquina) ou **via Docker**.
Abaixo você encontra instruções completas para ambos os ambientes.

---

# Requisitos

## Local

- Node.js 18+
- npm ou yarn
- PostgreSQL 15+
- Arquivos `.env` configurados

## Docker

- Docker
- Docker Compose v2

---

# Como rodar localmente (sem Docker)

## 1. Instalar dependências

```sh
npm install
```

## 2. Criar banco de dados localmente

Crie o banco conforme seu `.env.development`:

```sql
CREATE DATABASE projectdb;
```

## 3. Rodar migrations

```sh
npx prisma migrate deploy --schema ./src/shared/infrastructure/database/prisma/schema.prisma
```

ou

```sh
npm run migrate:local
```

## 4. Iniciar o servidor

```sh
npm run start:dev
```

O servidor estará disponível em:

```
http://localhost:3000
```

---

# Como rodar usando Docker

## 1. Subir containers

```sh
docker compose up -d --build
```

## 2. Verificar se o app está rodando

```sh
docker compose ps
```

## 3. Rodar migrations dentro do container

```sh
sql postgresql://postgres:docker@db:5432/projectdb -c "CREATE SCHEMA IF NOT EXISTS test;"

rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

npx prisma generate --schema ./src/shared/infrastructure/database/prisma/schema.prisma

npx prisma migrate deploy --schema ./src/shared/infrastructure/database/prisma/schema.prisma
```

## 4. Acessar o aplicativo

```
http://localhost:3000
```

---

# Rodando Testes

O projeto possui 3 tipos de testes:

- **Unitários**
- **Integração**
- **E2E**

E todos podem rodar tanto **localmente** quanto **no Docker**.

---

# Testes localmente

## Testes unitários

```sh
npm run test:unit-local
```

## Testes de integração

```sh
npm run test:int-local
```

## Testes E2E

```sh
npm run test:e2e-local
```

## Tedos os test

```sh
npm run test:local
```

---

# Testes dentro do Docker

O projeto possui um runner especial para testes:

```sh
npm run test:docker
```

Ele executa:

- carregamento do `.env.test`
- criação do schema `test`
- limpeza do Prisma Client antigo
- geração do Prisma Client correto para Alpine
- migrations no schema test
- execução dos testes

Caso queira rodar testes específicos:

```sh
docker compose exec app npm run test:unit
```

```sh
docker compose exec app npm run test:int
```

```sh
docker compose exec app npm run test:e2e
```

```sh
docker compose exec app npm run test
```

---

## Regenerar Prisma Client (DEV ou Docker)

```sh
npx prisma generate --schema ./src/shared/infrastructure/database/prisma/schema.prisma
```

## Acessar o container do app

```sh
docker compose exec app sh
```

## Acessar o container do banco

```sh
docker compose exec db sh
```

---

# Estrutura do Projeto

```
src/
  auth/
  links/
  users/
  shared/
    infrastructure/
      database/
        prisma/
          schema.prisma
          migrations/
```

---

# Variáveis de Ambiente

### `.env.development`

- Porta do app
- DATABASE_URL (aponta para Postgres local)
- JWT configs

### `.env.test`

- Porta
- DATABASE_URL com schema `test`
- JWT configs

---
