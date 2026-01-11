import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';

import { healthRoutes } from './routes/health';
import { authRoutes } from './routes/auth';
import { balanceRoutes } from './routes/balance';
import { provablyFairRoutes } from './routes/provably-fair';
import { gameRoutes } from './routes/games';
import { claimRoutes } from './routes/claims';
import { redemptionRoutes } from './routes/redemptions';
import { adminRoutes } from './routes/admin';

dotenv.config();

// Extend Fastify types
declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    userRole?: 'USER' | 'ADMIN';
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; role: 'USER' | 'ADMIN' };
    user: { userId: string; role: 'USER' | 'ADMIN' };
  }
}

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
  requestIdHeader: 'x-request-id',
  genReqId: () => crypto.randomUUID(),
});

// Register plugins
async function registerPlugins() {
  // Security headers
  await server.register(helmet, {
    contentSecurityPolicy: false, // Disable for API
  });

  // CORS
  await server.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  });

  // Rate limiting
  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // JWT
  await server.register(jwt, {
    secret: process.env.JWT_SECRET || 'change-this-secret-in-production',
    sign: {
      expiresIn: '7d',
    },
  });

  // OpenAPI docs
  await server.register(swagger, {
    openapi: {
      info: {
        title: 'Pulso API',
        description: 'Sweepstakes entertainment platform API',
        version: '1.0.0',
      },
      servers: [
        {
          url: process.env.API_URL || 'http://localhost:3001',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await server.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });
}

// Auth decorator
server.decorate('authenticate', async function (request: any, reply: any) {
  try {
    await request.jwtVerify();
    request.userId = request.user.userId;
    request.userRole = request.user.role;
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired token', statusCode: 401 });
  }
});

// Admin check decorator
server.decorate('requireAdmin', async function (request: any, reply: any) {
  if (request.userRole !== 'ADMIN') {
    reply.status(403).send({ error: 'Forbidden', message: 'Admin access required', statusCode: 403 });
  }
});

// Register routes
async function registerRoutes() {
  await server.register(healthRoutes, { prefix: '/api' });
  await server.register(authRoutes, { prefix: '/auth' });
  await server.register(balanceRoutes, { prefix: '/' });
  await server.register(provablyFairRoutes, { prefix: '/provablyfair' });
  await server.register(gameRoutes, { prefix: '/games' });
  await server.register(claimRoutes, { prefix: '/claims' });
  await server.register(redemptionRoutes, { prefix: '/redemptions' });
  await server.register(adminRoutes, { prefix: '/admin' });
}

// Root route
server.get('/', async () => {
  return {
    name: 'Pulso API',
    version: '1.0.0',
    status: 'operational',
    docs: '/docs',
  };
});

// Error handler
server.setErrorHandler((error, request, reply) => {
  server.log.error(error);

  // Zod validation errors
  if (error.name === 'ZodError') {
    return reply.status(400).send({
      error: 'Validation Error',
      message: 'Invalid request data',
      statusCode: 400,
      details: error,
    });
  }

  // Rate limit errors
  if (error.statusCode === 429) {
    return reply.status(429).send({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      statusCode: 429,
    });
  }

  // Default error
  const statusCode = error.statusCode || 500;
  return reply.status(statusCode).send({
    error: error.name || 'Internal Server Error',
    message: error.message || 'An unexpected error occurred',
    statusCode,
  });
});

const start = async () => {
  try {
    await registerPlugins();
    await registerRoutes();

    const port = parseInt(process.env.API_PORT || '3001', 10);
    const host = process.env.API_HOST || '0.0.0.0';

    await server.listen({ port, host });
    console.log(`🚀 API server running on http://${host}:${port}`);
    console.log(`📚 API docs available at http://${host}:${port}/docs`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
