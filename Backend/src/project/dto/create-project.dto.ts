import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Nom du département auquel on assigne le projet
  @IsNotEmpty()
  @IsNumber()
  departementId?: number;
}