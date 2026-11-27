import { Type } from 'class-transformer';

import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateEquipmentDeliveryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  equipmentId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  farmId?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  quantite: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observations?: string;
}
