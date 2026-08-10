import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { Role } from '../auth/enums/role.enum';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async findAllUsers() {
    return this.userRepository.find({ select: {id: true, email: true, nom: true, role: true} });
  }

  async findAllTasks() {
    return this.taskRepository.find({ relations: {user: true},
        select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            cree_le: true,
            Date_limite: true,
            user: {
                id: true,
                email: true,
                nom: true,
                role: true,
            }
        },
        order: { cree_le: 'DESC'},
    });
  }

  async removeTask(id: number) {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Tâche non trouvée');
    await this.taskRepository.remove(task);
    return { message: 'Tâche supprimée avec succès' };
  }

  async updateUserRole(id: number, role: Role) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    user.role = role;
    await this.userRepository.save(user);
    return { message: `Rôle mis à jour à ${role}` };
  }
}