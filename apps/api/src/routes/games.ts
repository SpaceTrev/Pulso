/**
 * Game Routes
 *
 * POST /games/dice/play - Play dice game
 * GET /games/plays - Get play history
 * GET /games/plays/:id/verify - Verify a play
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@pulso/db';
import { DicePlaySchema } from '@pulso/shared';
import { z } from 'zod';
import { playDice, getPlays, verifyPlay } from '../services/game.service';
import { MULTIPLIER_PRECISION } from '@pulso/shared';

const PlaysQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

const PlayIdSchema = z.object({
  id: z.string().uuid(),
});

export async function gameRoutes(fastify: FastifyInstance) {
  // Play dice
  fastify.post('/dice/play', {
    onRequest: [fastify.authenticate],
    config: {
      rateLimit: {
        max: 60,
        timeWindow: '1 minute',
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId!;
    const body = DicePlaySchema.parse(request.body);

    try {
      const result = await playDice(prisma, {
        userId,
        currency: body.currency,
        amount: BigInt(body.amount),
        target: body.target,
        direction: body.direction,
      });

      return {
        id: result.id,
        gameType: result.gameType,
        currency: result.currency,
        amount: result.amount.toString(),
        payoutAmount: result.payoutAmount.toString(),
        direction: result.direction,
        target: result.target,
        result: result.result,
        win: result.win,
        multiplier: result.multiplier / MULTIPLIER_PRECISION,
        pfServerSeedHash: result.pfServerSeedHash,
        pfClientSeed: result.pfClientSeed,
        pfNonce: result.pfNonce,
        createdAt: result.createdAt.toISOString(),
      };
    } catch (error) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: error instanceof Error ? error.message : 'Failed to play',
        statusCode: 400,
      });
    }
  });

  // Get play history
  fastify.get('/plays', {
    onRequest: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId!;
    const query = PlaysQuerySchema.parse(request.query);

    const { plays, total } = await getPlays(prisma, userId, {
      limit: query.limit,
      offset: query.offset,
    });

    return {
      plays: plays.map((play) => ({
        id: play.id,
        gameType: play.gameType,
        currency: play.currency,
        amount: play.amount.toString(),
        payoutAmount: play.payoutAmount.toString(),
        direction: play.direction,
        target: play.target,
        result: play.result,
        win: play.win,
        multiplier: play.multiplier / MULTIPLIER_PRECISION,
        pfServerSeedHash: play.pfServerSeedHash,
        pfClientSeed: play.pfClientSeed,
        pfNonce: play.pfNonce,
        createdAt: play.createdAt.toISOString(),
      })),
      total,
    };
  });

  // Verify a play
  fastify.get('/plays/:id/verify', {
    onRequest: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId!;
    const params = PlayIdSchema.parse(request.params);

    try {
      const verification = await verifyPlay(prisma, params.id, userId);

      return verification;
    } catch (error) {
      return reply.status(404).send({
        error: 'Not Found',
        message: error instanceof Error ? error.message : 'Play not found',
        statusCode: 404,
      });
    }
  });
}
