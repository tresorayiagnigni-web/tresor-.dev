
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Band } from './entities/band.entity.js';
import { Farm } from '../farms/entities/farm.entity.js';
import { User } from '../users/entities/user.entity.js';

import { BandsService } from './bands.service.js';
import { BandsController } from './bands.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Band, Farm, User]),
  ],
  controllers: [BandsController],
  providers: [BandsService],
  exports: [BandsService],
})
export class BandsModule {}
