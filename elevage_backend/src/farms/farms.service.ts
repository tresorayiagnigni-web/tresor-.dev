
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Farm } from './entities/farm.entity.js';
import { CreateFarmDto } from './dto/create-farm.dto.js';
import { UpdateFarmDto } from './dto/update-farm.dto.js';

@Injectable()
export class FarmsService {
  constructor(
    @InjectRepository(Farm)
    private readonly farmRepository: Repository<Farm>,
  ) {}

  // Créer une exploitation
  async create(dto: CreateFarmDto): Promise<Farm> {
    const farm = this.farmRepository.create(dto);
    return this.farmRepository.save(farm);
  }

  // Récupérer toutes les exploitations
  async findAll(): Promise<Farm[]> {
    return this.farmRepository.find({
      order: { cree_le: 'DESC' },
    });
  }

  // Récupérer une exploitation
  async findOne(id: number): Promise<Farm> {
    const farm = await this.farmRepository.findOne({
      where: { id },
    });

    if (!farm) {
      throw new NotFoundException(
        `Exploitation avec l'identifiant ${id} introuvable`,
      );
    }

    return farm;
  }

  // Modifier une exploitation
  async update(
    id: number,
    dto: UpdateFarmDto,
  ): Promise<Farm> {
    const farm = await this.findOne(id);

    Object.assign(farm, dto);

    return this.farmRepository.save(farm);
  }

  // Désactiver une exploitation
  async remove(id: number): Promise<Farm> {
    const farm = await this.findOne(id);

    farm.status = false;

    return this.farmRepository.save(farm);
  }
}
