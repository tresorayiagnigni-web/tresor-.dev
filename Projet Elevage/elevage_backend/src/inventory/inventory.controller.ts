import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
  Req,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import type { Request } from 'express';

import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

import { InventoryService } from './inventory.service.js';
import { PhysicalInventoryService } from './physical-inventory.service.js';

import { CreateFeedDeliveryDto } from './dto/create-feed-delivery.dto.js';
import { CreatePhysicalInventoryDto } from './dto/create-physical-inventory.dto.js';
import { CreatePhysicalInventoryItemDto } from './dto/create-physical-inventory-item.dto.js';
import { CreateInventoryEquipmentDto } from './dto/create-inventory-equipment.dto.js';
import { SetBandEquipmentReferenceDto } from './dto/set-band-equipment-reference.dto.js';
import { EquipmentStockService } from './equipment-stock.service.js';

import { CreateEquipmentDeliveryDto } from './dto/create-equipment-delivery.dto.js';
import { UpdateEquipmentDistributionDto } from './dto/update-equipment-distribution.dto.js';

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

@ApiTags('Alimentation et Stock')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly physicalInventoryService: PhysicalInventoryService,
    private readonly equipmentStockService: EquipmentStockService,
  ) {}

  // APPROVISIONNEMENTS ALIMENTAIRES

  @Post('deliveries')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Enregistrer un approvisionnement alimentaire' })
  createDelivery(
    @Body() dto: CreateFeedDeliveryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.inventoryService.createDelivery(dto, req.user);
  }

  @Get('deliveries')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Consulter les approvisionnements autorisés' })
  findAllDeliveries(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.findAllDeliveries(req.user);
  }

  @Get('stock')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Consulter le stock alimentaire par ferme' })
  getStock(@Req() req: AuthenticatedRequest) {
    return this.inventoryService.getStockSummary(req.user);
  }

  // INVENTAIRES PHYSIQUES

  @Post('physical')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Créer un inventaire physique pour une bande' })
  createPhysicalInventory(
    @Body() dto: CreatePhysicalInventoryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.physicalInventoryService.createInventory(dto, req.user);
  }

  @Get('physical')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Consulter les inventaires physiques autorisés' })
  findAllPhysicalInventories(@Req() req: AuthenticatedRequest) {
    return this.physicalInventoryService.findAll(req.user);
  }

  @Get('physical/:id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Consulter un inventaire physique autorisé' })
  findOnePhysicalInventory(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.physicalInventoryService.findOne(id, req.user);
  }

  @Post('physical/:id/items')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Ajouter un élément à un inventaire autorisé' })
  addPhysicalInventoryItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreatePhysicalInventoryItemDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.physicalInventoryService.addItem(id, dto, req.user);
  }

  @Patch('physical/:id/complete')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Terminer un inventaire autorisé' })
  completePhysicalInventory(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.physicalInventoryService.completeInventory(id, req.user);
  }

  // STOCK RÉEL DU MATÉRIEL PAR FERME

  @Post('equipment-deliveries')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: 'Enregistrer un approvisionnement en matériel',
  })
  createEquipmentDelivery(
    @Body() dto: CreateEquipmentDeliveryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.equipmentStockService.createDelivery(dto, req.user);
  }

  @Get('equipment-stock')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: 'Consulter le stock réel du matériel par ferme',
  })
  findAllEquipmentStocks(@Req() req: AuthenticatedRequest) {
    return this.equipmentStockService.findAllStocks(req.user);
  }

  @Patch('equipment-stock/:id/distribution')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: 'Modifier la répartition du stock matériel entre les trois états',
  })
  updateEquipmentDistribution(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEquipmentDistributionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.equipmentStockService.updateDistribution(id, dto, req.user);
  }

  @Get('equipment-stock/:id/movements')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: "Consulter l'historique des mouvements d'un stock matériel",
  })
  findEquipmentStockHistory(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.equipmentStockService.findStockHistory(id, req.user);
  }

  // CATALOGUE DU MATÉRIEL
  @Post('equipment')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: 'Ajouter un matériel au catalogue commun',
  })
  createEquipment(@Body() dto: CreateInventoryEquipmentDto) {
    return this.physicalInventoryService.createEquipment(dto);
  }

  // RÉFÉRENCES DU MATÉRIEL PAR BANDE

  @Get('bands/:bandId/equipment')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({
    summary: 'Consulter les références du matériel pour une bande',
  })
  findBandEquipment(
    @Param('bandId', ParseIntPipe) bandId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.physicalInventoryService.findBandEquipment(bandId, req.user);
  }

  @Post('bands/:bandId/equipment/:equipmentId/reference')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Définir ou modifier la quantité de référence d’un matériel pour une bande',
  })
  setBandEquipmentReference(
    @Param('bandId', ParseIntPipe) bandId: number,
    @Param('equipmentId', ParseIntPipe) equipmentId: number,
    @Body() dto: SetBandEquipmentReferenceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.physicalInventoryService.setBandEquipmentReference(
      bandId,
      equipmentId,
      dto,
      req.user,
    );
  }

  @Get('equipment')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Consulter le catalogue du matériel' })
  findAllEquipment() {
    return this.physicalInventoryService.findAllEquipment();
  }

  @Patch('equipment/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Modifier un matériel du catalogue' })
  updateEquipment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateInventoryEquipmentDto>,
  ) {
    return this.physicalInventoryService.updateEquipment(id, dto);
  }

  @Delete('physical/:id')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Supprimer un brouillon autorisé' })
  deletePhysicalInventory(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.physicalInventoryService.deleteInventory(id, req.user);
  }
}
