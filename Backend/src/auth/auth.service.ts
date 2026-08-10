// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User} from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { TokenService } from './token.service';  // ← Ajouté 
import { UsersService } from 'src/users/users.service';
import { Role } from './enums/role.enum';
import { RegisterDto } from './dto/register.dto';
import { ConfigService } from '@nestjs/config';



@Injectable()
export class AuthService {
  constructor(
    // @InjectRepository(User)
     private readonly usersService: UsersService,
    
    private readonly jwtService: JwtService,

    private readonly tokenService: TokenService,   // ← Injection ajoutée

    private readonly configService: ConfigService,  // ← Injection ajoutée
  ) {}

  private generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') || '1h') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d') as any,
    });

    return { accessToken, refreshToken };
  }


  async register(dto: RegisterDto) {
    const userCount = await this.usersService.count();

    // Après le premier utilisateur → inscription publique fermée
    if (userCount > 0) {
      throw new ForbiddenException(
        'L\'inscription publique est fermée. Seul un administrateur peut créer des comptes desormet.',
      );
    }

    // Premier utilisateur = admin sans besoin de département
    const user = await this.usersService.createAdmin(
      {
        email: dto.email!,
        password: dto.password!,
        nom: dto.nom!,
        telephone: dto.telephone!,
      }
    );
    const { accessToken, refreshToken } = this.generateTokens(user);

    // Sauvegarder le refresh token
    await this.tokenService.saveRefreshToken(user.id!, accessToken, refreshToken);

    const token = this.generateTokens(user);
    const { password, ...result } = user;
    return {
      message: 'Compte administrateur créé avec succès',
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
      user: result,
    };
  }

  // ===== LOGIN =====
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email!);
    if (!user) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const isPasswordValid = await bcrypt.compare(dto.password!, user.password!);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const { accessToken, refreshToken } = this.generateTokens(user);

    // Sauvegarder le refresh token
    await this.tokenService.saveRefreshToken(user.id!,accessToken, refreshToken);

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

    // Vérifier que le token existe en base
    const storedToken = await this.tokenService.findRefreshToken(refreshToken);
    if (!storedToken) {
      throw new UnauthorizedException('Refresh token invalide ou révoqué');
    }

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Utilisateur introuvable');
      }

      // Générer de nouveaux tokens (rotation)
      const { accessToken, refreshToken: newRefreshToken } =
        this.generateTokens(user);

      // Remplacer l'ancien refresh token
      await this.tokenService.saveRefreshToken(user.id!, accessToken, newRefreshToken);

      return {
        access_token: accessToken,
        refresh_token: newRefreshToken,
      };
    } catch (error) {
      // Token expiré ou invalide → on le révoque
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

    if (!user) throw new BadRequestException('Utilisateur non trouvé');

    // Vérifier l'ancien mot de passe
    const isMatch = await bcrypt.compare(dto.oldPassword!, user.password!);
    if (!isMatch) {
      throw new BadRequestException('Ancien mot de passe incorrect');
    }

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(dto.newPassword!, salt);

    // Optionnel : révoquer tous les tokens après changement de mot de passe
    await this.tokenService.revokeToken(userId);

    await this.usersService.save(user);

    return { message: 'Mot de passe modifié avec succès' };
  }
}