import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InventoryController } from './inventory.controller.js';
import { InventoryService } from './inventory.service.js';
import { PhysicalInventoryService } from './physical-inventory.service.js';

import { FeedDeliveryEntity } from './entities/feed-delivery.entity.js';
import { BandRecord } from '../band-records/entities/band-record.entity.js';
import { Band } from '../bands/entities/band.entity.js';
import { Farm } from '../farms/entities/farm.entity.js';
import { EquipmentStockService } from './equipment-stock.service.js';

import { PhysicalInventory } from './entities/physical-inventory.entity.js';
import { PhysicalInventoryItem } from './entities/physical-inventory-item.entity.js';
import { InventoryEquipment } from './entities/inventory-equipment.entity.js';
import { BandEquipment } from './entities/band-equipment.entity.js';
import { FarmEquipmentStock } from './entities/farm-equipment-stock.entity.js';
import { EquipmentStockMovement } from './entities/equipment-stock-movement.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeedDeliveryEntity,
      BandRecord,
      Band,
      Farm,
      PhysicalInventory,
      PhysicalInventoryItem,
      InventoryEquipment,
      BandEquipment,
      FarmEquipmentStock,
      EquipmentStockMovement,
    ]),
  ],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    PhysicalInventoryService,
    EquipmentStockService,
  ],
  exports: [InventoryService, PhysicalInventoryService, EquipmentStockService],
})
export class InventoryModule {}
