/**
 * Redemption Routes
 *
 * POST /redemptions - Create a redemption request (web only)
 * GET /redemptions - Get user's redemption requests
 * GET /redemptions/:id - Get specific redemption request
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@pulso/db';
import { CreateRedemptionSchema } from '@pulso/shared';
import { debitBalance } from '../services/ledger.service';
import { z } from 'zod';
import { MIN_REDEMPTION_AMOUNT } from '@pulso/shared';

const RedemptionIdSchema = z.object({
  id: z.string().uuid(),
});

export async function redemptionRoutes(fastify: FastifyInstance) {
  // Get all redemptions for user
  fastify.get('/', {
    onRequest: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId!;

    const redemptions = await prisma.redemptionRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return redemptions.map((r) => ({
      id: r.id,
      amountSc: r.amountSc.toString(),
      status: r.status,
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  });

  // Get specific redemption
  fastify.get('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId!;
    const params = RedemptionIdSchema.parse(request.params);

    const redemption = await prisma.redemptionRequest.findFirst({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!redemption) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Redemption request not found',
        statusCode: 404,
      });
    }

    return {
      id: redemption.id,
      amountSc: redemption.amountSc.toString(),
      status: redemption.status,
      notes: redemption.notes,
      createdAt: redemption.createdAt.toISOString(),
      updatedAt: redemption.updatedAt.toISOString(),
    };
  });

  // Create redemption request
  // NOTE: This endpoint should only be accessible from web (not mobile)
  // The mobile app should check user-agent or use a different auth mechanism
  // For MVP, we'll allow it but add a header check
  fastify.post('/', {
    onRequest: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId!;

    // Check for mobile user-agent (basic check for MVP)
    const userAgent = request.headers['user-agent'] || '';
    const isMobile = userAgent.includes('Expo') || userAgent.includes('okhttp');

    if (isMobile) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Redemption requests can only be created from the web platform.',
        statusCode: 403,
      });
    }

    const body = CreateRedemptionSchema.parse(request.body);
    const amountSc = BigInt(body.amountSc);

    // Validate minimum amount
    if (amountSc < MIN_REDEMPTION_AMOUNT) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: `Minimum redemption amount is ${MIN_REDEMPTION_AMOUNT} SC`,
        statusCode: 400,
      });
    }

    // Debit SC
    const debitResult = await debitBalance(
      prisma,
      userId,
      'SC',
      amountSc,
      'REDEMPTION_REQUEST'
    );

    if (!debitResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: debitResult.error || 'Insufficient SC balance',
        statusCode: 400,
      });
    }

    // Create redemption request
    const redemption = await prisma.redemptionRequest.create({
      data: {
        userId,
        amountSc,
        status: 'PENDING',
      },
    });

    // Update the ledger entry with reference
    await prisma.ledgerEntry.updateMany({
      where: {
        id: debitResult.ledgerEntryId,
      },
      data: {
        refType: 'redemption_request',
        refId: redemption.id,
      },
    });

    return {
      id: redemption.id,
      amountSc: redemption.amountSc.toString(),
      status: redemption.status,
      notes: redemption.notes,
      createdAt: redemption.createdAt.toISOString(),
      updatedAt: redemption.updatedAt.toISOString(),
    };
  });
}
