import { IsOptional, IsString, IsEmail, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { Role } from '../../auth/enums/role.enum'; // adapte le chemin

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBoolean()
  status?: boolean; // si tu as un champ status

  @IsOptional()
  @IsNumber()
  departementId?: number;

  // Ajoute ici tous les autres champs que tu veux pouvoir modifier
}