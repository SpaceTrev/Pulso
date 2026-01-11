import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { healthRoutes } from './routes/health';

dotenv.config();

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Register plugins
server.register(cors, {
  origin: process.env.CORS_ORIGIN || '*',
});

server.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
});

// Register routes
server.register(healthRoutes, { prefix: '/api' });

// Root route
server.get('/', async () => {
  return { message: 'Pulso API' };
});

const start = async () => {
  try {
    const port = parseInt(process.env.API_PORT || '3001', 10);
    const host = process.env.API_HOST || '0.0.0.0';

    await server.listen({ port, host });
    console.log(`🚀 API server running on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
