import { Controller, Post, Body, HttpCode, HttpStatus, Get, Req, Res, UseGuards, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';   // ← Correction du chemin
import { Roles } from './decorators/roles.decorator';     // ← Ajoute ceci
import { GetUser } from '../users/decorators/get-user.decorator'; // ← Ajoute ceci (ou le bon chemin)
import { Role } from './enums/role.enum';
import { ChangePasswordDto } from './dto/change-password.dto';                 // ← Ajoute ceci
import { CreateUserDto } from 'src/users/dto/create-user.dto';






@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) {}


    @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Redirige vers Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    // req.user contient le résultat de validateOAuthLogin
    const { access_token, user } = req.user;

    // Option 1 : Rediriger vers le frontend avec le token
    return res.redirect(
      `http://localhost:3000/auth/callback?token=${encodeURIComponent(access_token)}`,
    );

    // Option 2 : Renvoyer du JSON (si appelé depuis un mobile ou SPA avec popup)
    // return res.json({ access_token, user });
  }

  // ========== APPLE ==========
  @Get('apple')
  @UseGuards(AuthGuard('apple'))
  async appleAuth() {
    // Redirige vers Apple
  }

  @Get('apple/callback')
  @UseGuards(AuthGuard('apple'))
  async appleAuthRedirect(@Req() req, @Res() res: Response) {
    const { access_token, user } = req.user;

    return res.redirect(
      `http://localhost:3000/auth/callback?token=${encodeURIComponent(access_token)}`,
    );
  }

    @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refresh(refreshToken);
 }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Req() req) {
    return this.authService.logout(req.user.id); // ou req.user.sub
 }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.EMPLOYEE, Role.ADMIN, Role.HOD)     // ← Ici
  getProfile(@GetUser() user) {
    return user;
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Req() req,
    @Body() dto: ChangePasswordDto,
  ) 
  {
    return this.authService.changePassword(req.user.id, dto);
  }

}