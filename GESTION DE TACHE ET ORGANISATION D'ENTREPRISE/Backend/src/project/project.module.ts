import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './project.service';
import { ProjectsController } from './project.controller';
import { Project } from './entities/project.entity';
import { Departments } from '../departement/entities/departement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Departments])],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}