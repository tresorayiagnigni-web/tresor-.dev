
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Farm } from './entities/farm.entity.js';
import { FarmsService } from './farms.service.js';
import { FarmsController } from './farms.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Farm]),
  ],
  controllers: [FarmsController],
  providers: [FarmsService],
  exports: [FarmsService],
})
export class FarmsModule {}
