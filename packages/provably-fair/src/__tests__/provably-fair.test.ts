import { describe, it, expect } from 'vitest';
import {
  generateServerSeed,
  generateDefaultClientSeed,
  hashServerSeed,
  commit,
  rollDice,
  rollFloat,
  verify,
  verifyServerSeedHash,
} from '../provably-fair';

describe('Seed Generation', () => {
  it('should generate a 64 character hex server seed', () => {
    const seed = generateServerSeed();
    expect(seed).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should generate unique server seeds', () => {
    const seeds = new Set();
    for (let i = 0; i < 100; i++) {
      seeds.add(generateServerSeed());
    }
    expect(seeds.size).toBe(100);
  });

  it('should generate a 32 character hex client seed', () => {
    const seed = generateDefaultClientSeed();
    expect(seed).toMatch(/^[0-9a-f]{32}$/);
  });

  it('should hash server seed to 64 character hex', () => {
    const serverSeed = generateServerSeed();
    const hash = hashServerSeed(serverSeed);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should produce same hash for same seed', () => {
    const serverSeed = 'test-seed-123';
    const hash1 = hashServerSeed(serverSeed);
    const hash2 = hashServerSeed(serverSeed);
    expect(hash1).toBe(hash2);
  });
});

describe('Commit Phase', () => {
  it('should return server seed and matching hash', () => {
    const { serverSeed, serverSeedHash } = commit();
    expect(serverSeed).toMatch(/^[0-9a-f]{64}$/);
    expect(serverSeedHash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashServerSeed(serverSeed)).toBe(serverSeedHash);
  });
});

describe('Dice Roll', () => {
  const serverSeed = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
  const clientSeed = 'user-seed-123';

  it('should produce result in range [0, 9999]', () => {
    for (let nonce = 0; nonce < 100; nonce++) {
      const result = rollDice(serverSeed, clientSeed, nonce);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(9999);
    }
  });

  it('should be deterministic - same inputs produce same result', () => {
    const result1 = rollDice(serverSeed, clientSeed, 0);
    const result2 = rollDice(serverSeed, clientSeed, 0);
    expect(result1).toBe(result2);
  });

  it('should produce different results for different nonces', () => {
    const results = new Set<number>();
    for (let nonce = 0; nonce < 100; nonce++) {
      results.add(rollDice(serverSeed, clientSeed, nonce));
    }
    // Should have at least 80 unique results out of 100
    expect(results.size).toBeGreaterThan(80);
  });

  it('should produce different results for different client seeds', () => {
    const result1 = rollDice(serverSeed, 'client-a', 0);
    const result2 = rollDice(serverSeed, 'client-b', 0);
    expect(result1).not.toBe(result2);
  });

  it('should produce different results for different server seeds', () => {
    const seed2 = 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3';
    const result1 = rollDice(serverSeed, clientSeed, 0);
    const result2 = rollDice(seed2, clientSeed, 0);
    expect(result1).not.toBe(result2);
  });
});

describe('Roll Float', () => {
  const serverSeed = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
  const clientSeed = 'user-seed-123';

  it('should produce result in range [0, 1)', () => {
    for (let nonce = 0; nonce < 100; nonce++) {
      const result = rollFloat(serverSeed, clientSeed, nonce);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(1);
    }
  });
});

describe('Verification', () => {
  it('should verify valid game result', () => {
    const { serverSeed, serverSeedHash } = commit();
    const clientSeed = 'my-client-seed';
    const nonce = 42;
    const result = rollDice(serverSeed, clientSeed, nonce);

    const verification = verify({
      serverSeed,
      serverSeedHash,
      clientSeed,
      nonce,
      result,
    });

    expect(verification.valid).toBe(true);
    expect(verification.hashMatches).toBe(true);
    expect(verification.resultMatches).toBe(true);
    expect(verification.computedHash).toBe(serverSeedHash);
    expect(verification.computedResult).toBe(result);
  });

  it('should fail verification for wrong server seed', () => {
    const { serverSeed, serverSeedHash } = commit();
    const clientSeed = 'my-client-seed';
    const nonce = 42;
    const result = rollDice(serverSeed, clientSeed, nonce);

    const wrongServerSeed = generateServerSeed();
    const verification = verify({
      serverSeed: wrongServerSeed,
      serverSeedHash,
      clientSeed,
      nonce,
      result,
    });

    expect(verification.valid).toBe(false);
    expect(verification.hashMatches).toBe(false);
  });

  it('should fail verification for wrong result', () => {
    const { serverSeed, serverSeedHash } = commit();
    const clientSeed = 'my-client-seed';
    const nonce = 42;
    const result = rollDice(serverSeed, clientSeed, nonce);

    const verification = verify({
      serverSeed,
      serverSeedHash,
      clientSeed,
      nonce,
      result: (result + 1) % 10000, // Wrong result
    });

    expect(verification.valid).toBe(false);
    expect(verification.hashMatches).toBe(true); // Hash still matches
    expect(verification.resultMatches).toBe(false);
  });

  it('should verify server seed hash independently', () => {
    const { serverSeed, serverSeedHash } = commit();
    expect(verifyServerSeedHash(serverSeed, serverSeedHash)).toBe(true);
    expect(verifyServerSeedHash(generateServerSeed(), serverSeedHash)).toBe(false);
  });
});

describe('Distribution', () => {
  it('should have roughly uniform distribution', () => {
    const serverSeed = generateServerSeed();
    const clientSeed = 'test-distribution';
    const buckets = new Array(10).fill(0);

    // Roll 10000 times and count distribution in 10 buckets
    for (let nonce = 0; nonce < 10000; nonce++) {
      const result = rollDice(serverSeed, clientSeed, nonce);
      const bucket = Math.floor(result / 1000);
      buckets[bucket]++;
    }

    // Each bucket should have roughly 1000 hits (±200 for randomness)
    for (const count of buckets) {
      expect(count).toBeGreaterThan(800);
      expect(count).toBeLessThan(1200);
    }
  });
});

describe('Determinism Proof', () => {
  it('stored game plays should match verification', () => {
    // Simulate storing a game play
    const { serverSeed, serverSeedHash } = commit();
    const clientSeed = 'player-seed-abc';

    // Store multiple plays
    const storedPlays = [];
    for (let i = 0; i < 10; i++) {
      const nonce = i;
      const result = rollDice(serverSeed, clientSeed, nonce);
      storedPlays.push({
        serverSeedHash,
        clientSeed,
        nonce,
        result,
      });
    }

    // Later, verify all plays with revealed server seed
    for (const play of storedPlays) {
      const verification = verify({
        serverSeed, // Now revealed
        serverSeedHash: play.serverSeedHash,
        clientSeed: play.clientSeed,
        nonce: play.nonce,
        result: play.result,
      });

      expect(verification.valid).toBe(true);
    }
  });
});
