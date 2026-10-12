import { IsString, IsOptional, IsBoolean, IsEmpty, IsNumber } from 'class-validator';
import { ConflictException, NotFoundException, BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository} from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Departments } from './entities/departement.entity';
import { CreateDepartmentDto } from './dto/create-departement.dto';
import { UpdateDepartmentDto } from './dto/update-departement.dto';
import { AssignChefDto } from './dto/assign-chef.dto';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/auth/enums/role.enum';
import { id } from 'node_modules/date-fns/locale/id';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Departments)
    private departmentRepository: Repository<Departments>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  //   async create(createDepartmentDto: CreateDepartmentDto) {
  //   const { nom_departement, description } = createDepartmentDto;

  //   // Vérifier que le département n'existe pas déjà
  //   const existing = await this.departmentRepository.findOne({
  //     where: { nom_departement },
  //   });

  //   if (existing) {
  //     throw new ConflictException('Ce département existe déjà');
  //   }

  //   // Créer le département sans chef
  //   const department = this.departmentRepository.create({
  //     nom_departement,
  //     description,
  //     // pas de chef_departement
  //   });

  //   return this.departmentRepository.save(department);
// }

  async create(createDepartmentDto: CreateDepartmentDto) {
    const { nom_departement, description, chef_departementId } = createDepartmentDto;

    const existing = await this.departmentRepository.findOne({
      where: { nom_departement },
    });

    if (existing) {
      throw new ConflictException('Ce département existe déjà');
    }

    let chef: User | null = null;

   // Seulement si un chef est fourni
    if (chef_departementId) {
      chef = await this.usersRepository.findOne({
        where: { id: chef_departementId },
        relations: { departement: true },
      });

      if (!chef) {
        throw new NotFoundException('Employé introuvable');
      }

      if (chef.role === Role.ADMIN) {
        throw new BadRequestException('Un administrateur ne peut pas être chef de département');
      }
    }


    const department = this.departmentRepository.create({
      nom_departement,
      description,
      chef_departement: chef_departementId ? chef : null,
    });

    const savedDepartment = await this.departmentRepository.save(department);

    // Si un chef a été nommé → passer son rôle à HOD
    if (chef) {
      chef.role = Role.HOD;
      chef.departement = savedDepartment;
      await this.usersRepository.save(chef);
    }

    return this.departmentRepository.findOne({
      where: { id: savedDepartment.id },
      relations: {chef_departement:true},
    });  
  }
  
  async findAll() {
    const department = this.departmentRepository.find({
      relations: { chef_departement: true },
    });

    const result = await Promise.all(
    (await department).map(async (departement) => {
      const nombre_de_membre = await this.usersRepository.count({
        where: {
          departement: {
            id: departement.id,
          },
        },
      });

      return {
        ...departement,
        nombre_de_membre,
      };
    }),
  );

  return result;
  }
    

  async findOne(id: number) {
    const department = await this.departmentRepository.findOne({
      where: { id },
      relations: { chef_departement: true },
    });

    if (!department) {
      throw new NotFoundException('Département non trouvé');
    }
    
    
      const nombre_de_membre = await this.usersRepository.count({
        where: {
          departement: {
            id: department.id,
          },
        },
      });

      return {
        ...department,
        nombre_de_membre,
      };
  }

  async update(id: number, updateDepartmentDto: UpdateDepartmentDto) {

    console.log('🔥 UPDATE DEPARTMENT BACKEND');
console.log('ID:', id);
console.log('DTO REÇU:', updateDepartmentDto);
console.log('CHEF ID:', updateDepartmentDto.chef_DepartementId);

  const department = await this.departmentRepository.findOne({
    where: { id },
    relations: { chef_departement: true },
  });

  if (!department) {
    throw new NotFoundException('Département introuvable');
  }

  // Modifier le nom
  if (updateDepartmentDto.nom_departement !== undefined) {
    department.nom_departement =
    updateDepartmentDto.nom_departement.trim();
  }

  // Modifier la description
  if (updateDepartmentDto.description !== undefined) {
    department.description =
      updateDepartmentDto.description.trim();
  }

  // Si on change le chef
  if (updateDepartmentDto.chef_DepartementId) {
    const nouveauChef = await this.usersRepository.findOne({
      where: { id: updateDepartmentDto.chef_DepartementId },
      relations: {departement: true}
    });

    if (!nouveauChef) {
      throw new NotFoundException('Employé introuvable');
    }

    console.log('ID département:', department.id);

console.log('HOD:', {
  id: nouveauChef.id,
  nom: nouveauChef.nom,
  departement: nouveauChef.departement,
  departementId: nouveauChef.departement?.id,
});

     // Vérifier que le nouvel HOD appartient au département
    if (nouveauChef.departement?.id !== department.id) {
      throw new BadRequestException(
        'Cet EMPLOYEE doit appartenir à ce département',
      );
    }

    // Rétrograder l'ancien chef
    if (department.chef_departement) {
      department.chef_departement.role = Role.EMPLOYEE;
      await this.usersRepository.save(department.chef_departement);
    }

    // Nommer le nouveau
    department.chef_departement = nouveauChef;
    nouveauChef.role = Role.HOD;
    await this.usersRepository.save(nouveauChef);
     // Mettre à jour la relation
    department.chef_departement = nouveauChef;
  }

//   if (dto.chef_DepartementId !== undefined) {
//   const chef = await this.usersRepository.findOne({
//     where: { id: dto.chef_DepartementId },
//   });

//   if (!chef) {
//     throw new NotFoundException('Utilisateur introuvable');
//   }

//   department.chef_departement = chef;
// }

  // Sauvegarder le département
  const updatedDepartment =
    await this.departmentRepository.save(department);

  // Autres champs (nom, description…)
  if (updateDepartmentDto.nom_departement) {
    department.nom_departement = updateDepartmentDto.nom_departement;
  }
  if (updateDepartmentDto.description !== undefined) {
    department.description = updateDepartmentDto.description;
  }

  return this.departmentRepository.save(department);
}


  async remove(id: number): Promise<{ message: string }> {
    const department = await this.departmentRepository.findOne({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException('Département introuvable');
    }
    await this.departmentRepository.remove(department);
    return { message: 'Département supprimé avec succès' };
  }

  async assignChef(departementId: number, chef_DepartementId: number) {
  const departement = await this.departmentRepository.findOne({
    where: { id: departementId },
    relations: {chef_departement: true},
  });

  if (!departement) {
    throw new NotFoundException('Département introuvable');
  }

  const user = await this.usersRepository.findOne({
    where: { id: chef_DepartementId, status: true },
    relations: {departement: true},
  });

  if (!user) {
    throw new NotFoundException('Utilisateur introuvable');
  }

  // Vérifications métier
  if (user.role === Role.ADMIN) {
    throw new BadRequestException('Un administrateur ne peut pas être chef de département');
  }

  if (user.departement?.nom_departement !== departement.nom_departement) {
    throw new BadRequestException(
      'L\'employé doit appartenir à ce département pour en devenir le chef',
    );
  }

  // Si le département a déjà un chef → on le rétrograde en EMPLOYEE
  if (departement.chef_departement) {
    const ancienChef = departement.chef_departement;
    ancienChef.role = Role.EMPLOYEE;
    await this.usersRepository.save(ancienChef);
  }

  // Nommer le nouveau chef
  departement.chef_departement = user;
  await this.departmentRepository.save(departement);

  // Passer le rôle de l'employé à HOD
  user.role = Role.HOD;
  await this.usersRepository.save(user);

  return {
    message: `${user.nom} est maintenant chef du département ${departement.nom_departement}`,
    user: {
      id: user.id,
      nom: user.nom,
      email: user.email,
      role: user.role,
    },
    departement: {
      id: departement.id,
      nom_departement: departement.nom_departement,
    },
  };
}

//   async removeChef(nom_departement: string) {
//   const departement = await this.departmentRepository.findOne({
//     where: { nom_departement: nom_departement },
//     relations: {chef_departement: true},
//   });

//   if (!departement) {
//     throw new NotFoundException('Département introuvable');
//   }

//   if (!departement.chef_departement) {
//     throw new BadRequestException('Ce département n\'a pas de chef');
//   }

//   const chef = departement.chef_departement;

//   // Retirer le lien
//   departement.chef_departement = null;
//   await this.departmentRepository.save(departement);

//   // Remettre le rôle à EMPLOYEE
//   chef.role = Role.EMPLOYEE;
//   await this.usersRepository.save(chef);

//   return {
//     message: `${chef.nom} n'est plus chef de département`,
//   };
// }

async removeChef(id: number) {
  const departement = await this.departmentRepository.findOne({
    where: { id },
    relations: {
      chef_departement: true,
    },
  });

  if (!departement) {
    throw new NotFoundException('Département introuvable');
  }

  if (!departement.chef_departement) {
    throw new BadRequestException(
      "Ce département n'a pas de chef",
    );
  }

  const chef = departement.chef_departement;

  // Retirer le chef du département
  departement.chef_departement = null;
  await this.departmentRepository.save(departement);

  // Remettre son rôle à EMPLOYEE
  chef.role = Role.EMPLOYEE;
  await this.usersRepository.save(chef);

  return {
    message: `${chef.nom} n'est plus chef de département`,
  };
}

}
