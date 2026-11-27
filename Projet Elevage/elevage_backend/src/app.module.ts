
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { MulterModule } from '@nestjs/platform-express';
import { join } from 'path';

// Configuration
import databaseConfig from './config/database.config.js';
import { multerConfig } from './config/multer.config.js';

// Modules principaux
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { HealthModule } from './health/health.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { FarmsModule } from './farms/farms.module.js';
import { BandsModule } from './bands/bands.module.js';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { BandRecordsModule } from './band-records/band-records.module.js';
import { SettingsModule } from './settings/settings.module.js';

@Module({
  imports: [

    // 1. Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig],
    }),

    // 2. Connexion MySQL
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),

        autoLoadEntities: true,
        synchronize: false,

        retryAttempts: 3,
        retryDelay: 3000,
      }),
    }),

    // 3. Accès aux images
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',

      serveStaticOptions: {
        maxAge: 1000 * 60 * 60,
      },
    }),

    // 4. Configuration Multer
    MulterModule.register({
      storage: multerConfig.storage,
      limits: multerConfig.limits,
      fileFilter: multerConfig.fileFilter,
    }),

    // 5. Modules métier
    AuthModule,
    UsersModule,
    HealthModule,
    InventoryModule,
    FarmsModule,
    BandsModule,
    BandRecordsModule,
    SettingsModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
