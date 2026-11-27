
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Band, BandStatus } from './entities/band.entity.js';
import { Farm } from '../farms/entities/farm.entity.js';
import { User, UserRole } from '../users/entities/user.entity.js';

import { CreateBandDto } from './dto/create-band.dto.js';
import { UpdateBandDto } from './dto/update-band.dto.js';

interface AuthenticatedUser {
  id: number;
  email: string;
  role: UserRole;
}

@Injectable()
export class BandsService {
  constructor(
    @InjectRepository(Band)
    private readonly bandRepository: Repository<Band>,

    @InjectRepository(Farm)
    private readonly farmRepository: Repository<Farm>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Vérifier que le compte existe et est actif
  private async validateUser(
    authenticatedUser: AuthenticatedUser,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        id: authenticatedUser.id,
        status: true,
      },
    });

    if (!user) {
      throw new ForbiddenException(
        'Compte utilisateur inactif ou introuvable.',
      );
    }

    return user;
  }

  // Vérifier l'accès à une bande
  private checkBandAccess(
    band: Band,
    user: User,
  ): void {
    if (user.role === UserRole.ADMIN) {
      return;
    }

    const assigned = band.employees?.some(
      (employee) => employee.id === user.id,
    );

    if (!assigned) {
      throw new ForbiddenException(
        'Vous ne pouvez pas accéder à cette bande.',
      );
    }
  }

  // Vérifier l'existence et le statut de l'exploitation
  private async validateFarm(farmId: number): Promise<Farm> {
    const farm = await this.farmRepository.findOne({
      where: { id: farmId },
    });

    if (!farm || !farm.status) {
      throw new NotFoundException(
        'Exploitation introuvable ou inactive.',
      );
    }

    return farm;
  }

  // Vérifier les employés affectés à la bande
  private async validateEmployees(
    employeeIds: number[],
  ): Promise<User[]> {
    if (employeeIds.length === 0) {
      return [];
    }

    const employees = await this.userRepository.find({
      where: {
        id: In(employeeIds),
        role: UserRole.EMPLOYEE,
        status: true,
      },
    });

    if (employees.length !== employeeIds.length) {
      throw new BadRequestException(
        'Un ou plusieurs employés sont introuvables ou inactifs.',
      );
    }

    return employees;
  }

  // Créer une bande
  async create(dto: CreateBandDto): Promise<Band> {
    const farm = await this.validateFarm(dto.farmId);

    const employees = await this.validateEmployees(
      dto.employeeIds ?? [],
    );

    const {
      farmId,
      employeeIds,
      ...bandData
    } = dto;

    const band = this.bandRepository.create({
      ...bandData,
      farm,
      employees,
      status: BandStatus.GROWING,
    });

    return this.bandRepository.save(band);
  }

  // Récupérer les bandes accessibles
  async findAll(
    authenticatedUser: AuthenticatedUser,
  ): Promise<Band[]> {
    const user = await this.validateUser(authenticatedUser);

    return this.bandRepository.find({
      where:
        user.role === UserRole.ADMIN
          ? {}
          : {
              employees: {
                id: user.id,
              },
            },
      relations: {
        farm: true,
        employees: true,
      },
      order: {
        cree_le: 'DESC',
      },
    });
  }

  // Récupérer une bande par son identifiant
  async findOne(
    id: number,
    authenticatedUser: AuthenticatedUser,
  ): Promise<Band> {
    const user = await this.validateUser(authenticatedUser);

    const band = await this.bandRepository.findOne({
      where: { id },
      relations: {
        farm: true,
        employees: true,
      },
    });

    if (!band) {
      throw new NotFoundException(
        `Bande avec l'identifiant ${id} introuvable.`,
      );
    }

    this.checkBandAccess(band, user);

    return band;
  }

  // Modifier une bande
  async update(
    id: number,
    dto: UpdateBandDto,
  ): Promise<Band> {
    const band = await this.findOneForAdminOperation(id);

    const {
      farmId,
      employeeIds,
      status,
      ...bandData
    } = dto;

    if (farmId !== undefined) {
      band.farm = await this.validateFarm(farmId);
    }

    if (employeeIds !== undefined) {
      band.employees = await this.validateEmployees(employeeIds);
    }

    Object.assign(band, bandData);

    if (status !== undefined) {
      band.status = status;
    }

    return this.bandRepository.save(band);
  }

  // Chargement interne pour les opérations ADMIN
  private async findOneForAdminOperation(
    id: number,
  ): Promise<Band> {
    const band = await this.bandRepository.findOne({
      where: { id },
      relations: {
        farm: true,
        employees: true,
      },
    });

    if (!band) {
      throw new NotFoundException(
        `Bande avec l'identifiant ${id} introuvable.`,
      );
    }

    return band;
  }

  // Archiver une bande
  async remove(id: number): Promise<Band> {
    const band = await this.findOneForAdminOperation(id);

    band.status = BandStatus.ARCHIVED;

    return this.bandRepository.save(band);
  }
}
