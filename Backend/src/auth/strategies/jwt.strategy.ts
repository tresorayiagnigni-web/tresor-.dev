import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

export interface JwtPayload {
  sub: number;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'JWT_SECRET',
    });
  }

  async validate(payload: JwtPayload) {
  console.log('===== JWT Payload =====', payload);
  console.log('Type de payload.sub :', typeof payload.sub);

  const user = await this.userRepository.findOne({
    where: { id: Number(payload.sub) },
    relations: { departement: true },
  });

  console.log('===== User trouvé =====', user);
  console.log('Status de l\'utilisateur :', user?.status);

  if (!user) {
    throw new UnauthorizedException('Utilisateur inexistant');
  }

  // status est un boolean
  if (user.status === false) {
    throw new UnauthorizedException('Compte inactif');
  }

  // Ce que tu retournes devient req.user
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    nom: user.nom,
    telephone: user.telephone,
    status: user.status,
    departementId: user.departementId ?? user.departement?.id ?? null,
    departement: user.departement,
  };
}
}