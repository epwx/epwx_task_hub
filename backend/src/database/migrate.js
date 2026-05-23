import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '../../migrations');
const metadataTableName = 'SequelizeMeta';

async function ensureMetadataTable() {
  await sequelize.getQueryInterface().createTable(metadataTableName, {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      primaryKey: true,
    },
  }).catch((error) => {
    if (error?.name !== 'SequelizeDatabaseError' && error?.name !== 'SequelizeUniqueConstraintError') {
      throw error;
    }

    const message = String(error?.message || '');
    if (!message.includes('already exists')) {
      throw error;
    }
  });
}

async function getAppliedMigrations() {
  const [rows] = await sequelize.query(`SELECT name FROM "${metadataTableName}" ORDER BY name ASC;`);
  return new Set(rows.map((row) => row.name));
}

async function recordMigration(name) {
  await sequelize.getQueryInterface().bulkInsert(metadataTableName, [{ name }]);
}

async function loadMigrationFiles() {
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => entry.name)
    .sort();
}

async function run() {
  try {
    await sequelize.authenticate();
    await ensureMetadataTable();

    const applied = await getAppliedMigrations();
    const migrationFiles = await loadMigrationFiles();
    const queryInterface = sequelize.getQueryInterface();

    for (const fileName of migrationFiles) {
      if (applied.has(fileName)) {
        continue;
      }

      const migrationPath = path.join(migrationsDir, fileName);
      const migrationModule = await import(pathToFileURL(migrationPath).href);
      const migration = migrationModule.default || migrationModule;

      if (typeof migration.up !== 'function') {
        throw new Error(`Migration ${fileName} is missing an up() function`);
      }

      console.log(`Applying migration: ${fileName}`);
      await migration.up(queryInterface, Sequelize);
      await recordMigration(fileName);
      console.log(`Applied migration: ${fileName}`);
    }

    console.log('Migrations complete.');
    await sequelize.close();
  } catch (error) {
    console.error('Migration failed:', error);
    await sequelize.close();
    process.exit(1);
  }
}

run();