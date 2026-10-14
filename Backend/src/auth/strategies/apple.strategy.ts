// src/auth/strategies/apple.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  private jwksClient: jwksClient.JwksClient;

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('APPLE_CLIENT_ID'),
      teamID: configService.getOrThrow<string>('APPLE_TEAM_ID'),
      keyID: configService.get<string>('APPLE_KEY_ID'),
      privateKeyString: configService.get<string>('APPLE_PRIVATE_KEY'),
      callbackURL: configService.get<string>('APPLE_CALLBACK_URL'),
      scope: ['name', 'email'],
      passReqToCallback: false,
    });

    this.jwksClient = jwksClient({
      jwksUri: 'https://appleid.apple.com/auth/keys',
      cache: true,
      rateLimit: true,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    idToken: string,
    profile: any,
  ) {
    // Vérification du id_token Apple
    const decoded = await this.verifyAppleToken(idToken);

    const user = await this.authService.validateOAuthLogin({
      provider: 'apple',
      providerId: decoded.sub,
      email: decoded.email,
      // Apple ne renvoie le nom qu'à la première connexion
      firstName: profile?.name?.firstName,
      lastName: profile?.name?.lastName,
      accessToken,
    });

    return user;
  }

  private async verifyAppleToken(idToken: string): Promise<any> {
    const decodedHeader = jwt.decode(idToken, { complete: true });
    if (!decodedHeader || typeof decodedHeader === 'string') {
      throw new UnauthorizedException('Invalid Apple token');
    }

    const key = await this.jwksClient.getSigningKey(decodedHeader.header.kid);
    const publicKey = key.getPublicKey();

    try {
      return jwt.verify(idToken, publicKey, {
        algorithms: ['RS256'],
        audience: this.configService.get<string>('APPLE_CLIENT_ID'),
        issuer: 'https://appleid.apple.com',
      });
    } catch (err) {
      throw new UnauthorizedException('Apple token verification failed');
    }
  }
}