import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentController } from './departement.controller';
import { DepartmentService } from './departement.service';

describe('DepartmentController', () => {
  let controller: DepartmentController;

  const mockDepartmentService = {
    // Ajoute ici les méthodes que le contrôleur utilise réellement
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentController],
      providers: [
        {
          provide: DepartmentService,
          useValue: mockDepartmentService,
        },
      ],
    }).compile();

    controller = module.get<DepartmentController>(DepartmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});