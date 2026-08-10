import { Injectable, NotFoundException, ForbiddenException, BadRequestException} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { FilterTaskDto } from './dto/filter-task.dto';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/auth/enums/role.enum';





@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(User)                          // ← Ajoute cette ligne
  private readonly userRepository: Repository<User>,
  ) {}

  async create(createTaskDto: CreateTaskDto, currentUser: User) {

  // Chercher l'employé destinataire
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
      'Employé introuvable ou utilisateur non autorisé'
    );
  }

  // ADMIN : peut attribuer à n'importe quel employé
  if (currentUser.role === Role.ADMIN) {
    const task = this.taskRepository.create({
      ...createTaskDto,
      user: employee,
    });

    return this.taskRepository.save(task);
  }

  // HOD : doit avoir un département
  if (currentUser.role === Role.HOD) {

    if (!currentUser.departement) {
      throw new BadRequestException(
        "Le HOD n'a pas de département assigné"
      );
    }

    // Vérifier que l'employé appartient au même département
    if (
      !employee.departement ||
      employee.departement.id !== currentUser.departement.id
    ) {
      throw new ForbiddenException(
        "Vous ne pouvez attribuer une tâche qu'à un employé de votre département"
      );
    }

    const task = this.taskRepository.create({
      ...createTaskDto,
      user: employee,
    });

    return this.taskRepository.save(task);
  }

  throw new ForbiddenException(
    "Vous n'avez pas l'autorisation de créer une tâche"
  );
}

  async findAll(filterDto: FilterTaskDto = {}, userId: number): Promise<Task[]> {
    const { status, priorite, search } = filterDto;

    const query = this.taskRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId });   // Correction principale

    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    if (priorite) {
      query.andWhere('task.priority = :priorite', { priorite }); // corrigé le nom
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