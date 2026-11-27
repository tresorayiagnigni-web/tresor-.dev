
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';


import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

   // Autoriser les requêtes venant du frontend mobile
  app.enableCors({
    origin: true,
  });

  // Préfixe global de l'API
  app.setGlobalPrefix('api');

  // Validation globale des données
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Documentation Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Elevage API')
    .setDescription('API de gestion des exploitations et des animaux')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(
    app,
    swaggerConfig,
  );

  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;

  await app.listen(port, '0.0.0.0');

  console.log(`Elevage API : http://localhost:${port}/api`);
  console.log(`Swagger : http://localhost:${port}/api/docs`);
}

bootstrap();
