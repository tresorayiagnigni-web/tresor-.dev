import { Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();

    const user = await this.usersService.findByEmail(email);

    console.log('--- DIAGNOSTIC CONNEXION ---');
    console.log('Email recherché :', email);
    console.log('Utilisateur trouvé :', !!user);
    console.log('Compte actif :', user?.status);

    if (!user || !user.status) {
      console.log('Résultat : utilisateur absent ou inactif');
      throw new UnauthorizedException(
        'Adresse email ou mot de passe incorrect.',
      );
    }

    const passwordIsValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    console.log('Mot de passe valide :', passwordIsValid);
    console.log('--- FIN DIAGNOSTIC ---');

    if (!passwordIsValid) {
      throw new UnauthorizedException(
        'Adresse email ou mot de passe incorrect.',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
      },
    };
  }
}
