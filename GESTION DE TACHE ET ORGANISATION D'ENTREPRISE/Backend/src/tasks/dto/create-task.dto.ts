import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { TaskStatus } from '../enums/task-status.enum';
import { TaskPriority } from '../enums/task-priority.enum';

export class CreateTaskDto {
    @IsString()
    @IsNotEmpty()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(TaskStatus)
    @IsOptional()
    status?: TaskStatus;

    @IsEnum(TaskPriority)
    @IsOptional()
    priorite?: TaskPriority;

    @IsNotEmpty()
    @IsNumber()
    userId?: number;

    @IsDateString()
    Date_limite?: string

  @IsOptional()          // mets @IsNotEmpty() si le projet est obligatoire
  @IsNumber()
  projectId?: number;

}
