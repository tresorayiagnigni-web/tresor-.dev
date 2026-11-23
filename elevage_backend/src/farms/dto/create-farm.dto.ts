
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

export class CreateFarmDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nom: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  localisation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  responsable?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telephone?: string;
}
