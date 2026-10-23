
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { User } from '../users/entities/user.entity';
import { Departments } from '../departement/entities/departement.entity';
import { Role } from '../auth/enums/role.enum';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,

    @InjectRepository(Departments)
    private readonly departmentRepository: Repository<Departments>,
  ) {}

  private checkAdmin(currentUser: User): void {
    if (currentUser?.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'Seul un administrateur peut gérer les projets.',
      );
    }
  }

  async create(
    dto: CreateProjectDto,
    currentUser: User,
  ): Promise<Project> {
    this.checkAdmin(currentUser);

    const department = await this.departmentRepository.findOne({
      where: { id: dto.departementId },
    });

    if (!department) {
      throw new NotFoundException(
        `Département ${dto.departementId} introuvable.`,
      );
    }

    const project = this.projectRepository.create({
      name: dto.name,
      description: dto.description,
      departement: department,
      createdBy: currentUser,
      dueDate: dto.dueDate,
    });

    return this.projectRepository.save(project);
  }

  async findAll(currentUser: User): Promise<Project[]> {
    this.checkAdmin(currentUser);

    return this.projectRepository.find({
      relations: {
        departement: true,
        createdBy: true,
        tasks: {
          user: true,              // si tu veux aussi l’employé
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(
    id: number,
    currentUser: User,
  ): Promise<Project> {
    this.checkAdmin(currentUser);

    const project = await this.projectRepository.findOne({
      where: { id },
      relations: {
        departement: true,
        createdBy: true,
        tasks: {
          user: true,              // si tu veux aussi l’employé
        },
      },
    });

    if (!project) {
      throw new NotFoundException(
        `Projet ${id} introuvable.`,
      );
    }

    return project;
  }

  async findByDepartment(departmentId: number) {
  return this.projectRepository.find({
    where: {
      // adapte le nom du champ selon ton entity
      departement: { id: departmentId },
      // ou : departementId: departmentId,
    },
    relations: { departement: true }
  });
}

  async update(
    id: number,
    dto: UpdateProjectDto,
    currentUser: User,
  ): Promise<Project> {
    this.checkAdmin(currentUser);

    const project = await this.projectRepository.findOne({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException(
        `Projet ${id} introuvable.`,
      );
    }

    if (dto.name !== undefined) {
      project.name = dto.name;
    }

    if (dto.description !== undefined) {
      project.description = dto.description;
    }

    if (dto.dueDate !== undefined) {
      project.dueDate = dto.dueDate;
    }

    if (dto.departementId !== undefined) {
      const department = await this.departmentRepository.findOne({
        where: { id: dto.departementId },
      });

      if (!department) {
        throw new NotFoundException(
          `Département ${dto.departementId} introuvable.`,
        );
      }

      project.departement = department;
    }

    await this.projectRepository.save(project);

    return this.findOne(id, currentUser);
  }

  async remove(
    id: number,
    currentUser: User,
  ): Promise<{ message: string }> {
    this.checkAdmin(currentUser);

    const project = await this.projectRepository.findOne({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException(
        `Projet ${id} introuvable.`,
      );
    }

    await this.projectRepository.remove(project);

    return {
      message: `Le projet ${id} a été supprimé.`,
    };
  }
}
