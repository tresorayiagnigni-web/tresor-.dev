import { IsOptional, IsString, IsEmail, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { Role } from '../../auth/enums/role.enum';
import { Type } from 'class-transformer'; 

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
  status?: boolean; 

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  departementId?: number;

}