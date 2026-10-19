import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS for Next.js frontend with explicit whitelist
  const allowedOrigins = [
    'http://localhost:3000',
    'https://ticket-booking-jzon.vercel.app',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Idempotency-Key',
      'X-Interaction-Latency',
      'X-Mouse-Entropy',
      'X-Bot-Risk-Score',
    ],
  });

  // Global prefix for versioned REST API
  app.setGlobalPrefix('api/v1');

  // Strict payload validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable graceful shutdown hooks for Redis and Prisma
  app.enableShutdownHooks();

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`Ticket Booking Backend running on: http://localhost:${port}/api/v1`);
}

bootstrap();
