import { FastifyInstance } from 'fastify';
import { prisma } from '@pulso/db';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async () => {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
      };
    }
  });
}
