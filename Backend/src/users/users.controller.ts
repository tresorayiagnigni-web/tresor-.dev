import {Controller, Get, Post, Put, Delete, Param, Request, UseGuards, Patch, Body, ParseIntPipe, UnauthorizedException} from '@nestjs/common';
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
    return req.user;                 // L'utilisateur décodé par le JWT
  }

  //cree un user
  // Seul l'admin peut créer des membres

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
  // @Post('users')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  // async createUser(@Body() dto: CreateUserDto) {
  //   const user = await this.usersService.createUser(dto);

  //   return {
  //     message: `${dto.role} créé avec succès`,
  //     user,
  //   };
  // }


  @Get('employees')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.HOD)
  findEmployees(@Request() req) {
    return this.usersService.findEmployees(req.user);
  }
  @Get()
  async findAll(){
    return await this.usersService.findAll();
  }

  //recuperer un user avec son  id

  @Get(':id')
  findOne(@Param('id') id:number){
    return this.usersService.findOne(Number(id));
  }

  
  //supprimer un user avec son id

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  // Modiffier le status d'un users

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles( Role.ADMIN)                   
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.usersService.updateStatus(+id, updateStatusDto);
  }

  // Modiffier un user par son id

  @Patch(':id')
  @Roles(Role.ADMIN)         
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(
  @Param('id', ParseIntPipe) id: number,
  @Body() updateUserDto: UpdateUserDto,
  ) {
  return this.usersService.update(id, updateUserDto);
  }

 @Get('my-department/employees')
  @UseGuards(AuthGuard('jwt')) // ← utilise AuthGuard('jwt')
  async getMyDepartmentEmployees(@Request() req) {
    console.log('===== req.user =====', req.user);

    if (!req.user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    const currentUserId = req.user.id;

    const employees = await this.usersService.findUsersInMyDepartment(currentUserId);

    return {
      success: true,
      data: employees,
      message: 'Membres du département récupérés avec succès',
    };
  }

}
