// register.dto.ts
import { IsEmail, IsNotEmpty, MinLength, IsString, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Role } from '../enums/role.enum';

export class RegisterDto {

    @IsString()
    @IsNotEmpty()
    nom?: string;

    @IsEmail()
    email?: string;

    @IsNotEmpty()
    @MinLength(6)
    password?: string;

    @IsString()
    @IsNotEmpty()
    telephone?: string;

    @IsEnum(Role, { message: 'Rôle invalide. Valeurs acceptées : , hod, employee' })
    @IsNotEmpty({ message: 'Le rôle est obligatoire' })
    role?: Role;

    // @IsOptional()
    // @IsNumber()
    // departementId?: number;

    // autres champs...
}