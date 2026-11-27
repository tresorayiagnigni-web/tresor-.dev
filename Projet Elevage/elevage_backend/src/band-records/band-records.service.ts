import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, Not, DataSource } from 'typeorm';

import { BandRecord } from './entities/band-record.entity.js';
import { Band, BandStatus } from '../bands/entities/band.entity.js';
import { User, UserRole } from '../users/entities/user.entity.js';

import { CreateBandRecordDto } from './dto/create-band-record.dto.js';
import { UpdateBandRecordDto } from './dto/update-band-record.dto.js';

interface AuthenticatedUser {
  id: number;
  email: string;
  role: UserRole;
}

@Injectable()
export class BandRecordsService {
  constructor(
    @InjectRepository(BandRecord)
    private readonly recordRepository: Repository<BandRecord>,

    @InjectRepository(Band)
    private readonly bandRepository: Repository<Band>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly dataSource: DataSource,
  ) {}

  // VÉRIFICATION DE L'UTILISATEUR ACTUEL
  private async validateUser(user: AuthenticatedUser): Promise<User> {
    const currentUser = await this.userRepository.findOne({
      where: { id: user.id, status: true },
    });

    if (!currentUser) {
      throw new ForbiddenException(
        'Compte utilisateur inactif ou introuvable.',
      );
    }

    return currentUser;
  }

  // VÉRIFICATION DU RÔLE ADMIN EN BASE DE DONNÉES
  private async validateAdmin(user: AuthenticatedUser): Promise<User> {
    const currentUser = await this.validateUser(user);

    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Seuls les administrateurs peuvent effectuer cette opération.',
      );
    }

    return currentUser;
  }

  // VÉRIFICATION DE L'ACCÈS À UNE BANDE
  private checkBandAccess(band: Band, user: User): void {
    if (user.role === UserRole.ADMIN) return;

    const assigned = band.employees?.some(
      (employee) => employee.id === user.id,
    );

    if (!assigned) {
      throw new ForbiddenException('Vous ne pouvez pas accéder à cette bande.');
    }
  }

  // VALIDATION DES DATES
  private parseDate(value: string): Date {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException(
        'La date doit respecter le format YYYY-MM-DD.',
      );
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      throw new BadRequestException('Date invalide.');
    }

    return date;
  }

  // DATE LOCALE DU CAMEROUN
  private getTodayDate(): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Douala',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  // CALCUL DE L'ÂGE EN JOURS
  private calculateAgeDays(startDate: string, recordDate: string): number {
    const start = this.parseDate(startDate);
    const current = this.parseDate(recordDate);

    return Math.floor((current.getTime() - start.getTime()) / 86400000);
  }

  // VALIDATION DE LA DATE DU RELEVÉ
  private validateRecordDate(band: Band, date: string): number {
    const startDate = this.parseDate(band.date_demarrage);
    const recordDate = this.parseDate(date);
    const today = this.getTodayDate();

    if (recordDate < startDate) {
      throw new BadRequestException(
        'Le relevé ne peut pas précéder le démarrage de la bande.',
      );
    }

    if (date > today) {
      throw new BadRequestException(
        'Un relevé ne peut pas être enregistré dans le futur.',
      );
    }

    return this.calculateAgeDays(band.date_demarrage, date);
  }

  // VALIDATION DES TEMPÉRATURES
  private validateTemperatures(min?: number | null, max?: number | null): void {
    if (
      min !== undefined &&
      min !== null &&
      max !== undefined &&
      max !== null &&
      Number(min) > Number(max)
    ) {
      throw new BadRequestException(
        'La température minimale ne peut pas dépasser la température maximale.',
      );
    }
  }

  // VALIDATION DES PERTES CUMULÉES
  private validateChronologicalLosses(
    band: Band,
    records: Array<{
      date_releve: string;
      mortalite_jour: number;
      autres_sorties: number;
    }>,
  ): void {
    const sortedRecords = [...records].sort((a, b) =>
      a.date_releve.localeCompare(b.date_releve),
    );

    let cumulativeLosses = 0;

    for (const record of sortedRecords) {
      cumulativeLosses +=
        Number(record.mortalite_jour || 0) + Number(record.autres_sorties || 0);

      if (cumulativeLosses > band.effectif_initial) {
        throw new BadRequestException(
          `Les pertes cumulées dépassent l'effectif initial à la date du ${record.date_releve}.`,
        );
      }
    }
  }

  // CALCUL DE L'EFFECTIF RESTANT
  private async calculateRemaining(
    band: Band,
    date: string,
    currentRecordId?: number,
  ): Promise<number> {
    const records = await this.recordRepository.find({
      where: {
        band: { id: band.id },
        date_releve: LessThanOrEqual(date),
        ...(currentRecordId !== undefined ? { id: Not(currentRecordId) } : {}),
      },
    });

    const totalLosses = records.reduce(
      (total, record) =>
        total + Number(record.mortalite_jour) + Number(record.autres_sorties),
      0,
    );

    return band.effectif_initial - totalLosses;
  }

  // ENRICHISSEMENT D'UN RELEVÉ
  private async enrichRecord(record: BandRecord) {
    const ageDays = this.calculateAgeDays(
      record.band.date_demarrage,
      record.date_releve,
    );

    const previousRemaining = await this.calculateRemaining(
      record.band,
      record.date_releve,
      record.id,
    );

    return {
      ...record,
      age_jours: ageDays,
      semaine: Math.floor(ageDays / 7) + 1,
      effectif_restant:
        previousRemaining -
        Number(record.mortalite_jour) -
        Number(record.autres_sorties),
    };
  }

  // DÉTECTION DES DOUBLONS
  private isDuplicateEntry(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const dbError = error as {
      code?: string;
      errno?: number;
    };

    return dbError.code === 'ER_DUP_ENTRY' || dbError.errno === 1062;
  }

  // CHARGEMENT COMPLET D'UN RELEVÉ
  private async loadCompleteRecord(id: number): Promise<BandRecord> {
    const record = await this.recordRepository.findOne({
      where: { id },
      relations: {
        band: {
          farm: true,
          employees: true,
        },
        createdBy: true,
      },
    });

    if (!record) {
      throw new NotFoundException('Relevé introuvable après enregistrement.');
    }

    return record;
  }

  // CRÉATION
  async create(dto: CreateBandRecordDto, authenticatedUser: AuthenticatedUser) {
    const user = await this.validateUser(authenticatedUser);

    let savedId: number;

    try {
      savedId = await this.dataSource.transaction(async (manager) => {
        const bandRepo = manager.getRepository(Band);
        const recordRepo = manager.getRepository(BandRecord);

        const lockedBand = await bandRepo.findOne({
          where: { id: dto.bandId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!lockedBand) {
          throw new NotFoundException('Bande introuvable.');
        }

        const band = await bandRepo.findOne({
          where: { id: dto.bandId },
          relations: {
            employees: true,
            farm: true,
          },
        });

        if (!band) {
          throw new NotFoundException('Bande introuvable.');
        }

        if (band.status !== BandStatus.GROWING) {
          throw new BadRequestException(
            'Cette bande ne reçoit plus de nouveaux relevés.',
          );
        }

        this.checkBandAccess(band, user);
        this.validateRecordDate(band, dto.date_releve);

        const existing = await recordRepo.findOne({
          where: {
            band: { id: band.id },
            date_releve: dto.date_releve,
          },
        });

        if (existing) {
          throw new ConflictException(
            'Un relevé existe déjà pour cette bande à cette date.',
          );
        }

        this.validateTemperatures(dto.temperature_min_c, dto.temperature_max_c);

        const records = await recordRepo.find({
          where: { band: { id: band.id } },
        });

        this.validateChronologicalLosses(band, [
          ...records,
          {
            date_releve: dto.date_releve,
            mortalite_jour: dto.mortalite_jour ?? 0,
            autres_sorties: dto.autres_sorties ?? 0,
          },
        ]);

        const { bandId, ...recordData } = dto;

        // Conversion automatique : 1 sac = 50 kg
        const nombreSacs = Number(dto.nombre_sacs) || 0;

        const quantiteAlimentKg =
          nombreSacs > 0 ? Math.round(nombreSacs * 50 * 100) / 100 : 0;

        const record = recordRepo.create({
          ...recordData,
          nombre_sacs: nombreSacs,
          quantite_aliment_kg: quantiteAlimentKg,
          mortalite_jour: dto.mortalite_jour ?? 0,
          autres_sorties: dto.autres_sorties ?? 0,
          band,
          createdBy: user,
        });

        const saved = await recordRepo.save(record);

        return saved.id;
      });
    } catch (error) {
      if (this.isDuplicateEntry(error)) {
        throw new ConflictException(
          'Un relevé existe déjà pour cette bande à cette date.',
        );
      }

      throw error;
    }

    const completeRecord = await this.loadCompleteRecord(savedId);

    return this.enrichRecord(completeRecord);
  }

  // LISTE DES RELEVÉS ACCESSIBLES
  async findAll(authenticatedUser: AuthenticatedUser) {
    const user = await this.validateUser(authenticatedUser);

    const records = await this.recordRepository.find({
      where:
        user.role === UserRole.ADMIN
          ? {}
          : { band: { employees: { id: user.id } } },
      relations: {
        band: {
          farm: true,
          employees: true,
        },
        createdBy: true,
      },
      order: {
        date_releve: 'DESC',
      },
    });

    return Promise.all(records.map((record) => this.enrichRecord(record)));
  }

  // UN SEUL RELEVÉ
  async findOne(id: number, authenticatedUser: AuthenticatedUser) {
    const user = await this.validateUser(authenticatedUser);

    const record = await this.recordRepository.findOne({
      where: { id },
      relations: {
        band: {
          farm: true,
          employees: true,
        },
        createdBy: true,
      },
    });

    if (!record) {
      throw new NotFoundException('Relevé introuvable.');
    }

    this.checkBandAccess(record.band, user);

    return this.enrichRecord(record);
  }

  // MODIFICATION ADMIN
  async update(
    id: number,
    dto: UpdateBandRecordDto,
    authenticatedUser: AuthenticatedUser,
  ) {
    await this.validateAdmin(authenticatedUser);

    let savedId: number;

    try {
      savedId = await this.dataSource.transaction(async (manager) => {
        const bandRepo = manager.getRepository(Band);
        const recordRepo = manager.getRepository(BandRecord);

        const snapshot = await recordRepo.findOne({
          where: { id },
          relations: { band: true },
        });

        if (!snapshot) {
          throw new NotFoundException('Relevé introuvable.');
        }

        const bandId = snapshot.band.id;

        const lockedBand = await bandRepo.findOne({
          where: { id: bandId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!lockedBand) {
          throw new NotFoundException('Bande introuvable.');
        }

        const record = await recordRepo.findOne({
          where: { id },
          relations: { band: true },
        });

        if (!record) {
          throw new NotFoundException('Relevé introuvable.');
        }

        const band = await bandRepo.findOne({
          where: { id: bandId },
          relations: {
            employees: true,
            farm: true,
          },
        });

        if (!band) {
          throw new NotFoundException('Bande introuvable.');
        }

        const newDate = dto.date_releve ?? record.date_releve;

        this.validateRecordDate(band, newDate);

        const duplicate = await recordRepo.findOne({
          where: {
            band: { id: band.id },
            date_releve: newDate,
            id: Not(record.id),
          },
        });

        if (duplicate) {
          throw new ConflictException(
            'Un relevé existe déjà pour cette bande à cette date.',
          );
        }

        const minTemperature =
          dto.temperature_min_c ?? record.temperature_min_c;

        const maxTemperature =
          dto.temperature_max_c ?? record.temperature_max_c;

        this.validateTemperatures(minTemperature, maxTemperature);

        const records = await recordRepo.find({
          where: { band: { id: band.id } },
        });

        const candidate = {
          date_releve: newDate,
          mortalite_jour: dto.mortalite_jour ?? record.mortalite_jour,
          autres_sorties: dto.autres_sorties ?? record.autres_sorties,
        };

        this.validateChronologicalLosses(band, [
          ...records.filter((item) => item.id !== record.id),
          candidate,
        ]);

        Object.assign(record, dto);

        await recordRepo.save(record);

        return record.id;
      });
    } catch (error) {
      if (this.isDuplicateEntry(error)) {
        throw new ConflictException(
          'Un relevé existe déjà pour cette bande à cette date.',
        );
      }

      throw error;
    }

    const updated = await this.loadCompleteRecord(savedId);

    return this.enrichRecord(updated);
  }

  // SUPPRESSION ADMIN
  async remove(id: number, authenticatedUser: AuthenticatedUser) {
    await this.validateAdmin(authenticatedUser);

    await this.dataSource.transaction(async (manager) => {
      const bandRepo = manager.getRepository(Band);
      const recordRepo = manager.getRepository(BandRecord);

      const record = await recordRepo.findOne({
        where: { id },
        relations: { band: true },
      });

      if (!record) {
        throw new NotFoundException('Relevé introuvable.');
      }

      const lockedBand = await bandRepo.findOne({
        where: { id: record.band.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lockedBand) {
        throw new NotFoundException('Bande introuvable.');
      }

      await recordRepo.remove(record);
    });

    return {
      message: 'Relevé supprimé avec succès.',
    };
  }
}
