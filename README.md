# 🎰 Pulso

Sweepstakes casino for Mexico - Built with pnpm, Turborepo, and modern TypeScript stack.

## 🏗️ Monorepo Structure

This is a monorepo containing multiple applications and shared packages:

### Apps

- **apps/api** - Fastify backend API (TypeScript)
- **apps/web** - Next.js web application with App Router (TypeScript)
- **apps/mobile** - Expo React Native mobile app (TypeScript)

### Packages

- **packages/shared** - Shared Zod schemas and types
- **packages/db** - Prisma database client and schema
- **packages/provably-fair** - Provably fair gaming algorithms

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 10.0.0
- Docker & Docker Compose (for PostgreSQL)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/SpaceTrev/Pulso.git
cd Pulso
```

2. Install dependencies:

```bash
pnpm install
```

3. Copy environment variables:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
cp packages/db/.env.example packages/db/.env
```

4. Start the PostgreSQL database:

```bash
docker-compose up -d
```

5. Generate Prisma client and push schema:

```bash
cd packages/db
pnpm db:generate
pnpm db:push
cd ../..
```

## 📦 Available Scripts

### Development

```bash
# Run API + Web in development mode
pnpm dev

# Run mobile app
pnpm mobile

# Run individual apps
pnpm --filter @pulso/api dev
pnpm --filter @pulso/web dev
pnpm --filter @pulso/mobile start
```

### Building

```bash
# Build all apps and packages
pnpm build

# Build specific app
pnpm --filter @pulso/api build
pnpm --filter @pulso/web build
```

### Linting & Formatting

```bash
# Lint all packages
pnpm lint

# Format code
pnpm format
```

### Database

```bash
# Generate Prisma client
cd packages/db && pnpm db:generate

# Push schema to database
cd packages/db && pnpm db:push

# Run migrations
cd packages/db && pnpm db:migrate

# Open Prisma Studio
cd packages/db && pnpm db:studio
```

## 🛠️ Tech Stack

### Backend (API)

- **Fastify** - Fast web framework
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **JWT** - Authentication
- **Zod** - Schema validation

### Frontend (Web)

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **React 18** - UI library

### Mobile

- **Expo** - React Native framework
- **Expo Router** - File-based routing
- **TypeScript** - Type safety
- **React Native** - Mobile UI

### Shared

- **Turborepo** - Monorepo build system
- **pnpm** - Fast package manager
- **ESLint** - Code linting
- **Prettier** - Code formatting

### Database

- **PostgreSQL** - Primary database
- **Docker** - Containerization

## 🎲 Provably Fair Gaming

This project implements provably fair algorithms for casino games, ensuring transparency and fairness. See `packages/provably-fair` for implementation details.

## 📝 License

Private - All rights reserved

## 🤝 Contributing

This is a private project. Please contact the repository owner for contribution guidelines.
