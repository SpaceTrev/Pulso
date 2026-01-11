/**
 * Game Service
 *
 * Handles game play logic for dice and other games.
 */

import { PrismaClient, Currency, GameType } from '@prisma/client';
import { calculateMultiplier, isWin, calculatePayout } from '@pulso/shared';
import { MULTIPLIER_PRECISION, MIN_PLAY_AMOUNT, MAX_PLAY_AMOUNT } from '@pulso/shared';
import { creditBalance, debitBalance, getBalances } from './ledger.service';
import { useSessionForDiceRoll, getSessionByHash } from './provably-fair.service';
import { verify as verifyPF } from '@pulso/provably-fair';

export interface DicePlayInput {
  userId: string;
  currency: Currency;
  amount: bigint;
  target: number;
  direction: 'over' | 'under';
}

export interface DicePlayResult {
  id: string;
  gameType: GameType;
  currency: Currency;
  amount: bigint;
  payoutAmount: bigint;
  direction: string;
  target: number;
  result: number;
  win: boolean;
  multiplier: number;
  pfServerSeedHash: string;
  pfClientSeed: string;
  pfNonce: number;
  createdAt: Date;
}

/**
 * Play a dice game.
 */
export async function playDice(
  prisma: PrismaClient,
  input: DicePlayInput
): Promise<DicePlayResult> {
  const { userId, currency, amount, target, direction } = input;

  // Validate amount
  if (amount < MIN_PLAY_AMOUNT) {
    throw new Error(`Minimum play amount is ${MIN_PLAY_AMOUNT}`);
  }
  if (amount > MAX_PLAY_AMOUNT) {
    throw new Error(`Maximum play amount is ${MAX_PLAY_AMOUNT}`);
  }

  // Validate target
  if (target < 1 || target > 9800) {
    throw new Error('Target must be between 1 and 9800');
  }

  // Check balance
  const balances = await getBalances(prisma, userId);
  const currentBalance = currency === 'GC' ? balances.gc : balances.sc;

  if (currentBalance < amount) {
    throw new Error('Insufficient balance');
  }

  // Debit play amount
  const debitResult = await debitBalance(
    prisma,
    userId,
    currency,
    amount,
    'GAME_PLAY'
  );

  if (!debitResult.success) {
    throw new Error(debitResult.error || 'Failed to debit balance');
  }

  // Get dice roll result
  const rollResult = await useSessionForDiceRoll(prisma, userId);

  // Calculate win/loss
  const win = isWin(rollResult.result, target, direction);
  const multiplier = Math.round(calculateMultiplier(target, direction) * MULTIPLIER_PRECISION);
  const payoutAmount = calculatePayout(amount, multiplier, win);

  // Create game play record
  const gamePlay = await prisma.gamePlay.create({
    data: {
      userId,
      gameType: 'DICE',
      currency,
      amount,
      payoutAmount,
      direction,
      target,
      result: rollResult.result,
      win,
      multiplier,
      pfServerSeedHash: rollResult.serverSeedHash,
      pfClientSeed: rollResult.clientSeed,
      pfNonce: rollResult.nonce,
    },
  });

  // Credit payout if won
  if (win && payoutAmount > 0n) {
    await creditBalance(
      prisma,
      userId,
      currency,
      payoutAmount,
      'GAME_WIN',
      'game_play',
      gamePlay.id
    );
  }

  return gamePlay;
}

/**
 * Get game plays for a user.
 */
export async function getPlays(
  prisma: PrismaClient,
  userId: string,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 20, offset = 0 } = options;

  const [plays, total] = await Promise.all([
    prisma.gamePlay.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.gamePlay.count({ where: { userId } }),
  ]);

  return { plays, total };
}

/**
 * Get a single game play by ID.
 */
export async function getPlayById(
  prisma: PrismaClient,
  playId: string,
  userId?: string
) {
  const where: any = { id: playId };
  if (userId) {
    where.userId = userId;
  }

  return prisma.gamePlay.findFirst({ where });
}

/**
 * Verify a game play result.
 */
export async function verifyPlay(
  prisma: PrismaClient,
  playId: string,
  userId: string
) {
  const play = await getPlayById(prisma, playId, userId);

  if (!play) {
    throw new Error('Play not found');
  }

  // Get the session to check if server seed is revealed
  const session = await getSessionByHash(
    prisma,
    userId,
    play.pfServerSeedHash
  );

  if (!session) {
    throw new Error('Session not found');
  }

  // Only return server seed if it's been revealed (session rotated)
  const serverSeed = session.revealed ? session.serverSeed : null;

  let verified = false;
  if (serverSeed) {
    const verifyResult = verifyPF({
      serverSeed,
      serverSeedHash: play.pfServerSeedHash,
      clientSeed: play.pfClientSeed,
      nonce: play.pfNonce,
      result: play.result,
    });
    verified = verifyResult.valid;
  }

  return {
    id: play.id,
    serverSeed,
    serverSeedHash: play.pfServerSeedHash,
    clientSeed: play.pfClientSeed,
    nonce: play.pfNonce,
    result: play.result,
    verified,
    message: serverSeed
      ? 'Server seed revealed - verification complete'
      : 'Server seed not yet revealed. Rotate your seed to verify past plays.',
  };
}
