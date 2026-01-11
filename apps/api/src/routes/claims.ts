/**
 * Claims Routes
 *
 * POST /claims/daily - Claim daily SC
 * GET /claims/daily/status - Check if can claim
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@pulso/db';
import { creditBalance } from '../services/ledger.service';
import { DAILY_CLAIM_AMOUNT, DAILY_CLAIM_COOLDOWN_MS } from '@pulso/shared';

export async function claimRoutes(fastify: FastifyInstance) {
  // Get daily claim status
  fastify.get('/daily/status', {
    onRequest: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId!;

    const dailyClaim = await prisma.dailyClaim.findUnique({
      where: { userId },
    });

    if (!dailyClaim) {
      return {
        canClaim: true,
        lastClaimAt: null,
        nextClaimAt: null,
      };
    }

    const now = new Date();
    const nextClaimAt = new Date(dailyClaim.lastClaimAt.getTime() + DAILY_CLAIM_COOLDOWN_MS);
    const canClaim = now >= nextClaimAt;

    return {
      canClaim,
      lastClaimAt: dailyClaim.lastClaimAt.toISOString(),
      nextClaimAt: nextClaimAt.toISOString(),
    };
  });

  // Claim daily SC
  fastify.post('/daily', {
    onRequest: [fastify.authenticate],
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId!;

    // Check if already claimed
    const dailyClaim = await prisma.dailyClaim.findUnique({
      where: { userId },
    });

    const now = new Date();

    if (dailyClaim) {
      const nextClaimAt = new Date(dailyClaim.lastClaimAt.getTime() + DAILY_CLAIM_COOLDOWN_MS);

      if (now < nextClaimAt) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Daily reward already claimed. Please try again later.',
          statusCode: 400,
          nextClaimAt: nextClaimAt.toISOString(),
        });
      }
    }

    // Credit SC
    const result = await creditBalance(
      prisma,
      userId,
      'SC',
      DAILY_CLAIM_AMOUNT,
      'DAILY_CLAIM'
    );

    if (!result.success) {
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to credit daily reward',
        statusCode: 500,
      });
    }

    // Update or create daily claim record
    await prisma.dailyClaim.upsert({
      where: { userId },
      create: {
        userId,
        lastClaimAt: now,
      },
      update: {
        lastClaimAt: now,
      },
    });

    const nextClaimAt = new Date(now.getTime() + DAILY_CLAIM_COOLDOWN_MS);

    return {
      success: true,
      amount: DAILY_CLAIM_AMOUNT.toString(),
      nextClaimAt: nextClaimAt.toISOString(),
    };
  });
}
