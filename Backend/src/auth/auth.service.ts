// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { TokenService } from './token.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

export interface OAuthUserData {
  provider: 'google' | 'apple';
  providerId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  accessToken?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
  ) {}

  // ====================== HELPERS ======================
  private generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      departementId: user.departementId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN') || '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    return { accessToken, refreshToken };
  }

  // ====================== OAUTH (Google / Apple) ======================
  async validateOAuthLogin(data: OAuthUserData) {
    // 1. Chercher par provider + providerId
    let user = await this.usersService.findByProvider(
      data.provider,
      data.providerId,
    );

    // 2. Si pas trouvé → chercher par email
    if (!user && data.email) {
      user = await this.usersService.findByEmail(data.email);
    }

    // 3. Créer un nouvel utilisateur si inexistant
    if (!user) {
      user = await this.usersService.createOAuthUser({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        picture: data.picture,
        providers: [
          {
            provider: data.provider,
            providerId: data.providerId,
          },
        ],
      });
    } else {
      // 4. Lier le provider s'il n'est pas déjà lié
      await this.usersService.linkProvider(user.id!, {
        provider: data.provider,
        providerId: data.providerId,
      });
    }

    // 5. Générer les tokens (même logique que login classique)
    const { accessToken, refreshToken } = this.generateTokens(user);

    // Sauvegarder le refresh token
    await this.tokenService.saveRefreshToken(
      user.id!,
      accessToken,
      refreshToken,
    );

    const { password, ...result } = user;

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: result,
    };
  }

  // ====================== REGISTER ======================
  async register(dto: RegisterDto) {
    const userCount = await this.usersService.count();

    if (userCount > 0) {
      throw new ForbiddenException(
        "L'inscription publique est fermée. Seul un administrateur peut créer des comptes désormais.",
      );
    }

    const user = await this.usersService.createAdmin({
      email: dto.email!,
      password: dto.password!,
      nom: dto.nom!,
      telephone: dto.telephone!,
    });

    const { accessToken, refreshToken } = this.generateTokens(user);

    await this.tokenService.saveRefreshToken(
      user.id!,
      accessToken,
      refreshToken,
    );

    const { password, ...result } = user;

    return {
      message: 'Compte administrateur créé avec succès',
      access_token: accessToken,
      refresh_token: refreshToken,
      user: result,
    };
  }

  // ====================== LOGIN ======================
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email!);
    if (!user) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password!,
      user.password!,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const { accessToken, refreshToken } = this.generateTokens(user);

    await this.tokenService.saveRefreshToken(
      user.id!,
      accessToken,
      refreshToken,
    );

    const { password, ...result } = user;

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: result,
    };
  }

  // ====================== REFRESH TOKEN ======================
  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token manquant');
    }

    const storedToken = await this.tokenService.findRefreshToken(refreshToken);
    if (!storedToken) {
      throw new UnauthorizedException('Refresh token invalide ou révoqué');
    }

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Utilisateur introuvable');
      }

      const { accessToken, refreshToken: newRefreshToken } =
        this.generateTokens(user);

      await this.tokenService.saveRefreshToken(
        user.id!,
        accessToken,
        newRefreshToken,
      );

      return {
        access_token: accessToken,
        refresh_token: newRefreshToken,
      };
    } catch (error) {
      await this.tokenService.revokeRefreshToken(refreshToken);
      throw new UnauthorizedException('Refresh token expiré ou invalide');
    }
  }

  // ====================== LOGOUT ======================
  async logout(userId: number): Promise<{ message: string }> {
    await this.tokenService.revokeToken(userId);
    return { message: 'Déconnexion réussie' };
  }

  // ====================== CHANGE PASSWORD ======================
  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword!, user.password!);
    if (!isMatch) {
      throw new BadRequestException('Ancien mot de passe incorrect');
    }

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(dto.newPassword!, salt);

    await this.tokenService.revokeToken(userId);
    await this.usersService.save(user);

    return { message: 'Mot de passe modifié avec succès' };
  }
}