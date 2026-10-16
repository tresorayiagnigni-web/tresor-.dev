import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity'; // adapte le chemin si besoin
import { TokenService } from './token.service'; // adapte le chemin si besoin
import { hash } from 'crypto';
import { compare } from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  // ===== MOCKS =====
  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    hash: jest.fn(),
    compare: jest.fn(),
    signAsync: jest.fn(),
    saveAccessToken: jest.fn(),
    revokeToken: jest.fn(),
    genSalt: jest.fn(),

    // ajoute d'autres méthodes si tu les utilises dans AuthService
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('fake-jwt-token'),
    verify: jest.fn(),
  };

  const mockTokenService = {
    // mets ici les méthodes que TokenService expose et que AuthService utilise
    createToken: jest.fn(),
    // ...
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});