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
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';

import type { Request } from 'express';

import { BandRecordsService } from './band-records.service.js';
import { CreateBandRecordDto } from './dto/create-band-record.dto.js';
import { UpdateBandRecordDto } from './dto/update-band-record.dto.js';

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

@ApiTags('Suivi quotidien des bandes')
@ApiBearerAuth()
@Controller('band-records')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BandRecordsController {
  constructor(private readonly bandRecordsService: BandRecordsService) {}

  @Post()
  create(@Body() dto: CreateBandRecordDto, @Req() req: AuthenticatedRequest) {
    return this.bandRecordsService.create(dto, req.user);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.bandRecordsService.findAll(req.user);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bandRecordsService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBandRecordDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bandRecordsService.update(id, dto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bandRecordsService.remove(id, req.user);
  }
}
