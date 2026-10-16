import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DepartmentService } from './departement.service';
import { Departments } from './entities/departement.entity'; // adapte le nom de l'entité si besoin
import { User } from '../users/entities/user.entity'; // adapte le chemin si besoin

describe('DepartmentService', () => {
  let service: DepartmentService;

  // ===== MOCKS =====
  const mockDepartmentRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    // ajoute les méthodes que tu utilises dans DepartmentService
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    // ...
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentService,
        {
          provide: getRepositoryToken(Departments), // ← nom exact de ton entité
          useValue: mockDepartmentRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<DepartmentService>(DepartmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});