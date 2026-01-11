/**
 * Balance Routes
 *
 * GET /balances - Get user balances
 * GET /ledger - Get ledger entries
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@pulso/db';
import { getBalances, getLedgerEntries } from '../services/ledger.service';
import { CurrencySchema } from '@pulso/shared';
import { z } from 'zod';

const LedgerQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  currency: CurrencySchema.optional(),
});

export async function balanceRoutes(fastify: FastifyInstance) {
  // Get balances
  fastify.get('/balances', {
    onRequest: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId!;

    const balances = await getBalances(prisma, userId);

    return {
      gc: balances.gc.toString(),
      sc: balances.sc.toString(),
    };
  });

  // Get ledger entries
  fastify.get('/ledger', {
    onRequest: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId!;
    const query = LedgerQuerySchema.parse(request.query);

    const { entries, total } = await getLedgerEntries(prisma, userId, {
      currency: query.currency,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      entries: entries.map((entry) => ({
        id: entry.id,
        currency: entry.currency,
        delta: entry.delta.toString(),
        reason: entry.reason,
        refType: entry.refType,
        refId: entry.refId,
        createdAt: entry.createdAt.toISOString(),
      })),
      total,
    };
  });
}
