
import { Test, TestingModule } from '@nestjs/testing';
import { BandRecordsController } from './band-records.controller.js';
import { BandRecordsService } from './band-records.service.js';
import { UserRole } from '../users/entities/user.entity.js';

describe('BandRecordsController', () => {
  let controller: BandRecordsController;

  const mockService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  const user = {
    id: 1,
    email: 'admin@test.com',
    role: UserRole.ADMIN,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BandRecordsController],
      providers: [
        {
          provide: BandRecordsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<BandRecordsController>(
      BandRecordsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('doit appeler create', async () => {
    const dto = {
      bandId: 1,
      date_releve: '2026-11-10',
    };

    mockService.create.mockResolvedValue({ id: 1 });

    await expect(
      controller.create(dto, { user } as any),
    ).resolves.toEqual({ id: 1 });

    expect(mockService.create).toHaveBeenCalledWith(dto, user);
  });

  it('doit appeler findAll', async () => {
    mockService.findAll.mockResolvedValue([]);

    await expect(
      controller.findAll({ user } as any),
    ).resolves.toEqual([]);

    expect(mockService.findAll).toHaveBeenCalledWith(user);
  });

  it('doit appeler findOne', async () => {
    mockService.findOne.mockResolvedValue({ id: 5 });

    await expect(
      controller.findOne(5, { user } as any),
    ).resolves.toEqual({ id: 5 });

    expect(mockService.findOne).toHaveBeenCalledWith(5, user);
  });

  it('doit appeler update', async () => {
    const dto = { observations: 'Observation modifiée' };

    mockService.update.mockResolvedValue({ id: 5 });

    await expect(
      controller.update(5, dto as any, { user } as any),
    ).resolves.toEqual({ id: 5 });

    expect(mockService.update).toHaveBeenCalledWith(
      5,
      dto,
      user,
    );
  });

  it('doit appeler remove', async () => {
    mockService.remove.mockResolvedValue({
      message: 'Relevé supprimé avec succès.',
    });

    await expect(
      controller.remove(5, { user } as any),
    ).resolves.toEqual({
      message: 'Relevé supprimé avec succès.',
    });

    expect(mockService.remove).toHaveBeenCalledWith(5, user);
  });
});
