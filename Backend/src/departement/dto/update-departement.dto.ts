import { IsString, IsOptional, IsBoolean, IsEmpty, IsNumber } from 'class-validator';

export class UpdateDepartmentDto {
    @IsString()
    @IsOptional()
    nom_departement?: string;

    @IsNumber()
    @IsOptional()
    chef_DepartementId?: number;

    @IsString()
    @IsOptional()
    description?: string;

    // @IsBoolean()
    // @IsOptional()
    // isActive?: boolean;
}