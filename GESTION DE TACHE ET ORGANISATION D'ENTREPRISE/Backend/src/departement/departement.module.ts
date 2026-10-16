import { Module } from '@nestjs/common';
import { DepartmentService } from './departement.service';
import { DepartmentController } from './departement.controller';
import { Departments } from './entities/departement.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Departments, User, UsersModule]), // ← Très important
  ],
  controllers: [DepartmentController],
  providers: [DepartmentService],
  exports: [DepartmentService],
})
export class DepartementModule {}
