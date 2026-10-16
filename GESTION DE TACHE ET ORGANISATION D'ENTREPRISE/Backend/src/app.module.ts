import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Assure-toi d'utiliser @nestjs/config
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { AdminModule } from './admin/admin.module';
import { DepartementModule } from './departement/departement.module';
import { TokenController } from './auth/token.controller';
import { ProjectsModule } from './project/project.module';
import { User } from './users/entities/user.entity';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: '.env',
    }),
  
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>({
        type: 'mysql',
        host: configService.get('DB_HOST') || 'sakura.proxy.rlwy.net',
        port: Number(configService.get('DB_PORT') || 13002),
        username: configService.get('DB_USERNAME') || 'root',
        password: configService.get('DB_PASSWORD') || '',
        database: configService.get('DB_DATABASE') || 'railway',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        retryAttempts: 3,
      }),
    }),

    UsersModule, AuthModule, TasksModule, AdminModule, DepartementModule, ProjectsModule
  
  ],
  controllers: [AppController, TokenController],
  providers: [AppService],
})
export class AppModule {}
