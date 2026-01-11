# Provably Fair System

Pulso uses a commit-reveal provably fair system to ensure all game outcomes can be independently verified by players.

## How It Works

### 1. Session Creation

When a user starts playing, a provably fair session is created:

```
Server Seed: randomly generated 32 bytes (hex encoded)
Server Seed Hash: SHA256(serverSeed) - shown to user BEFORE play
Client Seed: user-provided string (can be changed anytime)
Nonce: starts at 0, increments with each play
```

### 2. The Commitment

Before any play, the user can see:
- **Server Seed Hash** - The SHA256 hash of the server seed
- **Their Client Seed** - Which they can customize
- **Current Nonce** - Which play number they're on

This proves the server committed to the outcome BEFORE the user made their choice.

### 3. Outcome Generation

For each play, the outcome is calculated as:

```typescript
// Combine server seed, client seed, and nonce
message = clientSeed + ':' + nonce.toString()
hash = HMAC-SHA256(serverSeed, message)

// Take first 8 hex chars (4 bytes) as the roll
roll = parseInt(hash.slice(0, 8), 16) % 10000
// Result: 0-9999 (displayed as 0.00-99.99)
```

### 4. Session Rotation & Reveal

When the user rotates their session:
1. The current server seed is **revealed** (stored in DB, shown to user)
2. A new server seed is generated
3. Nonce resets to 0

Now the user can verify ALL plays from that session!

## Verification Process

### Manual Verification

Users can verify any play with:
1. **Revealed Server Seed** - From a rotated session
2. **Their Client Seed** - That was active during the play
3. **Nonce** - The play number (0, 1, 2, etc.)

### Verification Code

```typescript
import { createHmac, createHash } from 'crypto';

function verify(serverSeed: string, clientSeed: string, nonce: number) {
  const message = `${clientSeed}:${nonce}`;
  const hash = createHmac('sha256', serverSeed)
    .update(message)
    .digest('hex');
  
  const roll = parseInt(hash.slice(0, 8), 16) % 10000;
  
  return { roll, hash };
}
```

### Example

```
Server Seed: a1b2c3d4e5f6...
Client Seed: my-custom-seed-123
Nonce: 5

Message: "my-custom-seed-123:5"
HMAC: "3f7a8b2c..." (64 hex chars)
First 8 chars: "3f7a8b2c"
Decimal: 1065918252
Roll: 1065918252 % 10000 = 8252
Displayed: 82.52
```

## Hash Verification

Users can also verify the server seed hash matches:

```typescript
import { createHash } from 'crypto';

function verifyHash(serverSeed: string, expectedHash: string): boolean {
  const hash = createHash('sha256').update(serverSeed).digest('hex');
  return hash === expectedHash;
}
```

## Security Properties

### Unpredictable Outcomes
- Server seed is generated with cryptographically secure randomness
- HMAC-SHA256 ensures small input changes produce completely different outputs
- Modulo operation provides uniform distribution

### Commitment Scheme
- Hash is shown BEFORE play, proving server committed to seed
- Hash is one-way: impossible to derive server seed from hash
- User can trust the outcome wasn't changed after their choice

### User Influence
- Client seed allows users to influence outcomes
- Users can change client seed anytime
- Even if server is malicious, user's entropy adds unpredictability

### Verifiability
- All inputs are revealed after session rotation
- Anyone can independently verify any play
- Verification code is simple and auditable

## Game-Specific Implementation

### Dice Game

```
Roll Range: 0-9999 (displayed as 0.00-99.99)
Target Range: 1.00-98.99
Direction: UNDER or OVER

Win Condition (UNDER): roll < target
Win Condition (OVER): roll > target

Win Chance (UNDER): target / 100
Win Chance (OVER): (10000 - target) / 100

Multiplier: 98 / winChance (2% house edge)
```

### Example Play

```
Target: 50.00 (5000 in raw units)
Direction: UNDER
Win Chance: 50%
Multiplier: 1.96x

Roll: 32.45 (3245)
Outcome: WIN (3245 < 5000)
```

## In-App Verification

The Provably Fair page (web and mobile) provides:

1. **Current Session Info**
   - Server seed hash (commitment)
   - Your client seed (editable)
   - Current nonce

2. **Session Controls**
   - Update client seed
   - Rotate session (reveals server seed)

3. **Verifier Tool**
   - Input server seed, client seed, nonce
   - Get calculated roll and hash
   - Compare with your play history

## FAQ

**Q: Can the server predict my client seed?**
A: No, unless you share it. Using random or unique client seeds adds your own entropy.

**Q: Why not reveal server seed immediately?**
A: Revealing the seed would allow calculation of future outcomes. We commit via hash first, reveal after rotation.

**Q: What if I never rotate my session?**
A: You can still play, but you cannot verify until you rotate. We recommend periodic rotation.

**Q: Can I verify on a third-party site?**
A: Yes! The algorithm is standard HMAC-SHA256. Any implementation will produce the same results.

## Code Reference

- Implementation: `packages/provably-fair/src/provably-fair.ts`
- Tests: `packages/provably-fair/src/__tests__/provably-fair.test.ts`
- API Service: `apps/api/src/services/provably-fair.service.ts`
- Database Model: `packages/db/prisma/schema.prisma` (ProvablyFairSession)
