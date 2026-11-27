import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  Min,
} from 'class-validator';

import { Type } from 'class-transformer';

export class CreatePhysicalInventoryDto {
  @IsDateString()
  date_inventaire: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  bandId: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observations?: string;
}
