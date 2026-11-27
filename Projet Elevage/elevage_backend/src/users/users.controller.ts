
import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';
// import { deleteUserDto } from './dto/delete-user.dto.js';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/role.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from './entities/user.entity.js';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  // Créer un compte employé
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // Récupérer tous les employés
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // Récupérer un employé par son ID
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findEmployeeById(id);
  }

  // Modifier les informations d'un employé
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  // Activer ou désactiver un employé
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(
      id,
      updateStatusDto.status,
    );
  }
  
  @Delete(':id')
remove(@Param('id', ParseIntPipe) id: number) {
  return this.usersService.remove(id);
}

@Post(':id/restore')
restore(@Param('id', ParseIntPipe) id: number) {
  return this.usersService.restore(id);
}
}
