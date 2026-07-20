import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SlackService } from './modules/slack/slack.service';

process.on('unhandledRejection', (reason, promise) => {
  console.error('[WARN] Unhandled promise rejection at:', promise, 'reason:', reason);
  // Do not exit — BullMQ/ioredis retries emit rejections; killing the process causes a Railway restart loop
});
process.on('uncaughtException', (err, origin) => {
  console.error('[WARN] Uncaught exception:', err.message, '\nStack:', err.stack, '\nOrigin:', origin);
  // Do not exit — keeps the HTTP server alive for auth/registration even if BullMQ workers fail
});
process.on('SIGTERM', () => {
  console.log('[Shutdown] SIGTERM received — exiting gracefully');
  process.exit(0);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const slackService = app.get(SlackService);

  console.log('CORS: allowing all origins (auth secured by JWT)');

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-OpsPilot-Webhook-Secret'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (slackService.isEnabled && slackService.receiver) {
    app.use('/slack/events', slackService.receiver.app);
  }

  const port = parseInt(String(process.env.PORT || process.env.APP_PORT || 3000), 10);
  console.log(`[Startup] Binding to 0.0.0.0:${port} (PORT env=${process.env.PORT})`);
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 OpsPilot AI running on port ${port}`);
}

bootstrap();
