import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import {
  PhysicalInventoryItemType,
  EquipmentCondition,
} from '../entities/physical-inventory-item.entity.js';

export class CreatePhysicalInventoryItemDto {
  @IsEnum(PhysicalInventoryItemType)
  type: PhysicalInventoryItemType;

  @IsString()
  @MaxLength(150)
  designation: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  quantite_physique: number;

  @ValidateIf(
    (object) => object.type === PhysicalInventoryItemType.MATERIEL,
  )
  @IsEnum(EquipmentCondition)
  etat_materiel?: EquipmentCondition;

  @IsOptional()
  @IsString()
  observations?: string;
}
