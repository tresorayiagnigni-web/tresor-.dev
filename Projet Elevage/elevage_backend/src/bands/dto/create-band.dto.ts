
import { Type } from 'class-transformer';

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsDateString,
  IsArray,
  ArrayUnique,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBandDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nom: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  numero_batiment: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  race: string;

  @IsDateString()
  date_demarrage: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  effectif_initial: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  aliment_demarrage?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  farmId: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  employeeIds?: number[];
}
