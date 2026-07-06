import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SlackService } from './modules/slack/slack.service';

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err);
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

  const port = process.env.PORT || process.env.APP_PORT || 3000;
  await app.listen(port);
  console.log(`🚀 OpsPilot AI running on port ${port}`);
}

bootstrap();
