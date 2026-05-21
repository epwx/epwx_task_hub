
import dotenv from 'dotenv';
dotenv.config();
import { Sequelize } from 'sequelize';

const hasExplicitDbConfig = Boolean(
  process.env.DB_HOST &&
  process.env.DB_PORT &&
  process.env.DB_NAME &&
  process.env.DB_USER
);

console.log('[DB-CONFIG]', {
  databaseUrl: process.env.DATABASE_URL ? 'configured' : undefined,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD ? '***' : undefined
});

const commonConfig = {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

const sequelize = hasExplicitDbConfig
  ? new Sequelize({
      ...commonConfig,
      host: process.env.DB_HOST,
      port: Number.parseInt(process.env.DB_PORT, 10),
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    })
  : new Sequelize(process.env.DATABASE_URL, commonConfig);

export default sequelize;
