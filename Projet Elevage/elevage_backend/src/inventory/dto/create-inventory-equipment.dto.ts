import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateInventoryEquipmentDto {
  @IsString()
  @MaxLength(150)
  designation: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  unite?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  quantite_reference: number;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
