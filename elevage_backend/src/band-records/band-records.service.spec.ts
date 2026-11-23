import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConflictException } from '@nestjs/common';

import { BandRecordsService } from './band-records.service.js';
import { BandRecord } from './entities/band-record.entity.js';
import { Band, BandStatus } from '../bands/entities/band.entity.js';
import { User, UserRole } from '../users/entities/user.entity.js';

describe('BandRecordsService', () => {
  let service: BandRecordsService;

  const admin = {
    id: 1,
    nom: 'Administrateur',
    email: 'admin@test.com',
    role: UserRole.ADMIN,
    status: true,
  } as User;

  const employee = {
    id: 2,
    nom: 'Employé',
    email: 'employee@test.com',
    role: UserRole.EMPLOYEE,
    status: true,
  } as User;

  const band = {
    id: 1,
    nom: 'Bande A',
    numero_batiment: 'BAT-01',
    race: 'Chair',
    date_demarrage: '2026-11-01',
    effectif_initial: 1000,
    status: BandStatus.GROWING,
    employees: [employee],
    farm: { id: 1, nom: 'Ferme A' },
  } as Band;

  const recordRepository = {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn((data) => data),
    save: vi.fn(),
    remove: vi.fn(),
  };

  const bandRepository = {
    findOne: vi.fn(),
  };

  const userRepository = {
    findOne: vi.fn(),
  };

  const dataSource = {
    transaction: vi.fn(async (callback: (manager: any) => Promise<any>) =>
      callback({
        getRepository: (entity: unknown) =>
          entity === Band ? bandRepository : recordRepository,
      }),
    ),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BandRecordsService,
        {
          provide: getRepositoryToken(BandRecord),
          useValue: recordRepository,
        },
        {
          provide: getRepositoryToken(Band),
          useValue: bandRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<BandRecordsService>(BandRecordsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      bandId: 1,
      date_releve: '2026-11-10',
      mortalite_jour: 5,
      autres_sorties: 2,
    };

    it('doit créer un relevé avec son auteur', async () => {
      userRepository.findOne.mockResolvedValue(employee);
      bandRepository.findOne.mockResolvedValue(band);
      recordRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 10,
          ...dto,
          band,
          createdBy: employee,
        });

      recordRepository.find.mockResolvedValue([]);
      recordRepository.save.mockImplementation(async (record) => ({
        ...record,
        id: 10,
      }));

      const result = await service.create(dto, employee);

      expect(recordRepository.save).toHaveBeenCalled();
      expect(result.createdBy).toEqual(employee);
      expect(result.age_jours).toBe(9);
      expect(result.semaine).toBe(2);
      expect(result.effectif_restant).toBe(993);
    });

    it('doit refuser un employé non affecté', async () => {
      const otherEmployee = {
        ...employee,
        id: 3,
      };

      userRepository.findOne.mockResolvedValue(otherEmployee);
      bandRepository.findOne.mockResolvedValue(band);

      await expect(service.create(dto, otherEmployee)).rejects.toBeInstanceOf(
        ForbiddenException,
      );

      expect(recordRepository.save).not.toHaveBeenCalled();
    });

    it('doit refuser un relevé en double', async () => {
      userRepository.findOne.mockResolvedValue(employee);
      bandRepository.findOne.mockResolvedValue(band);
      recordRepository.findOne.mockResolvedValue({ id: 5 });

      await expect(service.create(dto, employee)).rejects.toBeInstanceOf(
        ConflictException,
      );

      expect(recordRepository.save).not.toHaveBeenCalled();
    });

    it('doit refuser une date antérieure au démarrage', async () => {
      userRepository.findOne.mockResolvedValue(employee);
      bandRepository.findOne.mockResolvedValue(band);

      await expect(
        service.create(
          {
            ...dto,
            date_releve: '2026-10-30',
          },
          employee,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
    describe('update', () => {
      it('doit refuser la modification par un employé', async () => {
        userRepository.findOne.mockResolvedValue(employee);

        await expect(
          service.update(10, { observations: 'Modification' }, employee),
        ).rejects.toBeInstanceOf(ForbiddenException);

        expect(dataSource.transaction).not.toHaveBeenCalled();
      });

      it('doit refuser la modification par un administrateur désactivé', async () => {
        const inactiveAdmin = {
          ...admin,
          status: false,
        } as User;

        userRepository.findOne.mockResolvedValue(null);

        await expect(
          service.update(10, { observations: 'Modification' }, inactiveAdmin),
        ).rejects.toBeInstanceOf(ForbiddenException);

        expect(dataSource.transaction).not.toHaveBeenCalled();
      });
    });

    describe('remove', () => {
      it('doit refuser la suppression par un employé', async () => {
        userRepository.findOne.mockResolvedValue(employee);

        await expect(service.remove(10, employee)).rejects.toBeInstanceOf(
          ForbiddenException,
        );

        expect(dataSource.transaction).not.toHaveBeenCalled();
      });
    });
  });

  describe('findOne', () => {
    it('doit refuser l’accès à un employé non affecté', async () => {
      const otherEmployee = {
        ...employee,
        id: 3,
      };

      userRepository.findOne.mockResolvedValue(otherEmployee);

      recordRepository.findOne.mockResolvedValue({
        id: 10,
        date_releve: '2026-11-10',
        mortalite_jour: 0,
        autres_sorties: 0,
        band,
        createdBy: admin,
      });

      await expect(service.findOne(10, otherEmployee)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });
});
