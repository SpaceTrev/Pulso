# 🎰 Pulso

Mexico-first sweepstakes "social play" platform - Built with pnpm, Turborepo, and modern TypeScript stack.

## ⚠️ Compliance Notice

This platform operates under a **sweepstakes model** with strict compliance rules:
- **Gold Coins (GC)** 🪙 - For entertainment only, no cash value
- **Sweepstakes Coins (SC)** 💎 - Free only, redeemable for prizes

See [docs/COMPLIANCE.md](docs/COMPLIANCE.md) for full compliance documentation.

## 🏗️ Monorepo Structure

### Apps

| App | Description | Port |
|-----|-------------|------|
| `apps/api` | Fastify REST API | 3001 |
| `apps/web` | Next.js 14 web app | 3000 |
| `apps/mobile` | Expo React Native app | 19000 |

### Packages

| Package | Description |
|---------|-------------|
| `packages/shared` | Zod schemas, types, constants, helpers |
| `packages/db` | Prisma client & schema |
| `packages/provably-fair` | Commit-reveal provably fair system |
| `packages/ledger` | Pure balance calculation functions |
| `packages/api-client` | Typed API client for web/mobile |

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 10.0.0
- Docker & Docker Compose

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment files
cp apps/api/.env.example apps/api/.env
cp packages/db/.env.example packages/db/.env

# 3. Start PostgreSQL
docker-compose up -d

# 4. Setup database
pnpm db:generate
pnpm db:push

# 5. Seed initial data (admin + test user)
pnpm --filter @pulso/api seed

# 6. Start development
pnpm dev
```

### Default Users (after seeding)

| Email | Password | Role |
|-------|----------|------|
| admin@pulso.mx | admin123 | ADMIN |
| test@pulso.mx | test1234 | USER |

## 📦 Scripts

```bash
# Development (API + Web)
pnpm dev

# Build all
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint

# Mobile
pnpm --filter @pulso/mobile start
```

## 🎮 Features

### Dual Currency System
- **Gold Coins**: Purchase for entertainment (coming soon)
- **Sweepstakes Coins**: Earned free, redeemable for prizes

### Provably Fair Gaming
- Commit-reveal cryptographic system
- HMAC-SHA256 outcome generation
- User-settable client seeds
- Full verification after session rotation
- See [docs/PROVABLY_FAIR.md](docs/PROVABLY_FAIR.md)

### Games
- **Dice**: Roll under/over target (2% house edge)
- More games coming soon

### Daily Claims
- Free SC every 24 hours
- Claim from web or mobile

### Redemptions
- Web-only creation (compliance requirement)
- Mobile can view status
- Admin approval workflow

## 🏛️ Architecture

### API Design
- RESTful endpoints with Fastify
- JWT authentication (7-day expiry)
- Rate limiting
- Swagger UI at `/docs`

### Balance System
- Append-only ledger (audit trail)
- Atomic transactions via Prisma
- BigInt for precision (100 units = 1.00 coins)
- Non-negative balance invariant

### Database Models
- User, Balance, LedgerEntry
- ProvablyFairSession, GamePlay
- DailyClaim, RedemptionRequest

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Monorepo | Turborepo + pnpm |
| API | Fastify 4.x |
| Web | Next.js 14 + Tailwind |
| Mobile | Expo 50 + expo-router |
| Database | PostgreSQL 16 + Prisma |
| Auth | JWT + argon2 |
| Validation | Zod |
| Testing | Vitest |

## 📁 Project Structure

```
pulso/
├── apps/
│   ├── api/          # Fastify API
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   └── index.ts
│   │   └── scripts/seed.ts
│   ├── web/          # Next.js
│   │   └── src/
│   │       ├── app/
│   │       ├── components/
│   │       └── contexts/
│   └── mobile/       # Expo
│       ├── app/
│       └── contexts/
├── packages/
│   ├── api-client/   # Typed fetch wrapper
│   ├── db/           # Prisma schema
│   ├── ledger/       # Balance logic
│   ├── provably-fair/ # PF implementation
│   └── shared/       # Schemas, types, constants
├── docs/
│   ├── COMPLIANCE.md
│   └── PROVABLY_FAIR.md
└── docker-compose.yml
```

## 🔒 Security

- Passwords hashed with argon2
- JWT with secure secret
- CORS + Helmet configured
- Rate limiting on all routes
- Input validation with Zod

## 📝 License

Private - All rights reserved

## 🤝 Contributing

Contact repository owner for contribution guidelines.
