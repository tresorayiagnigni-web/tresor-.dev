import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AppInterceptor } from './interceptors/app.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new AppInterceptor());
  // Enable CORS to allow cross-origin requests
  app.enableCors({
    origin: 'http://localhost:3000', // Adresse du frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({whitelist: true, transform: true, forbidNonWhitelisted: true}));
  
  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  // Pass '0.0.0.0' to bind the server to all network interfaces
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');

  console.log(`Application is running on: ${await app.getUrl()}`);

  app.enableCors({
  origin: 'http://localhost:3000', // URL de ton frontend
  credentials: true,
  });
}
bootstrap();