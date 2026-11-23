import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AppInterceptor } from './interceptors/app.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Intercepteur global
  app.useGlobalInterceptors(new AppInterceptor());

  // ✅ CORS — un seul appel, avec toutes les options
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Validation globale des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Gestion de tâches API')
    .setDescription('API de gestion de tâches et organisation d\'entreprise')
    .setVersion('1.0')
    .addBearerAuth() // 👉 ajoute le bouton "Authorize" pour tester avec JWT
    .build();
  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, config));

  // Lancement sur 0.0.0.0 pour permettre l'accès depuis l'extérieur (Railway, etc.)
  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger:              ${await app.getUrl()}/api`);
}

bootstrap();