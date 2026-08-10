import { Controller, Post, Body, HttpCode, HttpStatus, Get, Req, UseGuards, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
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
  @Roles(Role.EMPLOYEE, Role.ADMIN)     // ← Ici
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