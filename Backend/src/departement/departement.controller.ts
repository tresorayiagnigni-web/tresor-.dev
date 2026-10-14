// import { Controller, Get, Patch, Post, Put, Delete, Param, Body, ParseIntPipe, UseGuards, ForbiddenException, NotFoundException } from '@nestjs/common';
// import { DepartmentService } from './departement.service';
// import { CreateDepartmentDto } from './dto/create-departement.dto';
// import { GetUser } from 'src/users/decorators/get-user.decorator';
// import { UpdateDepartmentDto } from './dto/update-departement.dto';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';
// import { Role } from '../auth/enums/role.enum';
// import { AssignChefDto } from './dto/assign-chef.dto';
// import { NOMEM } from 'dns';
// // import { id } from 'node_modules/date-fns/locale/id';

// @Controller('departments')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(Role.ADMIN)
// export class DepartmentController {
//   constructor(private readonly departmentService: DepartmentService) {}

//   @Post()
//   @UseGuards(JwtAuthGuard)
//   @Roles( Role.ADMIN )
//   create(
//     @Body() createDepartmentDto: CreateDepartmentDto,
//     @GetUser() user: any,
//   ) {
//     return this.departmentService.create(createDepartmentDto);
//   }

//   @Get()
//   @UseGuards(JwtAuthGuard)
//   @Roles( Role.ADMIN )
//   async findAll() {
//     return this.departmentService.findAll();
//   }

//  @Get(':id')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(Role.ADMIN, Role.HOD)
// async findOne(
//   @Param('id', ParseIntPipe) id: number,
//   @GetUser() user: { id: number; role: Role },
// ) {
//   // L'administrateur peut consulter tous les départements.
//   if (user.role === Role.ADMIN) {
//     return this.departmentService.findOne(id);
//   }

//   // Le HOD ne peut consulter que son propre département.
//   if (user.role === Role.HOD) {
//     const department = await this.departmentService.findOne(id);

//     if (!department) {
//       throw new NotFoundException('Département introuvable');
//     }

//     if (Number(department.chef_departement?.id) !== Number(user.id)) {
//       throw new ForbiddenException(
//         'Vous ne pouvez consulter que votre propre département',
//       );
//     }

//     return department;
//   }

//   throw new ForbiddenException('Vous n’avez pas les droits nécessaires');
// }

//   @Patch(':id')
//   @UseGuards(JwtAuthGuard, RolesGuard)
//   @Roles(Role.ADMIN)
//   async update(
//   @Param('id', ParseIntPipe) id: number,
//   @Body() updateDepartmentDto: UpdateDepartmentDto,
// ) {
//   return this.departmentService.update(id, updateDepartmentDto);
// }

// //   @Patch(':id/chef')
// //   @UseGuards(JwtAuthGuard, RolesGuard)
// //   @Roles( Role.ADMIN)
// //   async assignchefDepartement(
// //   @Param('id', ParseIntPipe) departementId: number,
// //   @Body('chef_DepartementId', ParseIntPipe) chef_DepartementId: number,
// // ) {
// //   return this.departmentService.assignChef(departementId, chef_DepartementId);
// // }

//   @Delete(':id')
//   @UseGuards(JwtAuthGuard, RolesGuard)
//   @Roles(Role.ADMIN)
//   remove(@Param('id', ParseIntPipe) id: number) {
//     return this.departmentService.remove(id);
//   }

//   @Delete(':id/chef')
//   @UseGuards(JwtAuthGuard, RolesGuard)
//   @Roles(Role.ADMIN)
//   async removeChef(
//     @Param('id', ParseIntPipe) id: number,
//   ) {
//     return this.departmentService.removeChef(id);
//   }
// }

import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  Request,
} from '@nestjs/common';
import { DepartmentService } from './departement.service';
import { CreateDepartmentDto } from './dto/create-departement.dto';
import { UpdateDepartmentDto } from './dto/update-departement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { GetUser } from 'src/users/decorators/get-user.decorator';

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  // ========== CREATE ==========
  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentService.create(createDepartmentDto);
  }

  // ========== FIND ALL ==========
  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.departmentService.findAll();
  }

  // ========== FIND ONE ==========
 @Get(':id')
@Roles(Role.ADMIN, Role.HOD, Role.EMPLOYEE)
async findOne(
  @Param('id', ParseIntPipe) id: number,
  @GetUser() user: any,
) {
  console.log('=== DEBUG HOD ACCESS ===');
  console.log('User from JWT:', user);
  console.log('Requested department id:', id);

  // ADMIN → accès total
  if (user.role === Role.ADMIN) {
    return this.departmentService.findOne(id);
  }

  // HOD / EMPLOYEE
  if (user.role === Role.HOD || user.role === Role.EMPLOYEE) {
    if (!user.departementId) {
      throw new ForbiddenException('Aucun département assigné à cet utilisateur');
    }

    if (Number(user.departementId) !== Number(id)) {
      throw new ForbiddenException(
        `Vous ne pouvez consulter que votre propre département (le vôtre est ${user.departementId})`,
      );
    }

    return this.departmentService.findOne(id);
  }

  throw new ForbiddenException('Accès non autorisé');
}

  // ========== UPDATE ==========
  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentService.update(id, updateDepartmentDto);
  }

  // ========== DELETE ==========
  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.departmentService.remove(id);
  }

  // ========== REMOVE CHEF ==========
  @Delete(':id/chef')
  @Roles(Role.ADMIN)
  removeChef(@Param('id', ParseIntPipe) id: number) {
    return this.departmentService.removeChef(id);
  }
}