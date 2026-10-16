import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { User } from '../users/entities/user.entity';
import { Departments } from '../departement/entities/departement.entity';
import { Role } from '../auth/enums/role.enum'; // adapte le chemin

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Departments)
    private readonly departmentRepository: Repository<Departments>,
  ) {}

  async create(createProjectDto: CreateProjectDto, currentUser: User) {
    // Seul un ADMIN peut créer un projet
    if (currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Seul un ADMIN peut créer un projet');
    }

    const { name, description, departementId } = createProjectDto;

    // Trouver le département par son ID
    const department = await this.departmentRepository.findOne({
      where: { id: departementId },
    });

    if (!department) {
      throw new NotFoundException(`Département avec l'ID ${departementId} introuvable`);
    }

    const project = this.projectRepository.create({
      name,
      description,
      departement: department,
      createdBy: currentUser,
    });

    return this.projectRepository.save(project);
  }

}