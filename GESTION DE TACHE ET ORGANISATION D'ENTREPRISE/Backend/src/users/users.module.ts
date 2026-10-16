import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Departments } from '../departement/entities/departement.entity';
import { AuthService } from 'src/auth/auth.service';
import { Project } from 'src/project/entities/project.entity';
import { UserProvider } from './entities/user-provider.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserProvider, Departments, Project])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
