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

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: { departement: true }, // attention à l'orthographe
    });

    console.log('===== User trouvé =====', user);

    if (!user) {
      throw new UnauthorizedException('Utilisateur inexistant');
    }

    if (!user.status) {
      throw new UnauthorizedException('Compte inactif');
    }

    // Ce que tu retournes ici devient req.user
    return user;
  }
}