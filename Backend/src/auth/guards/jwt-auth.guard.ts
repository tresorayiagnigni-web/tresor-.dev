import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    // Afficher la véritable cause dans le terminal NestJS.
    if (err) {
      console.error('Erreur JWT :', err.message);
      throw err;
    }

    if (!user) {
      console.error(
        'Échec authentification JWT :',
        info?.message ?? 'Utilisateur non authentifié',
      );

      throw new UnauthorizedException(
        info?.message ?? 'Authentification refusée',
      );
    }

    return user;
  }
}