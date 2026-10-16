// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from 'src/users/users.module';
import { RolesGuard } from './guards/roles.guard';
import { Token } from './entities/token.entity';
import { TokenService } from './token.service';
import { TokenModule } from './token.module';
import { GoogleStrategy } from './strategies/google.strategy';
import { AppleStrategy } from './strategies/apple.strategy';


@Module({
  imports: [
    UsersModule, TokenModule,
    TypeOrmModule.forFeature([User, Token]),
    ConfigModule,                    // Pour utiliser ConfigService
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { 
          expiresIn: configService.get('JWT_EXPIRES_IN')
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, AppleStrategy, TokenService, JwtStrategy, RolesGuard],
  exports: [AuthService, PassportModule, JwtStrategy, RolesGuard ],   // Pour pouvoir l'utiliser dans d'autres modules
})
export class AuthModule {}