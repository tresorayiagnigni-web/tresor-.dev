
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsNotEmpty,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBandRecordDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  bandId: number;

  @IsDateString()
  date_releve: string;

  // Mortalité et autres sorties
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  mortalite_jour?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  autres_sorties?: number;

  // Pesée facultative
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  poids_moyen_g?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  poids_standard_g?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  taille_echantillon?: number;

  // Température
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  temperature_min_c?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  temperature_max_c?: number;

  // Alimentation
  @IsOptional()
  @IsString()
  @MaxLength(100)
  code_aliment?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  ration_g_par_sujet_jour?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  quantite_aliment_kg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  nombre_sacs?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  nombre_repas?: number;

  // Eau
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  eau_litres?: number;

  // Santé et observations
  @IsOptional()
  @IsString()
  vaccination?: string;

  @IsOptional()
  @IsString()
  traitement?: string;

  @IsOptional()
  @IsString()
  observations_sante?: string;

  @IsOptional()
  @IsString()
  ventilation?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  photoUrl?: string;
}

