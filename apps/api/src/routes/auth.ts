/**
 * Auth Routes
 *
 * POST /auth/register - Register a new user
 * POST /auth/login - Login and get JWT
 * GET /me - Get current user
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@pulso/db';
import { RegisterSchema, LoginSchema } from '@pulso/shared';
import * as argon2 from 'argon2';
import { initializeUserBalances } from '../services/ledger.service';
import { getOrCreateSession } from '../services/provably-fair.service';
import { INITIAL_GC_GRANT, INITIAL_SC_GRANT } from '@pulso/shared';

export async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post('/register', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = RegisterSchema.parse(request.body);

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (existing) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Email already registered',
        statusCode: 400,
      });
    }

    // Hash password
    const passwordHash = await argon2.hash(body.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        passwordHash,
        role: 'USER',
      },
    });

    // Initialize balances with grants
    await initializeUserBalances(prisma, user.id, INITIAL_GC_GRANT, INITIAL_SC_GRANT);

    // Create provably fair session
    await getOrCreateSession(prisma, user.id);

    // Generate JWT
    const accessToken = fastify.jwt.sign({
      userId: user.id,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      accessToken,
    };
  });

  // Login
  fastify.post('/login', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = LoginSchema.parse(request.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (!user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid email or password',
        statusCode: 401,
      });
    }

    // Verify password
    const valid = await argon2.verify(user.passwordHash, body.password);

    if (!valid) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid email or password',
        statusCode: 401,
      });
    }

    // Generate JWT
    const accessToken = fastify.jwt.sign({
      userId: user.id,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      accessToken,
    };
  });

  // Get current user
  fastify.get('/me', {
    onRequest: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'User not found',
        statusCode: 404,
      });
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  });
}

// Extend Fastify instance with authenticate decorator
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
