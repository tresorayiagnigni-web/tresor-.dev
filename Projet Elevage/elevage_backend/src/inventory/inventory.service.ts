import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FeedDeliveryEntity } from './entities/feed-delivery.entity.js';
import { BandRecord } from '../band-records/entities/band-record.entity.js';
import { Band } from '../bands/entities/band.entity.js';
import { Farm } from '../farms/entities/farm.entity.js';
import { User, UserRole } from '../users/entities/user.entity.js';

import { CreateFeedDeliveryDto } from './dto/create-feed-delivery.dto.js';

interface AuthenticatedUser {
  id: number;
  role: UserRole;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(FeedDeliveryEntity)
    private readonly deliveryRepository: Repository<FeedDeliveryEntity>,

    @InjectRepository(BandRecord)
    private readonly bandRecordRepository: Repository<BandRecord>,

    @InjectRepository(Band)
    private readonly bandRepository: Repository<Band>,

    @InjectRepository(Farm)
    private readonly farmRepository: Repository<Farm>,
  ) {}

  // --------------------------------------------------
  // RÉCUPÉRER LA FERME AUTORISÉE D'UN EMPLOYÉ
  // --------------------------------------------------

  private async getEmployeeFarmId(userId: number): Promise<number> {
    const rows = await this.bandRepository
      .createQueryBuilder('band')
      .innerJoin('band.employees', 'employee')
      .innerJoin('band.farm', 'farm')
      .select('farm.id', 'farmId')
      .where('employee.id = :userId', { userId })
      .distinct(true)
      .getRawMany<{ farmId: number | string }>();

    const farmIds = [...new Set(rows.map((row) => Number(row.farmId)))];

    if (farmIds.length === 0) {
      throw new ForbiddenException(
        'Vous devez être affecté à une bande pour accéder au stock alimentaire.',
      );
    }

    if (farmIds.length > 1) {
      throw new ForbiddenException(
        'Vos bandes sont associées à plusieurs fermes. Contactez un administrateur.',
      );
    }

    return farmIds[0];
  }

  // --------------------------------------------------
  // VÉRIFIER LA FERME AUTORISÉE
  // --------------------------------------------------

  private async getAuthorizedFarmId(
    user: AuthenticatedUser,
    requestedFarmId?: number,
  ): Promise<number> {
    if (user.role === UserRole.ADMIN) {
      if (!requestedFarmId || !Number.isInteger(requestedFarmId)) {
        throw new BadRequestException(
          'Veuillez sélectionner une ferme valide.',
        );
      }

      const farm = await this.farmRepository.findOneBy({
        id: requestedFarmId,
      });

      if (!farm) {
        throw new NotFoundException('Ferme introuvable.');
      }

      return farm.id;
    }

    if (user.role === UserRole.EMPLOYEE) {
      const employeeFarmId = await this.getEmployeeFarmId(user.id);

      if (
        requestedFarmId !== undefined &&
        Number(requestedFarmId) !== employeeFarmId
      ) {
        throw new ForbiddenException(
          'Vous ne pouvez pas effectuer cette opération dans une autre ferme.',
        );
      }

      return employeeFarmId;
    }

    throw new ForbiddenException('Accès non autorisé.');
  }

  // --------------------------------------------------
  // CRÉER UN APPROVISIONNEMENT ALIMENTAIRE
  // --------------------------------------------------

  async createDelivery(dto: CreateFeedDeliveryDto, user: AuthenticatedUser) {
    const quantiteTonnes = Number(dto.quantite_tonnes);

    if (!Number.isFinite(quantiteTonnes) || quantiteTonnes <= 0) {
      throw new BadRequestException(
        'La quantité en tonnes doit être supérieure à zéro.',
      );
    }

    if (!dto.code_aliment?.trim()) {
      throw new BadRequestException('Le code alimentaire est obligatoire.');
    }

    const farmId = await this.getAuthorizedFarmId(user, dto.farmId);

    // 1 tonne = 20 sacs
    const nombreSacs = Math.round(quantiteTonnes * 20 * 100) / 100;

    const delivery = this.deliveryRepository.create({
      code_aliment: dto.code_aliment.trim(),
      date_reception: dto.date_reception,
      quantite_tonnes: quantiteTonnes,
      nombre_sacs: nombreSacs,
      fournisseur: dto.fournisseur?.trim() || null,
      observations: dto.observations?.trim() || null,
      farm: { id: farmId } as Farm,
      createdBy: { id: user.id } as User,
    });

    return this.deliveryRepository.save(delivery);
  }

  // --------------------------------------------------
  // HISTORIQUE DES APPROVISIONNEMENTS
  // --------------------------------------------------

  async findAllDeliveries(user: AuthenticatedUser) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.EMPLOYEE) {
      throw new ForbiddenException('Accès non autorisé.');
    }

    const query = this.deliveryRepository
      .createQueryBuilder('delivery')
      .leftJoin('delivery.farm', 'farm')
      .leftJoin('delivery.createdBy', 'createdBy')
      .select([
        'delivery.id',
        'delivery.code_aliment',
        'delivery.date_reception',
        'delivery.quantite_tonnes',
        'delivery.nombre_sacs',
        'delivery.fournisseur',
        'delivery.observations',
        'delivery.cree_le',
        'farm.id',
        'farm.nom',
        'createdBy.id',
        'createdBy.nom',
      ]);

    if (user.role === UserRole.EMPLOYEE) {
      const farmId = await this.getAuthorizedFarmId(user);

      query.where('farm.id = :farmId', { farmId });
    }

    return query
      .orderBy('delivery.date_reception', 'DESC')
      .addOrderBy('delivery.id', 'DESC')
      .getMany();
  }

  // --------------------------------------------------
  // NORMALISER UN CODE ALIMENTAIRE
  // --------------------------------------------------

  private normalizeFeedCode(code: string): string {
    return code
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, ' ')
      .toUpperCase();
  }

  // --------------------------------------------------
  // CALCULER LE STOCK ALIMENTAIRE PAR FERME
  // --------------------------------------------------

  async getStockSummary(user: AuthenticatedUser) {
    let farmId: number | undefined;

    if (user.role === UserRole.EMPLOYEE) {
      farmId = await this.getAuthorizedFarmId(user);
    } else if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Accès non autorisé.');
    }

    const deliveryQuery = this.deliveryRepository
      .createQueryBuilder('delivery')
      .leftJoinAndSelect('delivery.farm', 'farm');

    if (farmId !== undefined) {
      deliveryQuery.where('farm.id = :farmId', { farmId });
    }

    const deliveries = await deliveryQuery.getMany();

    const consumptionQuery = this.bandRecordRepository
      .createQueryBuilder('record')
      .innerJoinAndSelect('record.band', 'band')
      .innerJoinAndSelect('band.farm', 'farm');

    if (farmId !== undefined) {
      consumptionQuery.where('farm.id = :farmId', { farmId });
    }

    const consumptions = await consumptionQuery.getMany();

    type StockValues = {
      total_recu: number;
      total_consomme: number;
      consommation_sans_code: number;
    };

    type FarmStock = {
      id: number;
      nom: string;
      stocks: Map<string, StockValues>;
    };

    const farmStocks = new Map<number, FarmStock>();

    const getFarmStock = (id: number, nom: string): FarmStock => {
      let entry = farmStocks.get(id);

      if (!entry) {
        entry = {
          id,
          nom,
          stocks: new Map<string, StockValues>(),
        };

        farmStocks.set(id, entry);
      }

      return entry;
    };

    const getCodeStock = (farm: FarmStock, code: string): StockValues => {
      let values = farm.stocks.get(code);

      if (!values) {
        values = {
          total_recu: 0,
          total_consomme: 0,
          consommation_sans_code: 0,
        };

        farm.stocks.set(code, values);
      }

      return values;
    };

    // Additionner les approvisionnements de chaque ferme.
    for (const delivery of deliveries) {
      if (!delivery.farm) {
        continue;
      }

      const farm = getFarmStock(delivery.farm.id, delivery.farm.nom);

      const code = this.normalizeFeedCode(delivery.code_aliment || '');

      if (!code) {
        continue;
      }

      const values = getCodeStock(farm, code);

      values.total_recu += Number(delivery.nombre_sacs) || 0;
    }

    // Additionner les consommations de chaque ferme.
    for (const record of consumptions) {
      const recordFarm = record.band?.farm;

      if (!recordFarm) {
        continue;
      }

      const farm = getFarmStock(recordFarm.id, recordFarm.nom);

      const code = this.normalizeFeedCode(record.code_aliment || '');

      if (!code) {
        const values = getCodeStock(farm, 'SANS_CODE');
        values.consommation_sans_code += Number(record.nombre_sacs) || 0;

        continue;
      }

      const values = getCodeStock(farm, code);

      values.total_consomme += Number(record.nombre_sacs) || 0;
    }

    // Préparer le résultat pour chaque ferme.
    const fermes = Array.from(farmStocks.values()).map((farm) => {
      const stocks = Array.from(farm.stocks.entries())
        .filter(([code]) => code !== 'SANS_CODE')
        .map(([code, values]) => {
          const totalRecu = Math.round(values.total_recu * 100) / 100;

          const totalConsomme = Math.round(values.total_consomme * 100) / 100;

          return {
            code_aliment: code,
            total_recu: totalRecu,
            total_consomme: totalConsomme,
            stock_disponible:
              Math.round((totalRecu - totalConsomme) * 100) / 100,
          };
        });

      const sansCode = farm.stocks.get('SANS_CODE');

      const consommationSansCode = sansCode?.consommation_sans_code ?? 0;

      return {
        farmId: farm.id,
        nom_ferme: farm.nom,
        unite: 'sacs',
        nombre_types_aliments: stocks.length,
        stocks,
        consommation_sans_code: Math.round(consommationSansCode * 100) / 100,
      };
    });

    // Les anciennes livraisons sans ferme restent séparées.
    const livraisonsSansFerme =
      user.role === UserRole.ADMIN
        ? await this.deliveryRepository
            .createQueryBuilder('delivery')
            .where('delivery.farmId IS NULL')
            .orderBy('delivery.date_reception', 'DESC')
            .getMany()
        : [];

    const anciennesLivraisons = livraisonsSansFerme.map((delivery) => ({
      id: delivery.id,
      code_aliment: delivery.code_aliment,
      date_reception: delivery.date_reception,
      nombre_sacs: Number(delivery.nombre_sacs),
    }));

    return {
      unite: 'sacs',
      nombre_fermes: fermes.length,
      fermes,
      anciennes_livraisons_sans_ferme: anciennesLivraisons,
    };
  }
}
