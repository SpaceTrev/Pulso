/**
 * Admin Routes
 *
 * POST /admin/grant - Grant coins to a user
 * GET /admin/users - List users
 * GET /admin/redemptions - List all redemption requests
 * PUT /admin/redemptions/:id - Update redemption status
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@pulso/db';
import { AdminGrantSchema, AdminRedemptionUpdateSchema } from '@pulso/shared';
import { creditBalance } from '../services/ledger.service';
import { z } from 'zod';

const RedemptionIdSchema = z.object({
  id: z.string().uuid(),
});

export async function adminRoutes(fastify: FastifyInstance) {
  // All admin routes require admin role
  fastify.addHook('onRequest', async (request, reply) => {
    await fastify.authenticate(request, reply);
    await fastify.requireAdmin(request, reply);
  });

  // Grant coins to user
  fastify.post('/grant', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = AdminGrantSchema.parse(request.body);
    const amount = BigInt(body.amount);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: body.userId },
    });

    if (!user) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'User not found',
        statusCode: 404,
      });
    }

    // Credit balance
    const result = await creditBalance(
      prisma,
      body.userId,
      body.currency,
      amount,
      'ADMIN_GRANT'
    );

    if (!result.success) {
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: result.error || 'Failed to grant coins',
        statusCode: 500,
      });
    }

    return {
      success: true,
      userId: body.userId,
      currency: body.currency,
      amount: body.amount,
      newBalance: result.newBalance?.toString(),
    };
  });

  // List users
  fastify.get('/users', async (request: FastifyRequest, reply: FastifyReply) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
    }));
  });

  // List all redemption requests
  fastify.get('/redemptions', async (request: FastifyRequest, reply: FastifyReply) => {
    const redemptions = await prisma.redemptionRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return redemptions.map((r) => ({
      id: r.id,
      userId: r.userId,
      userEmail: r.user.email,
      amountSc: r.amountSc.toString(),
      status: r.status,
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  });

  // Update redemption status
  fastify.put('/redemptions/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const params = RedemptionIdSchema.parse(request.params);
    const body = AdminRedemptionUpdateSchema.parse(request.body);

    // Get redemption
    const redemption = await prisma.redemptionRequest.findUnique({
      where: { id: params.id },
    });

    if (!redemption) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Redemption request not found',
        statusCode: 404,
      });
    }

    if (redemption.status !== 'PENDING') {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Only pending redemptions can be updated',
        statusCode: 400,
      });
    }

    // If rejecting, refund the SC
    if (body.status === 'REJECTED') {
      await creditBalance(
        prisma,
        redemption.userId,
        'SC',
        redemption.amountSc,
        'REDEMPTION_REFUND',
        'redemption_request',
        redemption.id
      );
    }

    // Update status
    const updated = await prisma.redemptionRequest.update({
      where: { id: params.id },
      data: {
        status: body.status,
        notes: body.notes || null,
      },
    });

    return {
      id: updated.id,
      amountSc: updated.amountSc.toString(),
      status: updated.status,
      notes: updated.notes,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  });
}
