
import 'reflect-metadata';
import 'dotenv/config';

import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
  type: 'mysql',

  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),

  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'elevage_db',

  entities: [],

  migrations: ['dist/database/migrations/*.js'],

  synchronize: false,
  migrationsRun: false,

  logging: true,
});

export default AppDataSource;
