// import { IsString, IsEmail, IsEnum, IsOptional, IsNotEmpty, IsNumber } from 'class-validator';
// import { Role } from '../../auth/enums/role.enum';
// import {Type} from 'class-transformer';

// export class CreateUserDto {

//   @IsNotEmpty()
//   @IsString()
//   nom?: string;

//   @IsNotEmpty()
//   @IsEmail()
//   email?: string;

//   @IsNotEmpty()
//   @IsString()
//   password?: string;


//   @IsOptional()
//   @Type(() => Number)
//   @IsNumber()
//   departementId?: number;


//   @IsNotEmpty()
//   @IsString()
//   telephone?: string;

//   @IsOptional()
//   @IsEnum(Role)
//   role?: Role;


// }

import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';

import { Role } from '../../auth/enums/role.enum';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  nom?: string;

  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @IsNotEmpty()
  @IsString()
  password?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  departementId?: number;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}