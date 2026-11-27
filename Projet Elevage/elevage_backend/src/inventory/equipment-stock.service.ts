import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

import { User, UserRole } from '../users/entities/user.entity.js';
import { Farm } from '../farms/entities/farm.entity.js';
import { Band } from '../bands/entities/band.entity.js';

import { InventoryEquipment } from './entities/inventory-equipment.entity.js';
import { FarmEquipmentStock } from './entities/farm-equipment-stock.entity.js';
import {
  EquipmentStockMovement,
  EquipmentStockMovementType,
} from './entities/equipment-stock-movement.entity.js';

import { CreateEquipmentDeliveryDto } from './dto/create-equipment-delivery.dto.js';
import { UpdateEquipmentDistributionDto } from './dto/update-equipment-distribution.dto.js';

interface AuthenticatedUser {
  id: number;
  role: UserRole;
}

@Injectable()
export class EquipmentStockService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Convertit une quantité décimale en centièmes
   * pour éviter les erreurs de comparaison des nombres décimaux.
   */
  private toCents(value: number): number {
    return Math.round(Number(value) * 100);
  }

  /**
   * Détermine la ferme à laquelle appartient un employé
   * à partir de ses bandes affectées.
   */
  private async getEmployeeFarmId(userId: number): Promise<number> {
    const bandRepository = this.dataSource.getRepository(Band);

    const rows = await bandRepository
      .createQueryBuilder('band')
      .innerJoin('band.employees', 'employee')
      .innerJoin('band.farm', 'farm')
      .select('DISTINCT farm.id', 'farmId')
      .where('employee.id = :userId', { userId })
      .getRawMany<{ farmId: number }>();

    if (rows.length === 0) {
      throw new ForbiddenException(
        "Aucune ferme n'est associée aux bandes de cet employé.",
      );
    }

    if (rows.length > 1) {
      throw new ForbiddenException(
        'Cet employé est associé à plusieurs fermes. Contactez un administrateur.',
      );
    }

    return Number(rows[0].farmId);
  }

  /**
   * ADMIN : farmId obligatoire.
   * EMPLOYEE : ferme déterminée automatiquement.
   */
  private async getAuthorizedFarmId(
    user: AuthenticatedUser,
    requestedFarmId?: number,
  ): Promise<number> {
    if (user.role === UserRole.ADMIN) {
      if (!requestedFarmId || requestedFarmId < 1) {
        throw new BadRequestException(
          'Un identifiant de ferme valide est obligatoire.',
        );
      }

      return requestedFarmId;
    }

    if (user.role === UserRole.EMPLOYEE) {
      const employeeFarmId = await this.getEmployeeFarmId(user.id);

      if (
        requestedFarmId !== undefined &&
        Number(requestedFarmId) !== employeeFarmId
      ) {
        throw new ForbiddenException(
          "Vous ne pouvez pas accéder au stock d'une autre ferme.",
        );
      }

      return employeeFarmId;
    }

    throw new ForbiddenException('Accès non autorisé.');
  }

  /**
   * Vérifie que les trois états correspondent exactement
   * à la quantité totale.
   */
  private validateDistribution(
    total: number,
    bonEtat: number,
    endommage: number,
    horsService: number,
  ): void {
    const values = [total, bonEtat, endommage, horsService];

    if (values.some((value) => !Number.isFinite(Number(value)))) {
      throw new BadRequestException('Les quantités doivent être numériques.');
    }

    if (values.some((value) => Number(value) < 0)) {
      throw new BadRequestException(
        'Les quantités ne peuvent pas être négatives.',
      );
    }

    const totalCents = this.toCents(total);
    const distributedCents =
      this.toCents(bonEtat) +
      this.toCents(endommage) +
      this.toCents(horsService);

    if (totalCents !== distributedCents) {
      throw new BadRequestException(
        'La somme des quantités en bon état, endommagées et hors service doit être égale à la quantité totale.',
      );
    }
  }

  /**
   * Crée un approvisionnement matériel.
   *
   * La quantité reçue est ajoutée :
   * - à la quantité totale ;
   * - à la quantité en bon état.
   *
   * Le stock et son mouvement sont enregistrés ensemble.
   */
  async createDelivery(
    dto: CreateEquipmentDeliveryDto,
    user: AuthenticatedUser,
  ) {
    if (!Number.isFinite(Number(dto.quantite)) || Number(dto.quantite) <= 0) {
      throw new BadRequestException(
        "La quantité d'approvisionnement doit être supérieure à zéro.",
      );
    }

    const farmId = await this.getAuthorizedFarmId(user, dto.farmId);
    const quantityCents = this.toCents(dto.quantite);

    if (quantityCents <= 0) {
      throw new BadRequestException('La quantité est trop petite.');
    }

    return this.dataSource.transaction(async (manager) => {
      const farmRepository = manager.getRepository(Farm);
      const equipmentRepository = manager.getRepository(InventoryEquipment);
      const stockRepository = manager.getRepository(FarmEquipmentStock);
      const movementRepository = manager.getRepository(EquipmentStockMovement);

      // Verrouiller la ferme évite deux créations concurrentes
      // du même stock pour cette ferme.
      const farm = await farmRepository.findOne({
        where: { id: farmId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!farm) {
        throw new NotFoundException('Ferme introuvable.');
      }

      const equipment = await equipmentRepository.findOne({
        where: { id: dto.equipmentId },
      });

      if (!equipment) {
        throw new NotFoundException('Matériel introuvable.');
      }

      if (!equipment.actif) {
        throw new BadRequestException(
          'Ce matériel est désactivé dans le catalogue.',
        );
      }

      let stock = await stockRepository.findOne({
        where: {
          farm: { id: farmId },
          equipment: { id: equipment.id },
        },
        lock: { mode: 'pessimistic_write' },
      });

      const isNewStock = !stock;

      if (!stock) {
        stock = stockRepository.create({
          farm,
          equipment,
          quantite_totale: 0,
          bon_etat: 0,
          endommage: 0,
          hors_service: 0,
        });
      }

      const totalAvant = Number(stock.quantite_totale);
      const bonAvant = Number(stock.bon_etat);
      const endommageAvant = Number(stock.endommage);
      const horsServiceAvant = Number(stock.hors_service);

      const totalApres = (this.toCents(totalAvant) + quantityCents) / 100;
      const bonApres = (this.toCents(bonAvant) + quantityCents) / 100;

      this.validateDistribution(
        totalApres,
        bonApres,
        endommageAvant,
        horsServiceAvant,
      );

      stock.quantite_totale = totalApres;
      stock.bon_etat = bonApres;

      const savedStock = await stockRepository.save(stock);

      const movement = movementRepository.create({
        stock: savedStock,
        createdBy: { id: user.id } as User,
        type: EquipmentStockMovementType.APPROVISIONNEMENT,
        quantite_totale_avant: totalAvant,
        quantite_totale_apres: totalApres,
        bon_etat_avant: bonAvant,
        bon_etat_apres: bonApres,
        endommage_avant: endommageAvant,
        endommage_apres: endommageAvant,
        hors_service_avant: horsServiceAvant,
        hors_service_apres: horsServiceAvant,
        observations: dto.observations?.trim() || null,
      });

      await movementRepository.save(movement);

      return {
        message: 'Approvisionnement matériel enregistré avec succès.',
        stock: savedStock,
        movement,
      };
    });
  }

  /**
   * Modifie la répartition des quantités entre les trois états.
   * La quantité totale reste inchangée.
   */
  async updateDistribution(
    stockId: number,
    dto: UpdateEquipmentDistributionDto,
    user: AuthenticatedUser,
  ) {
    const requestedStock = await this.dataSource
      .getRepository(FarmEquipmentStock)
      .findOne({
        where: { id: stockId },
        relations: { farm: true },
      });

    if (!requestedStock) {
      throw new NotFoundException('Stock matériel introuvable.');
    }

    const farmId = await this.getAuthorizedFarmId(user, requestedStock.farm.id);

    return this.dataSource.transaction(async (manager) => {
      const farmRepository = manager.getRepository(Farm);
      const stockRepository = manager.getRepository(FarmEquipmentStock);
      const movementRepository = manager.getRepository(EquipmentStockMovement);

      // Même verrou que pour les approvisionnements.
      const farm = await farmRepository.findOne({
        where: { id: farmId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!farm) {
        throw new NotFoundException('Ferme introuvable.');
      }

      const stock = await stockRepository.findOne({
        where: { id: stockId },
        relations: { farm: true, equipment: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!stock || stock.farm.id !== farmId) {
        throw new NotFoundException('Stock matériel introuvable.');
      }

      const total = Number(stock.quantite_totale);
      const bonAvant = Number(stock.bon_etat);
      const endommageAvant = Number(stock.endommage);
      const horsServiceAvant = Number(stock.hors_service);

      this.validateDistribution(
        total,
        dto.bon_etat,
        dto.endommage,
        dto.hors_service,
      );

      stock.bon_etat = Number(dto.bon_etat);
      stock.endommage = Number(dto.endommage);
      stock.hors_service = Number(dto.hors_service);

      const savedStock = await stockRepository.save(stock);

      const movement = movementRepository.create({
        stock: savedStock,
        createdBy: { id: user.id } as User,
        type: EquipmentStockMovementType.REPARTITION,
        quantite_totale_avant: total,
        quantite_totale_apres: total,
        bon_etat_avant: bonAvant,
        bon_etat_apres: stock.bon_etat,
        endommage_avant: endommageAvant,
        endommage_apres: stock.endommage,
        hors_service_avant: horsServiceAvant,
        hors_service_apres: stock.hors_service,
        observations: dto.observations?.trim() || null,
      });

      await movementRepository.save(movement);

      return {
        message: 'Répartition du stock matériel mise à jour avec succès.',
        stock: savedStock,
        movement,
      };
    });
  }

  /**
   * Liste les stocks :
   * - ADMIN : toutes les fermes ;
   * - EMPLOYEE : uniquement sa ferme.
   */
  async findAllStocks(user: AuthenticatedUser) {
    const query = this.dataSource
      .getRepository(FarmEquipmentStock)
      .createQueryBuilder('stock')
      .innerJoinAndSelect('stock.farm', 'farm')
      .innerJoinAndSelect('stock.equipment', 'equipment')
      .select([
        'stock.id',
        'stock.quantite_totale',
        'stock.bon_etat',
        'stock.endommage',
        'stock.hors_service',
        'stock.cree_le',
        'stock.modifier_le',
        'farm.id',
        'farm.nom',
        'equipment.id',
        'equipment.designation',
        'equipment.unite',
      ])
      .orderBy('farm.nom', 'ASC')
      .addOrderBy('equipment.designation', 'ASC');

    if (user.role === UserRole.EMPLOYEE) {
      const farmId = await this.getEmployeeFarmId(user.id);
      query.andWhere('farm.id = :farmId', { farmId });
    } else if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Accès non autorisé.');
    }

    return query.getMany();
  }

  /**
   * Consulte l'historique d'un stock.
   */
  async findStockHistory(stockId: number, user: AuthenticatedUser) {
    const stock = await this.dataSource
      .getRepository(FarmEquipmentStock)
      .findOne({
        where: { id: stockId },
        relations: { farm: true },
      });

    if (!stock) {
      throw new NotFoundException('Stock matériel introuvable.');
    }

    const farmId = await this.getAuthorizedFarmId(user, stock.farm.id);

    return this.dataSource
      .getRepository(EquipmentStockMovement)
      .createQueryBuilder('movement')
      .innerJoin('movement.stock', 'stock')
      .leftJoin('movement.createdBy', 'createdBy')
      .select([
        'movement.id',
        'movement.type',
        'movement.quantite_totale_avant',
        'movement.quantite_totale_apres',
        'movement.bon_etat_avant',
        'movement.bon_etat_apres',
        'movement.endommage_avant',
        'movement.endommage_apres',
        'movement.hors_service_avant',
        'movement.hors_service_apres',
        'movement.observations',
        'movement.cree_le',
        'createdBy.id',
        'createdBy.nom',
      ])
      .where('stock.id = :stockId', { stockId })
      .andWhere('farm.id = :farmId', { farmId })
      .orderBy('movement.cree_le', 'DESC')
      .innerJoin('stock.farm', 'farm')
      .getMany();
  }
}
