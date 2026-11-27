import {
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class SetBandEquipmentReferenceDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999.99)
  quantite_reference: number;
}