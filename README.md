# Node TypeScript Production API

A lightweight Express + TypeScript + Prisma starter for building a production-ready backend.

## Overview

This project includes:

- Express API server
- TypeScript configuration
- Prisma ORM setup
- Zod request validation / DTO
- Centralized error handling
- Structured logging with Pino
- CORS and security middleware
- User route, service, and repository structure

## Project structure

```text
node-ts-prod/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── clients/
│   ├── config/
│   ├── controllers/
│   ├── core/
│   ├── jobs/
│   ├── middlewares/
│   ├── repositories/
│   ├── routes/
│   ├── schemas/
│   ├── services/
│   ├── types/
│   └── utils/
├── tests/
├── docker-compose.yml
├── package.json
├── prisma.config.ts
├── README.md
├── tsconfig.json
└── .env
```

## Getting started

### 1. Install dependencies

```bash
cd /Users/aasifiqbal/Development/node-ts-prod
npm install
```

### 2. Create an environment file

Create a `.env` file in the project root with at least:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/appdb"
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

> If PostgreSQL is not running locally, start it first or use a valid remote database URL.

### 3. Generate Prisma client

```bash
npx prisma generate
```

### 4. Run the app

#### Development

```bash
npm run dev
```

#### Production build

```bash
npm run build
npm run start
```

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the app in watch mode |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run the built app |
| `npm run test` | Run the test suite |
| `npm run lint` | Lint the source code |
| `npm run prisma:migrate` | Create and apply Prisma migrations |
| `npm run prisma:studio` | Open Prisma Studio |

## API routes

### Health check

```http
GET /health
```

### Users

```http
POST /api/v1/users
GET /api/v1/users
```

## Notes

This project uses:

- Zod for validation
- Prisma for database access
- Express 5 for routing
- Pino for structured logging
- TypeScript strict mode

## Quick verification

The project was validated with:

```bash
npm test -- --run tests/validate.test.ts
```

and the route validation tests passed successfully.


## POST endpoint

For creating a user, the endpoint is:

- POST /api/v1/users

This is defined in `user.routes.ts` as:

```ts
router.post('/', validate(createUserSchema), registerUserController);
```

and the app mounts routes under:

```ts
app.use('/api/v1', apiRouter);
```

### Request body

It expects JSON like:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

### Example

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

This matches the schema in `user.schema.ts`.