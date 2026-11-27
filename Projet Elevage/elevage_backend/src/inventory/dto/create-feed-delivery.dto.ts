import { Type } from 'class-transformer';

import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateFeedDeliveryDto {
  @IsString()
  @MaxLength(100)
  code_aliment: string;

  @IsDateString()
  date_reception: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantite_tonnes: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  farmId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  fournisseur?: string;

  @IsOptional()
  @IsString()
  observations?: string;
}
