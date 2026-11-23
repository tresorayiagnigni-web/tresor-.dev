import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Request,
  UseGuards,
  Patch,
  Body,
  ParseIntPipe,
  UnauthorizedException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update.user.dto';
import { User } from './entities/user.entity';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Roles } from './decorators copy/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from './enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { AuthGuard } from '@nestjs/passport/dist/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../config p/multer.config';
import sharp from 'sharp';
import { join, extname, basename } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { AVATARS_DIR } from '../config p/multer.config';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('admin')
  async createAdmin(
    @Body()
    dto: {
      email: string;
      password: string;
      nom: string;
      telephone: string;
    },
  ): Promise<User> {
    return this.usersService.createAdmin(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req: any) {
    return req.user;
  }

  // ====================== PROFIL / AVATAR ======================
  // ⚠️ Ces routes DOIVENT être déclarées AVANT @Get(':id')

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: any) {
    return this.usersService.getMe(req.user.id);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadAvatar(@UploadedFile() file: any, @Request() req: any) {
    if (!file) {
      throw new BadRequestException('Aucun fichier envoyé');
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(
        'Format non supporté. Formats acceptés : jpg, png, webp.',
      );
    }

    const inputPath = file.path;
    // 🎯 On ajoute un suffixe _512 pour garantir un nom de sortie différent
    // de l'original, même quand on upload un .jpg (sinon sharp plante avec
    // "Cannot use same file for input and output").
    const originalBasename = basename(file.filename, extname(file.filename));
    const newFilename = `${originalBasename}_512.jpg`;
    const outputPath = join(AVATARS_DIR, newFilename);

    try {
      await sharp(inputPath)
        .resize(512, 512, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 85 })
        .toFile(outputPath);

      // Supprime l'original (maintenant qu'on a le redimensionné)
      if (existsSync(inputPath) && inputPath !== outputPath) {
        unlinkSync(inputPath);
      }
    } catch (err) {
      console.error('Erreur sharp :', err);
      if (existsSync(inputPath)) unlinkSync(inputPath);
      if (existsSync(outputPath)) unlinkSync(outputPath);
      throw new BadRequestException(
        "Erreur lors du traitement de l'image. Réessaie avec un autre fichier.",
      );
    }

    return this.usersService.updateAvatar(req.user.id, newFilename);
  }

  // ====================== CRUD EMPLOYÉS ======================

  @Post('employee')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createEmployee(@Body() dto: CreateUserDto) {
    console.log('DTO reçu par le controller :', dto);
    console.log('departementId :', dto.departementId);
    console.log('type :', typeof dto.departementId);

    const user = await this.usersService.createUser(dto);
    return {
      message: 'Employé créé avec succès',
      user,
    };
  }

  @Get('employees')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.HOD)
  findEmployees(@Request() req) {
    return this.usersService.findEmployees(req.user);
  }

  @Get('my-department/employees')
  @UseGuards(AuthGuard('jwt'))
  async getMyDepartmentEmployees(@Request() req) {
    console.log('===== req.user =====', req.user);
    if (!req.user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    const currentUserId = req.user.id;
    const employees = await this.usersService.findUsersInMyDepartment(
      currentUserId,
    );
    return {
      success: true,
      data: employees,
      message: 'Membres du département récupérés avec succès',
    };
  }

  @Get()
  async findAll() {
    return await this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.usersService.findOne(Number(id));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.usersService.updateStatus(+id, updateStatusDto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }
}