# Compliance Rules - Pulso Sweepstakes Platform

This document outlines the compliance rules enforced in the Pulso codebase for the Mexico-first sweepstakes "social play" model.

## Dual Currency System

### Gold Coins (GC) 🪙
- **Purpose**: Entertainment only
- **Value**: No real-world monetary value
- **Acquisition**: Purchase through the platform (coming soon)
- **Usage**: Can be used to play games for fun
- **Redemption**: NEVER redeemable for cash or prizes

### Sweepstakes Coins (SC) 💎
- **Purpose**: Promotional currency
- **Value**: Redeemable for prizes
- **Acquisition**: FREE ONLY
  - Daily claims (every 24 hours)
  - Admin grants (promotions, bonuses, compensation)
  - Social media giveaways (future)
  - Mail-in requests (future)
- **Usage**: Can be used to play games
- **Redemption**: Can be redeemed for prizes when certain thresholds are met

## Banned Words

The following words are NEVER used in the platform to maintain sweepstakes compliance:

| ❌ Banned | ✅ Use Instead |
|-----------|----------------|
| bet | play |
| wager | play |
| betting | playing |
| wagering | playing |
| gambling | entertainment |
| casino | - |
| cashout | redemption |
| withdraw | redemption request |
| withdrawal | redemption |
| stake (as gambling term) | play amount |

**Enforcement**: The `BANNED_WORDS` constant in `@pulso/shared` contains the full list. UI copy and API responses are reviewed to ensure compliance.

## Mobile Restrictions

**Mobile clients (Expo app) CANNOT create redemption requests.**

This is enforced at the API level:
- The `POST /redemptions` endpoint checks the `User-Agent` header
- Requests from Expo/React Native clients receive a 403 Forbidden response
- Mobile users can VIEW their redemption status but cannot create new requests
- This restriction is intentional for compliance with sweepstakes regulations

## Currency Labels

To maintain compliance, we use specific terminology:

```typescript
CURRENCY_LABELS = {
  GC: 'Gold Coins',  // Not "Gold" or "Coins"
  SC: 'Sweepstakes Coins',  // Not "Sweep Coins" or "SC"
}
```

## UI Copy Guidelines

All user-facing text should:

1. Clearly distinguish between GC and SC
2. Emphasize that GC has no cash value
3. State that SC is earned for FREE
4. Use "play" instead of "bet/wager"
5. Use "redemption" instead of "cashout/withdraw"
6. Include appropriate disclaimers

### Required Disclaimers

**GC Disclaimer** (shown on purchase flows):
> "Gold Coins are for entertainment purposes only and have no cash value. Gold Coins cannot be redeemed for prizes."

**SC Disclaimer** (shown on redemption flows):
> "Sweepstakes Coins are earned for free through daily bonuses, promotions, and other free methods. SC can be redeemed for prizes."

**Footer Disclaimer**:
> "Pulso is a sweepstakes platform. Gold Coins are for entertainment only with no monetary value. Sweepstakes Coins can only be obtained through free methods and may be redeemed for prizes. No purchase necessary. Must be 18+ to participate."

## Age Verification

- Users must be 18+ to participate
- Age verification is required during registration (future enhancement)
- Terms of service acceptance is required

## Geographic Restrictions

- Currently targeting Mexico market
- IP-based geo-restrictions may be implemented
- KYC verification required for redemptions above threshold (future)

## API Compliance Checks

### Ledger Integrity
- All balance changes go through the append-only ledger
- Negative balances are impossible (invariant enforced)
- Every transaction has an audit trail

### Rate Limiting
- API rate limits prevent abuse
- Daily claim cooldown enforced (24 hours)
- Maximum stake limits enforced

### Provably Fair
- All game outcomes are cryptographically verifiable
- Server seeds are committed before play
- Users can set their own client seeds
- Full verification possible after session rotation

## Code Locations

| Rule | Enforced In |
|------|-------------|
| Banned words | `packages/shared/src/constants.ts` |
| Currency types | `packages/db/prisma/schema.prisma` |
| Mobile redemption block | `apps/api/src/routes/redemptions.ts` |
| Ledger invariants | `packages/ledger/src/balance.ts` |
| Daily claim cooldown | `apps/api/src/routes/claims.ts` |
| Stake limits | `packages/shared/src/constants.ts` |
| Provably fair | `packages/provably-fair/src/` |
