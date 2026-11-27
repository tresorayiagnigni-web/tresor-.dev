import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SettingsService } from './settings.service.js';
import { SettingsController } from './settings.controller.js';
import { FarmSettings } from './entities/setting.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([FarmSettings])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}