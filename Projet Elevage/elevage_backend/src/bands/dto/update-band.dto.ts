
import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';

import { CreateBandDto } from './create-band.dto.js';
import { BandStatus } from '../entities/band.entity.js';

export class UpdateBandDto extends PartialType(CreateBandDto) {
  @IsOptional()
  @IsEnum(BandStatus)
  status?: BandStatus;
}
