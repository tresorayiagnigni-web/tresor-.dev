import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';

import { ProjectsService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { GetUser } from '../users/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // ========== ADMIN ONLY ==========
  @Post()
  @Roles(Role.ADMIN)
  create(
    @Body() dto: CreateProjectDto,
    @GetUser() currentUser: User,
  ) {
    return this.projectsService.create(dto, currentUser);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll(@GetUser() currentUser: User) {
    return this.projectsService.findAll(currentUser);
  }

  @Get('my-department')
  @Roles(Role.HOD)
  getMyDepartmentProjects(@GetUser() currentUser: User) {
    const departmentId =
      (currentUser as any).departementId ??
      (currentUser as any).departmentId ??
      (currentUser as any).departement?.id;

    if (!departmentId) {
      throw new ForbiddenException(
        'Aucun département associé à ce compte',
      );
    }

    return this.projectsService.findByDepartment(Number(departmentId));
  }

  // ========== Routes avec :id ==========
  @Get(':id')
  @Roles(Role.ADMIN, Role.HOD) // HOD peut aussi voir un projet
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() currentUser: User,
  ) {
    return this.projectsService.findOne(id, currentUser);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectDto,
    @GetUser() currentUser: User,
  ) {
    return this.projectsService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() currentUser: User,
  ) {
    return this.projectsService.remove(id, currentUser);
  }
}