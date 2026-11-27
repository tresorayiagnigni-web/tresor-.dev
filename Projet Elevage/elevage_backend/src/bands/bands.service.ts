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
  private checkBandAccess(band: Band, user: User): void {
    if (user.role === UserRole.ADMIN) {
      return;
    }

    const assigned = band.employees?.some(
      (employee) => employee.id === user.id,
    );

    if (!assigned) {
      throw new ForbiddenException('Vous ne pouvez pas accéder à cette bande.');
    }
  }

  // Vérifier l'existence et le statut de l'exploitation
  private async validateFarm(farmId: number): Promise<Farm> {
    const farm = await this.farmRepository.findOne({
      where: { id: farmId },
    });

    if (!farm || !farm.status) {
      throw new NotFoundException('Exploitation introuvable ou inactive.');
    }

    return farm;
  }

  // Vérifier les employés et leur appartenance à une seule ferme
  private async validateEmployees(
    employeeIds: number[],
    farmId: number,
    excludedBandId?: number,
  ): Promise<User[]> {
    const uniqueIds = [...new Set(employeeIds)];

    if (uniqueIds.length !== employeeIds.length) {
      throw new BadRequestException(
        'La liste contient des employés en double.',
      );
    }

    if (uniqueIds.length === 0) {
      return [];
    }

    // Vérifier que les employés existent et sont actifs
    const employees = await this.userRepository.find({
      where: {
        id: In(uniqueIds),
        role: UserRole.EMPLOYEE,
        status: true,
      },
    });

    if (employees.length !== uniqueIds.length) {
      throw new BadRequestException(
        'Un ou plusieurs employés sont introuvables ou inactifs.',
      );
    }

    // Charger les autres bandes et leurs exploitations
    const otherBands = await this.bandRepository.find({
      relations: {
        farm: true,
        employees: true,
      },
    });

    // Rechercher les affectations dans une autre exploitation
    for (const employee of employees) {
      const conflictingBand = otherBands.find((band) => {
        // Ne pas comparer la bande en cours de modification
        if (excludedBandId !== undefined && band.id === excludedBandId) {
          return false;
        }

        const assigned = band.employees?.some(
          (assignedEmployee) => assignedEmployee.id === employee.id,
        );

        return assigned && band.farm.id !== farmId;
      });

      if (conflictingBand) {
        throw new BadRequestException(
          `L'employé ${employee.nom} est déjà affecté à une autre exploitation. ` +
            'Un employé ne peut appartenir qu’à une seule exploitation.',
        );
      }
    }

    return employees;
  }

  // Créer une bande
  async create(dto: CreateBandDto): Promise<Band> {
    const farm = await this.validateFarm(dto.farmId);

    const employees = await this.validateEmployees(
      dto.employeeIds ?? [],
      farm.id,
    );

    const { farmId, employeeIds, ...bandData } = dto;

    const band = this.bandRepository.create({
      ...bandData,
      farm,
      employees,
      status: BandStatus.GROWING,
    });

    return this.bandRepository.save(band);
  }

  // Récupérer les bandes accessibles
  async findAll(authenticatedUser: AuthenticatedUser): Promise<Band[]> {
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
  async update(id: number, dto: UpdateBandDto): Promise<Band> {
    const band = await this.findOneForAdminOperation(id);

    const { farmId, employeeIds, status, ...bandData } = dto;

    // Déterminer la ferme cible
    const targetFarm =
      farmId !== undefined ? await this.validateFarm(farmId) : band.farm;

    // Conserver les employés existants si employeeIds n'est pas fourni
    const targetEmployeeIds =
      employeeIds !== undefined
        ? employeeIds
        : band.employees.map((employee) => employee.id);

    // Vérifier toutes les affectations dans la ferme cible
    const employees = await this.validateEmployees(
      targetEmployeeIds,
      targetFarm.id,
      band.id,
    );

    band.farm = targetFarm;
    band.employees = employees;

    Object.assign(band, bandData);

    if (status !== undefined) {
      band.status = status;
    }

    return this.bandRepository.save(band);
  }

  // Chargement interne pour les opérations ADMIN
  private async findOneForAdminOperation(id: number): Promise<Band> {
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
