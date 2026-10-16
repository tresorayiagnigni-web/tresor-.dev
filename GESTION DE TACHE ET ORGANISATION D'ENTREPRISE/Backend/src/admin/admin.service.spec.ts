import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { getRepositoryToken } from '@nestjs/typeorm';


describe('AdminService', () => {
  let service: AdminService;

  // Mocks
  const mockUserRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    // ajoute les méthodes que tu utilises
  };

  const mockTaskRepository = {
    find: jest.fn(),
    // ...
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
        providers: [
          AdminService,
            {
              provide: getRepositoryToken(User),
              useValue: mockUserRepository,
            },
            {
              provide: getRepositoryToken(Task), // adapte le nom de l'entité
              useValue: mockTaskRepository,
            },
        ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});