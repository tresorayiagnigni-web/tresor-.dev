
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BandRecordsService } from './band-records.service.js';
import { BandRecordsController } from './band-records.controller.js';

import { BandRecord } from './entities/band-record.entity.js';
import { Band } from '../bands/entities/band.entity.js';
import { User } from '../users/entities/user.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([BandRecord, Band, User]),
  ],
  controllers: [BandRecordsController],
  providers: [BandRecordsService],
  exports: [BandRecordsService],
})
export class BandRecordsModule {}
