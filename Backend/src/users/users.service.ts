import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update.user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Departments } from 'src/departement/entities/departement.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from './enums/role.enum';
import { Project } from 'src/project/entities/project.entity';
import { CreateProjectDto } from 'src/project/dto/create-project.dto';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Departments)
    private departmentRepository: Repository<Departments>,
    @InjectRepository(Project)                     // ← ajoute cette ligne
    private readonly projectRepository: Repository<Project>,
  ) {}
  
  async count(): Promise<number> {
    return this.userRepository.count();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
     where: { 
      email 
    },
    select: {
      id: true,
      email: true,
      password: true,     // ← obligatoire
      role: true,
      nom: true,
      departement: true,
      telephone: true,
      status: true,
      cree_le: true,
    } });
  }

   async findById(id: number): Promise<User> {
  const user = await this.userRepository
    .createQueryBuilder('user')
    .where('user.id = :id', { id })
    .addSelect('user.password')   // ← force le chargement du password
    .getOne();

  if (!user) {
    throw new NotFoundException('Utilisateur introuvable');
  }

  return user;
}
   
  async createAdmin(dto: { email: string, password: string, nom: string, telephone: string}): Promise<User> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const hashed = await bcrypt.hash(dto.password, 12);

    const user = this.userRepository.create({
      email: dto.email!,
      password: hashed,
      role: Role.ADMIN,
      nom: dto.nom!,
      telephone: dto.telephone!,
    });

    return this.userRepository.save(user);
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    const { email, password, nom, telephone, departementId } = dto;
    
    const existing = await this.findByEmail(dto.email!);
    if (existing) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // 2. Département obligatoire pour un EMPLOYEE
    if (!departementId) {
      throw new BadRequestException('Le département est obligatoire pour un employé');
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
      relations: {
        departement: true,
      },
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


  //Lire tous les donnees

  async findEmployees(user: User) {
    // ADMIN : tous les employés
    if (user.role === Role.ADMIN) {
      return this.userRepository.find({
        where: {
          role: Role.EMPLOYEE,
        },
        relations: { departement: true },
      });
    }

    // HOD : seulement les employés de son département
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

  //Lire un utilisateur par son ID

  async findOne(id:number){

    return this.userRepository.findOne({
      where:{id},
    });
  }

  //Modifier un utilisateur

  async update(id: number, updateUserDto: UpdateUserDto) {

    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(
        `Utilisateur avec l'ID ${id} introuvable`,
      );
    }

    // Vérifier l'email
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: {
          email: updateUserDto.email,
        },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException(
          'Cet email est déjà utilisé par un autre utilisateur',
        );
      }
    }
  
    // Modifier le département
    if (updateUserDto.departementId !== undefined) {

      const department = await this.departmentRepository.findOne({
        where: {
          id: updateUserDto.departementId,
        },
      });

      if (!department) {
        throw new NotFoundException(
          `Département avec l'ID ${updateUserDto.departementId} introuvable`,
        );
      }
      user.departement = department;
    }

    // Ne pas modifier le password
    const {
      password,
      departementId,
      ...dataToUpdate
    } = updateUserDto as UpdateUserDto & {
      password?: string;
    };

    // Modifier les autres champs
    Object.assign(user, dataToUpdate);

    return await this.userRepository.save(user);
  }

  // Supprimer un utilisateur par son ID
  async remove(id: number): Promise<{ message: string }> {
  const user = await this.userRepository.findOne({ where: { id } });

  if (!user) {
    throw new NotFoundException('Utilisateur introuvable');
  }

  await this.userRepository.remove(user);
  // ou : await this.userRepository.delete(id);

  return { message: 'Utilisateur supprimé avec succès' };
}

  async updateStatus(id: number, dto: UpdateStatusDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    // Empêcher de désactiver son propre compte (optionnel mais recommandé)
   // if (user.id === currentUserId) { ... }

    user.status = dto.status;
    const updatedUser = await this.userRepository.save(user);
    return {
      message: `Utilisateur ${dto.status ? 'activé' : 'désactivé'} avec succès`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        // status: updatedUser.status
        status: Boolean(user.status)
      }
    };
  }

}
