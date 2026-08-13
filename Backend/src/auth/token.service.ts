import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Token } from './entities/token.entity';
import { addHours, addMinutes } from 'date-fns';
import { addSeconds } from 'date-fns/addSeconds';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
  ) {}

  async saveAccessToken(
    userId: number,
    accessToken: string,
    refreshToken: string,
  ): Promise<Token> {

    const expires_le = addMinutes(new Date(), 15);

    // Désactiver les anciens tokens
    await this.tokenRepository.update(
      { userId, status: false },
      { status: true },
    );

    // Date d'expiration du refresh token (+7 jours)
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 7);

    const token = this.tokenRepository.create({
      userId,
      accessToken,
      refreshToken,
      expire_le: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      status: false,
    });

    return await this.tokenRepository.save(token);
  }

  async getValidAccessToken(userId: number): Promise<Token | null> {
    return await this.tokenRepository.findOne({
      where: {
        userId,
        status: false,
      },
      order: {
        cree_le: 'DESC',
      },
    });
  }

  async isTokenValid(token: Token): Promise<boolean> {
    if (!token) return false;

    if (token.status) return false;

    if (!token.expire_le) return false;

    return new Date() < token.expire_le;
  }

  async revokeToken(userId: number): Promise<void> {
    await this.tokenRepository.update(
      { userId, status: false },
      { status: true },
    );
  }

  async saveRefreshToken(userId: number, accessToken: string, refreshToken: string): Promise<void> {
    // On supprime les anciens refresh tokens de cet utilisateur (optionnel mais recommandé)
    await this.tokenRepository.update(
      { userId, status: true },
      { status: false },
  );

    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 1);

    const token = this.tokenRepository.create({
      userId,
      refreshToken,
      accessToken,
      expire_le: expireDate, // ou une autre logique pour définir la date d'expiration
      status: true,
    });

    await this.tokenRepository.save(token);
  }

  async findRefreshToken(refreshToken: string): Promise<Token | null> {
    return this.tokenRepository.findOne({
      where: { refreshToken },
      relations: { user: true }, // si tu as une relation
    });
  }

  // async revokeToken(userId: number): Promise<void> {
  //   await this.tokenRepository.delete({ userId });
  // }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.tokenRepository.delete({ refreshToken });
  }
}