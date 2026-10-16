// src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { UserProvider } from './entities/user-provider.entity';
import { Departments } from 'src/departement/entities/departement.entity';
import { Project } from 'src/project/entities/project.entity';
import { UpdateUserDto } from './dto/update.user.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from './enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserProvider)
    private readonly userProviderRepository: Repository<UserProvider>,

    @InjectRepository(Departments)
    private readonly departmentRepository: Repository<Departments>,

    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  // ====================== OAUTH METHODS ======================

  async findByProvider(
    provider: string,
    providerId: string,
  ): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.providers', 'provider')
      .where('provider.provider = :provider', { provider })
      .andWhere('provider.providerId = :providerId', { providerId })
      .getOne();
  }

  async createOAuthUser(data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
    providers: { provider: string; providerId: string }[];
  }): Promise<User> {
    // On mappe firstName + lastName → nom (selon ton modèle)
    const nom =
      [data.firstName, data.lastName].filter(Boolean).join(' ') || undefined;

    const user = this.userRepository.create({
      email: data.email ?? undefined,
      nom: nom,
      picture: data.picture ?? undefined,
      role: Role.EMPLOYEE, // ou Role.USER selon ton enum
      providers: data.providers.map((p) =>
        this.userProviderRepository.create({
          provider: p.provider,
          providerId: p.providerId,
        }),
      ),
    });

    return this.userRepository.save(user);
  }

  async linkProvider(
    userId: number, // ← ton id est number
    data: { provider: string; providerId: string },
  ): Promise<void> {
    const existing = await this.userProviderRepository.findOne({
      where: {
        provider: data.provider,
        providerId: data.providerId,
      },
    });

    if (!existing) {
      await this.userProviderRepository.save({
        userId,
        provider: data.provider,
        providerId: data.providerId,
      });
    }
  }

  // ====================== MÉTHODES EXISTANTES ======================

  async count(): Promise<number> {
    return this.userRepository.count();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        nom: true,
        departementId: true,
        telephone: true,
        status: true,
        cree_le: true,
      },
    });
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .addSelect('user.password')
      .getOne();

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return user;
  }

  async createAdmin(dto: {
    email: string;
    password: string;
    nom: string;
    telephone: string;
  }): Promise<User> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const hashed = await bcrypt.hash(dto.password, 12);

    const user = this.userRepository.create({
      email: dto.email,
      password: hashed,
      role: Role.ADMIN,
      nom: dto.nom,
      telephone: dto.telephone,
    });

    return this.userRepository.save(user);
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    const { email, password, nom, telephone, departementId } = dto;

    const existing = await this.findByEmail(dto.email!);
    if (existing) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    if (!departementId) {
      throw new BadRequestException(
        'Le département est obligatoire pour un employé',
      );
    }

    const departement = await this.departmentRepository.findOne({
      where: { id: departementId },
    });

    if (!departement) {
      throw new NotFoundException('Département non trouvé');
    }

    const hashedPassword = await bcrypt.hash(dto.password!, 12);

    const user = this.userRepository.create({
      nom,
      email,
      password: hashedPassword,
      telephone,
      role: Role.EMPLOYEE,
      departement,
    });

    const savedUser = await this.userRepository.save(user);

    const result = await this.userRepository.findOne({
      where: { id: savedUser.id },
      relations: { departement: true },
    });

    if (!result) {
      throw new Error('Utilisateur introuvable');
    }

    const { password: _, ...userWithoutPassword } = result;
    return userWithoutPassword as User;
  }

  async save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  async findEmployees(user: User) {
    if (user.role === Role.ADMIN) {
      return this.userRepository.find({
        where: { role: Role.EMPLOYEE },
        relations: { departement: true },
      });
    }

    if (user.role === Role.HOD) {
      if (!user.departement) {
        throw new BadRequestException("Le HOD n'a pas de département assigné");
      }

      return this.userRepository.find({
        where: {
          role: Role.EMPLOYEE,
          departement: { id: user.departement.id },
        },
        relations: { departement: true },
      });
    }

    return [];
  }

  async findAll() {
    const users = await this.userRepository.find({
      relations: { departement: true },
    });

    return users.map((user) => ({
      id: user.id,
      nom: user.nom,
      email: user.email,
      role: user.role,
      telephone: user.telephone,
      status: user.status,
      departementId: user.departementId,
      departement: user.departement,
    }));
  }

  async findOne(id: number) {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} introuvable`);
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException(
          'Cet email est déjà utilisé par un autre utilisateur',
        );
      }
    }

    if (updateUserDto.departementId !== undefined) {
      const department = await this.departmentRepository.findOne({
        where: { id: updateUserDto.departementId },
      });

      if (!department) {
        throw new NotFoundException(
          `Département avec l'ID ${updateUserDto.departementId} introuvable`,
        );
      }
      user.departement = department;
    }

    const { password, departementId, ...dataToUpdate } =
      updateUserDto as UpdateUserDto & { password?: string };

    Object.assign(user, dataToUpdate);

    return await this.userRepository.save(user);
  }

  async remove(id: number): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    await this.userRepository.remove(user);

    return { message: 'Utilisateur supprimé avec succès' };
  }

  async updateStatus(id: number, dto: UpdateStatusDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    user.status = dto.status;
    const updatedUser = await this.userRepository.save(user);

    return {
      message: `Utilisateur ${dto.status ? 'activé' : 'désactivé'} avec succès`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        status: Boolean(user.status),
      },
    };
  }

  async findUsersInMyDepartment(currentUserId: number): Promise<User[]> {
    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId },
      select: { id: true, departementId: true },
    });

    if (!currentUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (!currentUser.departementId) {
      return [];
    }

    return this.userRepository.find({
      where: { departementId: currentUser.departementId },
      select: { id: true, nom: true, email: true },
      order: { nom: 'ASC' },
    });
  }
}