import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateStatusDto {
  @IsBoolean()
  @IsNotEmpty()
  status?: boolean;
}