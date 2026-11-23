
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';

import { BandsController } from './bands.controller.js';
import { BandsService } from './bands.service.js';
import { UserRole } from '../users/entities/user.entity.js';

describe('BandsController', () => {
  let controller: BandsController;

  const authenticatedUser = {
    id: 1,
    email: 'employee@test.com',
    role: UserRole.EMPLOYEE,
  };

  const authenticatedRequest = {
    user: authenticatedUser,
  };

  const bandsServiceMock = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BandsController],
      providers: [
        {
          provide: BandsService,
          useValue: bandsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<BandsController>(BandsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call create service method', async () => {
    const dto = {
      nom: 'Bande 001',
      numero_batiment: 'BAT-01',
      race: 'ISA Brown',
      date_demarrage: '2026-11-23',
      effectif_initial: 1000,
      farmId: 1,
    };

    const expected = { id: 1, ...dto };

    bandsServiceMock.create.mockResolvedValue(expected);

    await expect(controller.create(dto)).resolves.toEqual(expected);

    expect(bandsServiceMock.create).toHaveBeenCalledWith(dto);
  });

  it('should pass authenticated user to findAll service method', async () => {
    bandsServiceMock.findAll.mockResolvedValue([]);

    await expect(
      controller.findAll(authenticatedRequest as any),
    ).resolves.toEqual([]);

    expect(bandsServiceMock.findAll).toHaveBeenCalledWith(
      authenticatedUser,
    );
  });

  it('should pass authenticated user to findOne service method', async () => {
    const expected = { id: 1, nom: 'Bande 001' };

    bandsServiceMock.findOne.mockResolvedValue(expected);

    await expect(
      controller.findOne(1, authenticatedRequest as any),
    ).resolves.toEqual(expected);

    expect(bandsServiceMock.findOne).toHaveBeenCalledWith(
      1,
      authenticatedUser,
    );
  });

  it('should call update service method', async () => {
    const dto = { nom: 'Bande modifiée' };
    const expected = { id: 1, ...dto };

    bandsServiceMock.update.mockResolvedValue(expected);

    await expect(controller.update(1, dto)).resolves.toEqual(expected);

    expect(bandsServiceMock.update).toHaveBeenCalledWith(1, dto);
  });

  it('should call remove service method', async () => {
    const expected = { id: 1, status: 'ARCHIVED' };

    bandsServiceMock.remove.mockResolvedValue(expected);

    await expect(controller.remove(1)).resolves.toEqual(expected);

    expect(bandsServiceMock.remove).toHaveBeenCalledWith(1);
  });
});
