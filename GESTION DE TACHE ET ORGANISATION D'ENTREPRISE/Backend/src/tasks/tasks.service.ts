import { Injectable, NotFoundException, ForbiddenException, BadRequestException} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { FilterTaskDto } from './dto/filter-task.dto';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/auth/enums/role.enum';
import { Project } from 'src/project/entities/project.entity';





@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Project)                    // ← ajoute
    private readonly projectRepository: Repository<Project>,
  ) {}

  //   async create(createTaskDto: CreateTaskDto, currentUser: User) {

  //   // Chercher l'employé destinataire
  //   const employee = await this.userRepository.findOne({
  //     where: {
  //       id: createTaskDto.userId,
  //       role: Role.EMPLOYEE,
  //     },
  //     relations: {
  //       departement: true,
  //     },
  //   });

  //   if (!employee) {
  //     throw new NotFoundException(
  //       'Employé introuvable ou utilisateur non autorisé'
  //     );
  //   }

  //   // ADMIN : peut attribuer à n'importe quel employé
  //   if (currentUser.role === Role.ADMIN) {
  //     const task = this.taskRepository.create({
  //       ...createTaskDto,
  //       user: employee,
  //     });

  //     return this.taskRepository.save(task);
  //   }

  //   // HOD : doit avoir un département
  //   if (currentUser.role === Role.HOD) {

  //     if (!currentUser.departement) {
  //       throw new BadRequestException(
  //         "Le HOD n'a pas de département assigné"
  //       );
  //     }

  //     // Vérifier que l'employé appartient au même département
  //     if (
  //       !employee.departement ||
  //       employee.departement.id !== currentUser.departement.id
  //     ) {
  //       throw new ForbiddenException(
  //         "Vous ne pouvez attribuer une tâche qu'à un employé de votre département"
  //       );
  //     }

  //     const task = this.taskRepository.create({
  //       ...createTaskDto,
  //       user: employee,
  //     });

  //     return this.taskRepository.save(task);
  //   }

  //   throw new ForbiddenException(
  //     "Vous n'avez pas l'autorisation de créer une tâche"
  //   );
  // }

  async create(createTaskDto: CreateTaskDto, currentUser: User) {
    // 1. Récupérer l'employé
    const employee = await this.userRepository.findOne({
      where: {
        id: createTaskDto.userId,
        role: Role.EMPLOYEE,
      },
      relations: {
        departement: true,
      },
    });

    if (!employee) {
      throw new NotFoundException(
        'Employé introuvable ou utilisateur non autorisé',
      );
    }

    // 2. Récupérer le projet (si fourni)
    let project: Project | null = null;

    if (createTaskDto.projectId) {
      project = await this.projectRepository.findOne({
        where: { id: createTaskDto.projectId },
      });

      if (!project) {
        throw new NotFoundException(
          `Projet ${createTaskDto.projectId} introuvable`,
        );
      }
    }

    // 3. Création selon le rôle
    if (currentUser.role === Role.ADMIN) {
      const task = this.taskRepository.create({
        title: createTaskDto.title,
        description: createTaskDto.description,
        priority: createTaskDto.priorite, // adapte selon ton DTO
        Date_limite: createTaskDto.Date_limite
          ? new Date(createTaskDto.Date_limite)
          : undefined,
        user: employee,
        project: project ?? undefined, // ← important pour le typage
      });

      return this.taskRepository.save(task);
    }

    if (currentUser.role === Role.HOD) {
      if (!currentUser.departement) {
        throw new BadRequestException(
          "Le HOD n'a pas de département assigné",
        );
      }

      if (
        !employee.departement ||
        employee.departement.id !== currentUser.departement.id
      ) {
        throw new ForbiddenException(
          "Vous ne pouvez attribuer une tâche qu'à un employé de votre département",
        );
      }

      const task = this.taskRepository.create({
        title: createTaskDto.title,
        description: createTaskDto.description,
        priority: createTaskDto.priorite,
        Date_limite: createTaskDto.Date_limite
          ? new Date(createTaskDto.Date_limite)
          : undefined,
        user: employee,
        project: project ?? undefined,
      });

      return this.taskRepository.save(task);
    }

    throw new ForbiddenException(
      "Vous n'avez pas l'autorisation de créer une tâche",
    );
  }

  // async findAll(
  //   filterDto: FilterTaskDto = {},
  //   userId: number,
  // ): Promise<Task[]> {
  //   const { status, priorite, search } = filterDto;

  //   // Récupérer l'utilisateur connecté avec son département
  //   const currentUser = await this.userRepository.findOne({
  //     where: { id: userId },
  //     relations: {
  //       departement: true,
  //     },
  //   });

  //   if (!currentUser) {
  //     throw new NotFoundException('Utilisateur connecté introuvable');
  //   }

  //   const query = this.taskRepository
  //     .createQueryBuilder('task')
  //     .leftJoinAndSelect('task.user', 'employee');
  //     .leftJoinAndSelect('task.project', 'project');   // ← ajoute

  //   // ADMIN : toutes les tâches
  //   if (currentUser.role === Role.ADMIN) {
  //     // Aucun filtre supplémentaire
  //   }

  //   // HOD : tâches des employés de son département
  //   else if (currentUser.role === Role.HOD) {
  //     if (!currentUser.departement) {
  //       throw new BadRequestException(
  //         "Le HOD n'a pas de département assigné",
  //       );
  //     }

  //     query
  //       .innerJoin('employee.departement', 'department')
  //       .andWhere('department.id = :departmentId', {
  //         departmentId: currentUser.departement.id,
  //       })
  //       .andWhere('employee.role = :employeeRole', {
  //         employeeRole: Role.EMPLOYEE,
  //       });
  //   }

  //   // EMPLOYEE : uniquement ses tâches
  //   else if (currentUser.role === Role.EMPLOYEE) {
  //     query.andWhere('employee.id = :userId', { userId });
  //   }

  //   else {
  //     throw new ForbiddenException(
  //       "Vous n'êtes pas autorisé à consulter les tâches",
  //     );
  //   }

  //   if (status) {
  //     query.andWhere('task.status = :status', { status });
  //   }

  //   if (priorite) {
  //     query.andWhere('task.priorite = :priorite', { priorite });
  //   }

  //   if (search) {
  //     query.andWhere(
  //       '(task.title LIKE :search OR task.description LIKE :search)',
  //       { search: `%${search}%` },
  //     );
  //   }

  //   return query.getMany();
  // }

  async findAll(
    filterDto: FilterTaskDto = {},
    userId: number,
  ): Promise<Task[]> {
    const { status, priorite, search } = filterDto;

    // Récupérer l'utilisateur connecté avec son département
    const currentUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: {
        departement: true,
      },
    });

    if (!currentUser) {
      throw new NotFoundException('Utilisateur connecté introuvable');
    }

    const query = this.taskRepository
    .createQueryBuilder('task')
    .leftJoinAndSelect('task.user', 'employee')
    .leftJoinAndSelect('task.project', 'project'); // ← relation projet

    // ADMIN : toutes les tâches
    if (currentUser.role === Role.ADMIN) {
      // aucun filtre supplémentaire
    }
    // HOD : tâches des employés de son département
    else if (currentUser.role === Role.HOD) {
      if (!currentUser.departement) {
        throw new BadRequestException(
          "Le HOD n'a pas de département assigné",
        );
      }

      query
      .innerJoin('employee.departement', 'department')
      .andWhere('department.id = :departmentId', {
        departmentId: currentUser.departement.id,
      })
      .andWhere('employee.role = :employeeRole', {
        employeeRole: Role.EMPLOYEE,
      });
    }
    // EMPLOYEE : uniquement ses tâches
    else if (currentUser.role === Role.EMPLOYEE) {
      query.andWhere('employee.id = :userId', { userId });
    } else {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à consulter les tâches",
      );
    }

    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    if (priorite) {
      query.andWhere('task.priorite = :priorite', { priorite });
    }

    if (search) {
      query.andWhere(
        '(task.title LIKE :search OR task.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    return query.getMany();
  }

  async findOne(id: number, userId?: number): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id, ...(userId && { userId }) },
    });

    if (!task) {
      throw new NotFoundException(`Task avec l'id ${id} non trouvée`);
    }
    return task;
  }

  async updateStatus(id: number, updateTaskDto: UpdateTaskDto, userId?: number): Promise<Task> {
    const task = await this.findOne(id, userId);
    Object.assign(task, updateTaskDto);
    return this.taskRepository.save(task);
  }

  async remove(id: number, userId?: number): Promise<void> {
    const task = await this.findOne(id, userId);
    await this.taskRepository.remove(task);
  }
}