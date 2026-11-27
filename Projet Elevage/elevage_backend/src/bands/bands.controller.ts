
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';

import type { Request } from 'express';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { BandsService } from './bands.service.js';
import { CreateBandDto } from './dto/create-band.dto.js';
import { UpdateBandDto } from './dto/update-band.dto.js';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/role.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../users/entities/user.entity.js';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: UserRole;
  };
}

@ApiTags('Gestion des bandes')
@ApiBearerAuth()
@Controller('bands')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BandsController {
  constructor(
    private readonly bandsService: BandsService,
  ) {}

  // Création : ADMIN uniquement
  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateBandDto) {
    return this.bandsService.create(dto);
  }

  // Liste selon les droits de l'utilisateur
  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.bandsService.findAll(req.user);
  }

  // Détail selon les droits de l'utilisateur
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bandsService.findOne(id, req.user);
  }

  // Modification : ADMIN uniquement
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBandDto,
  ) {
    return this.bandsService.update(id, dto);
  }

  // Archivage : ADMIN uniquement
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bandsService.remove(id);
  }
}
