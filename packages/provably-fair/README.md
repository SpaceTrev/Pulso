# Provably Fair Package

This package provides cryptographically secure random number generation and verification for casino games.

## Features

- Generate secure seeds
- Create provably fair game results
- Verify game outcomes
- Support for multiple game types (crash, dice, slots)

## Usage

```typescript
import { generateSeed, generateResult, verifyResult } from '@pulso/provably-fair';

const serverSeed = generateSeed();
const clientSeed = generateSeed();
const nonce = 1;

const result = generateResult(serverSeed, clientSeed, nonce);
const isValid = verifyResult(serverSeed, clientSeed, nonce, result);
```
