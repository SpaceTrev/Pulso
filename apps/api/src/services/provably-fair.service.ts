/**
 * Provably Fair Service
 *
 * Manages provably fair sessions for users.
 */

import { PrismaClient } from '@prisma/client';
import {
  commit,
  generateDefaultClientSeed,
  rollDice,
  hashServerSeed,
} from '@pulso/provably-fair';

export interface PFSession {
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

/**
 * Get or create a provably fair session for a user.
 */
export async function getOrCreateSession(
  prisma: PrismaClient,
  userId: string
): Promise<PFSession> {
  let session = await prisma.provablyFairSession.findFirst({
    where: {
      userId,
      revealed: false,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!session) {
    // Create new session
    const { serverSeed, serverSeedHash } = commit();
    const clientSeed = generateDefaultClientSeed();

    session = await prisma.provablyFairSession.create({
      data: {
        userId,
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce: 0,
        revealed: false,
      },
    });
  }

  return {
    serverSeedHash: session.serverSeedHash,
    clientSeed: session.clientSeed,
    nonce: session.nonce,
  };
}

/**
 * Get the current active session for a user.
 */
export async function getCurrentSession(
  prisma: PrismaClient,
  userId: string
) {
  return prisma.provablyFairSession.findFirst({
    where: {
      userId,
      revealed: false,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Set the client seed for a user's current session.
 */
export async function setClientSeed(
  prisma: PrismaClient,
  userId: string,
  clientSeed: string
): Promise<PFSession> {
  const session = await getCurrentSession(prisma, userId);

  if (!session) {
    // Create new session with provided client seed
    const { serverSeed, serverSeedHash } = commit();

    const newSession = await prisma.provablyFairSession.create({
      data: {
        userId,
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce: 0,
        revealed: false,
      },
    });

    return {
      serverSeedHash: newSession.serverSeedHash,
      clientSeed: newSession.clientSeed,
      nonce: newSession.nonce,
    };
  }

  // Update existing session's client seed
  const updated = await prisma.provablyFairSession.update({
    where: { id: session.id },
    data: { clientSeed },
  });

  return {
    serverSeedHash: updated.serverSeedHash,
    clientSeed: updated.clientSeed,
    nonce: updated.nonce,
  };
}

/**
 * Use the current session to generate a dice roll and increment nonce.
 * Returns the result and verification data.
 */
export async function useSessionForDiceRoll(
  prisma: PrismaClient,
  userId: string
): Promise<{
  result: number;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}> {
  const session = await getCurrentSession(prisma, userId);

  if (!session) {
    throw new Error('No active provably fair session');
  }

  // Generate result
  const result = rollDice(session.serverSeed, session.clientSeed, session.nonce);

  // Capture current nonce before incrementing
  const usedNonce = session.nonce;

  // Increment nonce
  await prisma.provablyFairSession.update({
    where: { id: session.id },
    data: { nonce: session.nonce + 1 },
  });

  return {
    result,
    serverSeedHash: session.serverSeedHash,
    clientSeed: session.clientSeed,
    nonce: usedNonce,
  };
}

/**
 * Rotate the server seed. This reveals the old seed and creates a new one.
 */
export async function rotateSeed(
  prisma: PrismaClient,
  userId: string
): Promise<{
  previousServerSeed: string;
  newServerSeedHash: string;
}> {
  const session = await getCurrentSession(prisma, userId);

  if (!session) {
    throw new Error('No active provably fair session');
  }

  // Mark current session as revealed
  await prisma.provablyFairSession.update({
    where: { id: session.id },
    data: { revealed: true },
  });

  // Create new session
  const { serverSeed, serverSeedHash } = commit();

  await prisma.provablyFairSession.create({
    data: {
      userId,
      serverSeed,
      serverSeedHash,
      clientSeed: session.clientSeed, // Keep same client seed
      nonce: 0,
      revealed: false,
    },
  });

  return {
    previousServerSeed: session.serverSeed,
    newServerSeedHash: serverSeedHash,
  };
}

/**
 * Get session by hash for verification purposes.
 */
export async function getSessionByHash(
  prisma: PrismaClient,
  userId: string,
  serverSeedHash: string
) {
  return prisma.provablyFairSession.findFirst({
    where: {
      userId,
      serverSeedHash,
    },
  });
}
