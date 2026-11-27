import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User, UserRole } from './entities/user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // Créer un compte employé
  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const email = createUserDto.email.trim().toLowerCase();

    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Cette adresse email existe déjà.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    const user = this.usersRepository.create({
      nom: createUserDto.nom.trim(),
      email,
      password: hashedPassword,
      role: UserRole.EMPLOYEE,
      status: true,
    });

    const savedUser = await this.usersRepository.save(user);
    const { password, ...safeUser } = savedUser;

    return safeUser;
  }

  // Récupérer uniquement les employés
  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      where: { role: UserRole.EMPLOYEE },
      order: { cree_le: 'DESC' },
    });
  }

  // Récupérer un employé
  async findEmployeeById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: {
        id,
        role: UserRole.EMPLOYEE,
      },
    });

    if (!user) {
      throw new NotFoundException('Employé introuvable.');
    }

    return user;
  }

  // Modifier les informations d'un employé
  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.findEmployeeById(id);

    if (updateUserDto.nom !== undefined && !updateUserDto.nom.trim()) {
      throw new BadRequestException('Le nom ne peut pas être vide.');
    }

    if (updateUserDto.email !== undefined) {
      const email = updateUserDto.email.trim().toLowerCase();

      const existingUser = await this.usersRepository.findOne({
        where: { email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Cette adresse email est déjà utilisée.');
      }

      user.email = email;
    }

    if (updateUserDto.nom !== undefined) {
      user.nom = updateUserDto.nom.trim();
    }

    if (updateUserDto.password !== undefined) {
      user.password = await bcrypt.hash(updateUserDto.password, 12);
    }

    const savedUser = await this.usersRepository.save(user);
    const { password, ...safeUser } = savedUser;

    return safeUser;
  }

  // Activer ou désactiver un employé
  async updateStatus(
    id: number,
    status: boolean,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.findEmployeeById(id);

    user.status = status;

    const savedUser = await this.usersRepository.save(user);
    const { password, ...safeUser } = savedUser;

    return safeUser;
  }

  // Recherche utilisée par l'authentification
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: {
        email: email.trim().toLowerCase(),
      },
      select: {
        id: true,
        nom: true,
        email: true,
        password: true,
        role: true,
        status: true,
        cree_le: true,
        modifier_le: true,
      },
    });
  }

  // Récupérer un utilisateur par son identifiant
  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    return user;
  }

  async remove(id: number) {
    const user = await this.findEmployeeById(id);

    user.status = false;
    await this.usersRepository.save(user);

    await this.usersRepository.softDelete(user.id);

    return {
      message: 'Employé supprimé logiquement. Son historique est conservé.',
    };
  }

  // Restaurer un employé supprimé
  async restore(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id, role: UserRole.EMPLOYEE },
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException('Employé introuvable.');
    }

    if (!user.supprime_le) {
      throw new BadRequestException('Cet employé n’est pas supprimé.');
    }

    await this.usersRepository.restore(id);

    return {
      message: 'Compte employé restauré avec succès.',
    };
  }
}
