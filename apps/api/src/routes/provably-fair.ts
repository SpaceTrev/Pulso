/**
 * Provably Fair Routes
 *
 * GET /provablyfair/commit - Get current server seed hash and nonce
 * POST /provablyfair/client-seed - Set client seed
 * POST /provablyfair/rotate - Rotate server seed (reveals old seed)
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@pulso/db';
import { SetClientSeedSchema } from '@pulso/shared';
import {
  getOrCreateSession,
  setClientSeed,
  rotateSeed,
} from '../services/provably-fair.service';

export async function provablyFairRoutes(fastify: FastifyInstance) {
  // Get current commit (server seed hash + nonce)
  fastify.get('/commit', {
    onRequest: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId!;

    const session = await getOrCreateSession(prisma, userId);

    return {
      serverSeedHash: session.serverSeedHash,
      clientSeed: session.clientSeed,
      nonce: session.nonce,
    };
  });

  // Set client seed
  fastify.post('/client-seed', {
    onRequest: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId!;
    const body = SetClientSeedSchema.parse(request.body);

    const session = await setClientSeed(prisma, userId, body.clientSeed);

    return {
      serverSeedHash: session.serverSeedHash,
      clientSeed: session.clientSeed,
      nonce: session.nonce,
    };
  });

  // Rotate server seed
  fastify.post('/rotate', {
    onRequest: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId!;

    try {
      const result = await rotateSeed(prisma, userId);

      return {
        previousServerSeed: result.previousServerSeed,
        newServerSeedHash: result.newServerSeedHash,
        message: 'Server seed rotated. You can now verify all previous plays with the revealed seed.',
      };
    } catch (error) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: error instanceof Error ? error.message : 'Failed to rotate seed',
        statusCode: 400,
      });
    }
  });
}
