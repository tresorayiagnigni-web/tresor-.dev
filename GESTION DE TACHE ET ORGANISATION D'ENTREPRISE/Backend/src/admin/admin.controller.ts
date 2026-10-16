
import { Controller, Get, Delete, Param, Patch, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';


@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)   // Seul l'admin peut accéder à ce controller
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  

  // Voir tous les utilisateurs
  @Get('users')
  findAllUsers() {
    return this.adminService.findAllUsers();
  }

  // Voir toutes les tâches
  @Get('tasks')
  findAllTasks() {
    return this.adminService.findAllTasks();
  }

  // Supprimer une tâche
  @Delete('tasks/:id')
  removeTask(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.removeTask(id);
  }

  // Modifier le rôle d'un utilisateur
  @Patch('users/:id/role')
  updateUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body('role') role: Role,
  ) {
    return this.adminService.updateUserRole(id, role);
  }

  
}