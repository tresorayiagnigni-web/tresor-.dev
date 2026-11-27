import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FarmSettings } from './entities/setting.entity.js';
import { CreateSettingDto } from './dto/create-setting.dto.js';
import { UpdateSettingDto } from './dto/update-setting.dto.js';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(FarmSettings)
    private readonly settingsRepository: Repository<FarmSettings>,
  ) {}

  async create(createSettingDto: CreateSettingDto): Promise<FarmSettings> {
    const existingSettings = await this.settingsRepository.findOne({
      where: { id: 1 },
    });

    if (existingSettings) {
      throw new ConflictException(
        "Les paramètres de l'exploitation existent déjà.",
      );
    }

    const settings = this.settingsRepository.create(createSettingDto);
    return this.settingsRepository.save(settings);
  }

  async findAll(): Promise<FarmSettings | null> {
    const settings = await this.settingsRepository.find({
      order: { id: 'ASC' },
      take: 1,
    });

    return settings[0] ?? null;
  }

  async findOne(id: number): Promise<FarmSettings> {
    const settings = await this.settingsRepository.findOne({
      where: { id },
    });

    if (!settings) {
      throw new NotFoundException('Paramètres introuvables.');
    }

    return settings;
  }

  async update(
    id: number,
    updateSettingDto: UpdateSettingDto,
  ): Promise<FarmSettings> {
    const settings = await this.findOne(id);

    this.settingsRepository.merge(settings, updateSettingDto);

    return this.settingsRepository.save(settings);
  }

  async remove(id: number): Promise<void> {
    const settings = await this.findOne(id);
    await this.settingsRepository.remove(settings);
  }
}
