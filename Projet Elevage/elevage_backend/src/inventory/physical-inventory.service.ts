import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';

import { PhysicalInventory } from './entities/physical-inventory.entity.js';
import { PhysicalInventoryStatus } from './entities/physical-inventory.entity.js';

import {
  PhysicalInventoryItem,
  PhysicalInventoryItemType,
  EquipmentCondition,
} from './entities/physical-inventory-item.entity.js';

import { InventoryEquipment } from './entities/inventory-equipment.entity.js';
import { FeedDeliveryEntity } from './entities/feed-delivery.entity.js';
import { BandRecord } from '../band-records/entities/band-record.entity.js';
import { User, UserRole } from '../users/entities/user.entity.js';
import { Band } from '../bands/entities/band.entity.js';

import { CreatePhysicalInventoryDto } from './dto/create-physical-inventory.dto.js';
import { CreatePhysicalInventoryItemDto } from './dto/create-physical-inventory-item.dto.js';
import { CreateInventoryEquipmentDto } from './dto/create-inventory-equipment.dto.js';
import { BandEquipment } from './entities/band-equipment.entity.js';
import { SetBandEquipmentReferenceDto } from './dto/set-band-equipment-reference.dto.js';

interface AuthenticatedUser {
  id: number;
  role: UserRole;
}

@Injectable()
export class PhysicalInventoryService {
  constructor(
    @InjectRepository(PhysicalInventory)
    private readonly inventoryRepository: Repository<PhysicalInventory>,

    @InjectRepository(PhysicalInventoryItem)
    private readonly itemRepository: Repository<PhysicalInventoryItem>,

    @InjectRepository(InventoryEquipment)
    private readonly equipmentRepository: Repository<InventoryEquipment>,

    @InjectRepository(FeedDeliveryEntity)
    private readonly deliveryRepository: Repository<FeedDeliveryEntity>,

    @InjectRepository(BandRecord)
    private readonly bandRecordRepository: Repository<BandRecord>,

    @InjectRepository(Band)
    private readonly bandRepository: Repository<Band>,

    @InjectRepository(BandEquipment)
    private readonly bandEquipmentRepository: Repository<BandEquipment>,
  ) {}

  // Vérifier qu'un utilisateur peut accéder à une bande
  private async getAccessibleBand(
    bandId: number,
    user: AuthenticatedUser,
  ): Promise<Band> {
    const band = await this.bandRepository.findOne({
      where: { id: bandId },
      relations: {
        employees: true,
        farm: true,
      },
    });

    if (!band) {
      throw new NotFoundException('Bande introuvable.');
    }

    if (user.role === UserRole.ADMIN) {
      return band;
    }

    if (user.role !== UserRole.EMPLOYEE) {
      throw new ForbiddenException('Accès non autorisé.');
    }

    const isAssigned = band.employees?.some(
      (employee) => employee.id === user.id,
    );

    if (!isAssigned) {
      throw new NotFoundException('Bande introuvable.');
    }

    return band;
  }

  // Vérifier qu'un utilisateur peut accéder à un inventaire
  private async getAccessibleInventory(
    id: number,
    user: AuthenticatedUser,
  ): Promise<PhysicalInventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: {
        createdBy: true,
        items: true,
        band: {
          farm: true,
        },
      },
    });

    if (!inventory) {
      throw new NotFoundException('Inventaire introuvable.');
    }

    if (user.role === UserRole.ADMIN) {
      return inventory;
    }

    if (user.role !== UserRole.EMPLOYEE) {
      throw new ForbiddenException('Accès non autorisé.');
    }

    // Un ancien inventaire sans bande n'est pas accessible à l'employé.
    if (!inventory.band || inventory.createdBy.id !== user.id) {
      throw new NotFoundException('Inventaire introuvable.');
    }

    // Vérifier que l'employé est toujours affecté à cette bande.
    await this.getAccessibleBand(inventory.band.id, user);

    return inventory;
  }

  // Normaliser les codes alimentaires
  private normalizeFeedCode(code: string): string {
    return code
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, ' ')
      .toUpperCase();
  }

  // Créer un inventaire physique
  async createInventory(
    dto: CreatePhysicalInventoryDto,
    user: AuthenticatedUser,
  ) {
    const band = await this.getAccessibleBand(dto.bandId, user);

    const inventory = this.inventoryRepository.create({
      date_inventaire: dto.date_inventaire,
      observations: dto.observations?.trim() || null,
      statut: PhysicalInventoryStatus.BROUILLON,
      createdBy: { id: user.id } as User,
      band,
    });

    return this.inventoryRepository.save(inventory);
  }

  // Calculer le stock théorique d'un aliment
  private async getFeedTheoreticalStock(
    codeAliment: string,
    dateInventaire: string,
  ): Promise<number> {
    const normalizedCode = this.normalizeFeedCode(codeAliment);

    if (!normalizedCode) {
      throw new BadRequestException('Le code alimentaire est obligatoire.');
    }

    const deliveries = await this.deliveryRepository.find({
      where: {
        date_reception: LessThanOrEqual(dateInventaire),
      },
    });

    const records = await this.bandRecordRepository.find({
      where: {
        date_releve: LessThanOrEqual(dateInventaire),
      },
    });

    const totalReceived = deliveries
      .filter(
        (delivery) =>
          this.normalizeFeedCode(delivery.code_aliment) === normalizedCode,
      )
      .reduce(
        (total, delivery) => total + Number(delivery.nombre_sacs || 0),
        0,
      );

    const totalConsumed = records
      .filter(
        (record) =>
          this.normalizeFeedCode(record.code_aliment || '') === normalizedCode,
      )
      .reduce((total, record) => total + Number(record.nombre_sacs || 0), 0);

    return Math.round((totalReceived - totalConsumed) * 100) / 100;
  }

  // Calculer la production totale d'alvéoles jusqu'à la date
  private async getEggProduction(dateInventaire: string): Promise<number> {
    const records = await this.bandRecordRepository.find({
      where: {
        date_releve: LessThanOrEqual(dateInventaire),
      },
    });

    return (
      Math.round(
        records.reduce(
          (total, record) => total + Number(record.alveoles_collectees || 0),
          0,
        ) * 100,
      ) / 100
    );
  }

  // Calculer la quantité théorique selon le type
  private async getTheoreticalQuantity(
    dto: CreatePhysicalInventoryItemDto,
    dateInventaire: string,
    bandId: number | null,
  ): Promise<{
    quantity: number;
    unit: string;
    designation: string;
  }> {
    if (dto.type === PhysicalInventoryItemType.ALIMENT) {
      const code = dto.designation.trim();

      return {
        quantity: await this.getFeedTheoreticalStock(code, dateInventaire),
        unit: 'sacs',
        designation: code,
      };
    }

    if (dto.type === PhysicalInventoryItemType.OEUF) {
      return {
        quantity: await this.getEggProduction(dateInventaire),
        unit: 'alvéoles',
        designation: 'Production totale d’œufs',
      };
    }

    if (!bandId) {
      throw new BadRequestException(
        'Impossible de calculer le matériel : cet inventaire ne possède pas de bande.',
      );
    }

    const equipment = await this.equipmentRepository.findOne({
      where: {
        designation: dto.designation.trim(),
        actif: true,
      },
    });

    if (!equipment) {
      throw new NotFoundException(
        `Matériel "${dto.designation}" introuvable dans le catalogue.`,
      );
    }

    if (!dto.etat_materiel) {
      throw new BadRequestException('Veuillez préciser l’état du matériel.');
    }

    const bandEquipment = await this.bandEquipmentRepository.findOne({
      where: {
        band: { id: bandId },
        equipment: { id: equipment.id },
      },
      relations: {
        equipment: true,
      },
    });

    if (!bandEquipment) {
      throw new BadRequestException(
        `Aucune quantité de référence configurée pour "${equipment.designation}" dans cette bande.`,
      );
    }

    return {
      quantity: Number(bandEquipment.quantite_reference),
      unit: equipment.unite,
      designation: equipment.designation,
    };
  }

  // Ajouter un élément à un inventaire
  async addItem(
    inventoryId: number,
    dto: CreatePhysicalInventoryItemDto,
    user: AuthenticatedUser,
  ) {
    const inventory = await this.getAccessibleInventory(inventoryId, user);

    if (inventory.statut !== PhysicalInventoryStatus.BROUILLON) {
      throw new BadRequestException(
        'Cet inventaire est déjà terminé et ne peut plus être modifié.',
      );
    }

    if (
      dto.type === PhysicalInventoryItemType.MATERIEL &&
      !Object.values(EquipmentCondition).includes(dto.etat_materiel!)
    ) {
      throw new BadRequestException('État du matériel invalide.');
    }

    const theoretical = await this.getTheoreticalQuantity(
      dto,
      inventory.date_inventaire,
      inventory.band?.id ?? null,
    );

    const physicalQuantity = Number(dto.quantite_physique);

    if (!Number.isFinite(physicalQuantity) || physicalQuantity < 0) {
      throw new BadRequestException(
        'La quantité physique doit être positive ou égale à zéro.',
      );
    }

    const difference =
      Math.round((physicalQuantity - theoretical.quantity) * 100) / 100;

    const item = this.itemRepository.create({
      type: dto.type,
      designation: theoretical.designation,
      quantite_theorique: theoretical.quantity,
      quantite_physique: physicalQuantity,
      ecart: difference,
      unite: theoretical.unit,
      etat_materiel:
        dto.type === PhysicalInventoryItemType.MATERIEL
          ? dto.etat_materiel!
          : null,
      observations: dto.observations?.trim() || null,
      inventory,
    });

    return this.itemRepository.save(item);
  }

  // Terminer un inventaire physique
  async completeInventory(id: number, user: AuthenticatedUser) {
    const inventory = await this.getAccessibleInventory(id, user);

    if (inventory.statut !== PhysicalInventoryStatus.BROUILLON) {
      throw new BadRequestException('Cet inventaire est déjà terminé.');
    }

    if (!inventory.items || inventory.items.length === 0) {
      throw new BadRequestException(
        'Ajoutez au moins un élément avant de terminer l’inventaire.',
      );
    }

    inventory.statut = PhysicalInventoryStatus.TERMINE;

    return this.inventoryRepository.save(inventory);
  }

  // Consulter les inventaires
  async findAll(user: AuthenticatedUser) {
    const query = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.createdBy', 'createdBy')
      .leftJoinAndSelect('inventory.items', 'items')
      .leftJoinAndSelect('inventory.band', 'band')
      .leftJoinAndSelect('band.farm', 'farm')
      .orderBy('inventory.date_inventaire', 'DESC')
      .addOrderBy('inventory.id', 'DESC')
      .distinct(true);

    if (user.role === UserRole.ADMIN) {
      return query.getMany();
    }

    if (user.role !== UserRole.EMPLOYEE) {
      throw new ForbiddenException('Accès non autorisé.');
    }

    query
      .innerJoin('band.employees', 'employee')
      .where('createdBy.id = :userId', {
        userId: user.id,
      })
      .andWhere('employee.id = :userId', {
        userId: user.id,
      })
      .andWhere('band.id IS NOT NULL');

    return query.getMany();
  }

  // Consulter un inventaire
  async findOne(id: number, user: AuthenticatedUser) {
    return this.getAccessibleInventory(id, user);
  }

  // Ajouter un matériel au catalogue
  async createEquipment(dto: CreateInventoryEquipmentDto) {
    const designation = dto.designation.trim();

    if (!designation) {
      throw new BadRequestException(
        'La désignation du matériel est obligatoire.',
      );
    }

    const existing = await this.equipmentRepository.findOne({
      where: { designation },
    });

    if (existing) {
      throw new BadRequestException(
        'Ce matériel existe déjà dans le catalogue.',
      );
    }

    const equipment = this.equipmentRepository.create({
      designation,
      description: dto.description?.trim() || null,
      unite: dto.unite?.trim() || 'unité',
      quantite_reference: dto.quantite_reference,
      actif: dto.actif ?? true,
    });

    return this.equipmentRepository.save(equipment);
  }

  // Consulter le catalogue du matériel
  async findAllEquipment() {
    return this.equipmentRepository.find({
      order: {
        designation: 'ASC',
      },
    });
  }

  // Modifier un matériel
  async updateEquipment(id: number, dto: Partial<CreateInventoryEquipmentDto>) {
    const equipment = await this.equipmentRepository.findOne({
      where: { id },
    });

    if (!equipment) {
      throw new NotFoundException('Matériel introuvable dans le catalogue.');
    }

    if (dto.designation !== undefined) {
      const designation = dto.designation.trim();

      if (!designation) {
        throw new BadRequestException(
          'La désignation du matériel est obligatoire.',
        );
      }

      const duplicate = await this.equipmentRepository.findOne({
        where: { designation },
      });

      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException('Cette désignation est déjà utilisée.');
      }

      equipment.designation = designation;
    }

    if (dto.description !== undefined) {
      equipment.description = dto.description.trim() || null;
    }

    if (dto.unite !== undefined) {
      equipment.unite = dto.unite.trim() || 'unité';
    }

    if (dto.quantite_reference !== undefined) {
      if (
        !Number.isFinite(Number(dto.quantite_reference)) ||
        Number(dto.quantite_reference) < 0
      ) {
        throw new BadRequestException(
          'La quantité de référence doit être positive ou égale à zéro.',
        );
      }

      equipment.quantite_reference = dto.quantite_reference;
    }

    if (dto.actif !== undefined) {
      equipment.actif = dto.actif;
    }

    return this.equipmentRepository.save(equipment);
  }

  // Consulter les références de matériel d'une bande
  async findBandEquipment(bandId: number, user: AuthenticatedUser) {
    await this.getAccessibleBand(bandId, user);

    const references = await this.bandEquipmentRepository.find({
      where: {
        band: { id: bandId },
        equipment: { actif: true },
      },
      relations: {
        equipment: true,
        band: true,
      },
      order: {
        equipment: {
          designation: 'ASC',
        },
      },
    });

    return references.map((reference) => ({
      id: reference.id,
      bandId,
      equipmentId: reference.equipment.id,
      designation: reference.equipment.designation,
      description: reference.equipment.description,
      unite: reference.equipment.unite,
      quantite_reference: Number(reference.quantite_reference),
      actif: reference.equipment.actif,
    }));
  }

  // Définir ou modifier la référence d'un matériel pour une bande
  async setBandEquipmentReference(
    bandId: number,
    equipmentId: number,
    dto: SetBandEquipmentReferenceDto,
    user: AuthenticatedUser,
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Seul un administrateur peut modifier les références du matériel.',
      );
    }

    const band = await this.bandRepository.findOne({
      where: { id: bandId },
    });

    if (!band) {
      throw new NotFoundException('Bande introuvable.');
    }

    const equipment = await this.equipmentRepository.findOne({
      where: {
        id: equipmentId,
        actif: true,
      },
    });

    if (!equipment) {
      throw new NotFoundException('Matériel introuvable ou désactivé.');
    }

    const quantity = Number(dto.quantite_reference);

    if (
      !Number.isFinite(quantity) ||
      quantity < 0 ||
      Math.round(quantity * 100) / 100 !== quantity
    ) {
      throw new BadRequestException(
        'La quantité de référence doit être positive ou égale à zéro et comporter au maximum deux décimales.',
      );
    }

    let reference = await this.bandEquipmentRepository.findOne({
      where: {
        band: { id: bandId },
        equipment: { id: equipmentId },
      },
    });

    if (!reference) {
      reference = this.bandEquipmentRepository.create({
        band,
        equipment,
        quantite_reference: quantity,
      });
    } else {
      reference.quantite_reference = quantity;
    }

    const saved = await this.bandEquipmentRepository.save(reference);

    return {
      message: 'Quantité de référence enregistrée avec succès.',
      id: saved.id,
      bandId,
      equipmentId,
      designation: equipment.designation,
      unite: equipment.unite,
      quantite_reference: Number(saved.quantite_reference),
    };
  }

  // Supprimer un inventaire physique en brouillon
  async deleteInventory(id: number, user: AuthenticatedUser) {
    const inventory = await this.getAccessibleInventory(id, user);

    if (inventory.statut !== PhysicalInventoryStatus.BROUILLON) {
      throw new BadRequestException(
        'Impossible de supprimer un inventaire déjà terminé.',
      );
    }

    await this.inventoryRepository.remove(inventory);

    return {
      message: 'Inventaire physique supprimé avec succès.',
      id,
    };
  }
}
