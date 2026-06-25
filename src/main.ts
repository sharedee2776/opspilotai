import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SlackService } from './modules/slack/slack.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const slackService = app.get(SlackService);

  app.enableCors({
    origin: process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL, 'http://localhost:5175']
      : ['http://localhost:5175', 'http://localhost:3000'],
    credentials: true,
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
