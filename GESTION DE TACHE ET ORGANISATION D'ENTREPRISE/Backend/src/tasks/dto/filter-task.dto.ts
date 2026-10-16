import { IsOptional, IsEnum, IsString } from 'class-validator';
import { TaskStatus } from '../enums/task-status.enum';
import { TaskPriority } from '../enums/task-priority.enum';

export class FilterTaskDto {
    
    @IsEnum(TaskStatus)
    @IsOptional()
    status?: TaskStatus;

    @IsEnum(TaskPriority)
    @IsOptional()
    priorite?: TaskPriority;

    @IsString()
    @IsOptional()
    search?: string;   // Pour rechercher dans le titre ou description
}