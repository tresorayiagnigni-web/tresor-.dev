
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { BandsService } from './bands.service.js';
import { Band, BandStatus } from './entities/band.entity.js';
import { Farm } from '../farms/entities/farm.entity.js';
import { User, UserRole } from '../users/entities/user.entity.js';

describe('BandsService', () => {
  let service: BandsService;

  const bandRepositoryMock = {
    create: vi.fn(),
    save: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
  };

  const farmRepositoryMock = {
    findOne: vi.fn(),
  };

  const userRepositoryMock = {
    find: vi.fn(),
    findOne: vi.fn(),
  };

  const farmMock = {
    id: 1,
    nom: 'Ferme principale',
    status: true,
  };

  const employeeMock = {
    id: 2,
    nom: 'Employé test',
    email: 'employe@test.com',
    role: UserRole.EMPLOYEE,
    status: true,
  };

  const adminMock = {
    id: 1,
    nom: 'Administrateur test',
    email: 'admin@test.com',
    role: UserRole.ADMIN,
    status: true,
  };

  const employeeAuth = {
    id: 2,
    email: 'employe@test.com',
    role: UserRole.EMPLOYEE,
  };

  const adminAuth = {
    id: 1,
    email: 'admin@test.com',
    role: UserRole.ADMIN,
  };

  const bandMock = {
    id: 10,
    nom: 'Bande 001',
    numero_batiment: 'BAT-01',
    race: 'ISA Brown',
    date_demarrage: '2026-11-23',
    effectif_initial: 1000,
    status: BandStatus.GROWING,
    farm: farmMock,
    employees: [employeeMock],
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    bandRepositoryMock.create.mockImplementation((data) => data);
    bandRepositoryMock.save.mockImplementation(async (data) => data);

    farmRepositoryMock.findOne.mockResolvedValue(farmMock);
    userRepositoryMock.find.mockResolvedValue([employeeMock]);

    userRepositoryMock.findOne.mockImplementation(async ({ where }) => {
      if (where.id === employeeMock.id && where.status === true) {
        return employeeMock;
      }

      if (where.id === adminMock.id && where.status === true) {
        return adminMock;
      }

      return null;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BandsService,
        {
          provide: getRepositoryToken(Band),
          useValue: bandRepositoryMock,
        },
        {
          provide: getRepositoryToken(Farm),
          useValue: farmRepositoryMock,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<BandsService>(BandsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // CRÉATION

  it('should create a band successfully', async () => {
    const dto = {
      nom: 'Bande 001',
      numero_batiment: 'BAT-01',
      race: 'ISA Brown',
      date_demarrage: '2026-11-23',
      effectif_initial: 1000,
      aliment_demarrage: 'Starter',
      farmId: 1,
      employeeIds: [2],
    };

    const result = await service.create(dto);

    expect(result.nom).toBe('Bande 001');
    expect(result.farm).toEqual(farmMock);
    expect(result.employees).toEqual([employeeMock]);
    expect(result.status).toBe(BandStatus.GROWING);
    expect(bandRepositoryMock.save).toHaveBeenCalled();
  });

  it('should reject creation if the farm does not exist', async () => {
    farmRepositoryMock.findOne.mockResolvedValue(null);

    const dto = {
      nom: 'Bande 002',
      numero_batiment: 'BAT-02',
      race: 'ISA Brown',
      date_demarrage: '2026-11-23',
      effectif_initial: 500,
      farmId: 99,
    };

    await expect(service.create(dto)).rejects.toThrow(
      'Exploitation introuvable ou inactive.',
    );

    expect(bandRepositoryMock.save).not.toHaveBeenCalled();
  });

  it('should reject creation if an employee is invalid', async () => {
    userRepositoryMock.find.mockResolvedValue([]);

    const dto = {
      nom: 'Bande 003',
      numero_batiment: 'BAT-03',
      race: 'ISA Brown',
      date_demarrage: '2026-11-23',
      effectif_initial: 500,
      farmId: 1,
      employeeIds: [99],
    };

    await expect(service.create(dto)).rejects.toThrow(
      'Un ou plusieurs employés sont introuvables ou inactifs.',
    );

    expect(bandRepositoryMock.save).not.toHaveBeenCalled();
  });

  // CONSULTATION DE LA LISTE

  it('should allow an ADMIN to see all bands', async () => {
    bandRepositoryMock.find.mockResolvedValue([bandMock]);

    const result = await service.findAll(adminAuth);

    expect(result).toEqual([bandMock]);

    expect(userRepositoryMock.findOne).toHaveBeenCalledWith({
      where: {
        id: adminAuth.id,
        status: true,
      },
    });

    expect(bandRepositoryMock.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      }),
    );
  });

  it('should allow an EMPLOYEE to see only assigned bands', async () => {
    bandRepositoryMock.find.mockResolvedValue([bandMock]);

    const result = await service.findAll(employeeAuth);

    expect(result).toEqual([bandMock]);

    expect(bandRepositoryMock.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          employees: {
            id: employeeAuth.id,
          },
        },
      }),
    );
  });

  // CONSULTATION D'UNE BANDE

  it('should allow an employee to access an assigned band', async () => {
    bandRepositoryMock.findOne.mockResolvedValue(bandMock);

    const result = await service.findOne(10, employeeAuth);

    expect(result).toEqual(bandMock);

    expect(bandRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: 10 },
      relations: {
        farm: true,
        employees: true,
      },
    });
  });

  it('should reject access when an employee is not assigned to the band', async () => {
    const bandWithoutEmployee = {
      ...bandMock,
      employees: [],
    };

    bandRepositoryMock.findOne.mockResolvedValue(
      bandWithoutEmployee,
    );

    await expect(
      service.findOne(10, employeeAuth),
    ).rejects.toThrow(
      'Vous ne pouvez pas accéder à cette bande.',
    );
  });

  it('should allow an ADMIN to access any existing band', async () => {
    const bandWithoutEmployee = {
      ...bandMock,
      employees: [],
    };

    bandRepositoryMock.findOne.mockResolvedValue(
      bandWithoutEmployee,
    );

    const result = await service.findOne(10, adminAuth);

    expect(result).toEqual(bandWithoutEmployee);
  });

  // COMPTE DÉSACTIVÉ

  it('should reject access when the user account is inactive', async () => {
    userRepositoryMock.findOne.mockResolvedValue(null);

    await expect(
      service.findAll(employeeAuth),
    ).rejects.toThrow(
      'Compte utilisateur inactif ou introuvable.',
    );

    expect(bandRepositoryMock.find).not.toHaveBeenCalled();
  });
});
