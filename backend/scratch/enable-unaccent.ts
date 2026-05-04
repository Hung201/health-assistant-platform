import { DataSource } from 'typeorm';
import { config as loadEnv } from 'dotenv';

loadEnv();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'health_assistant',
});

async function main() {
  try {
    await dataSource.initialize();
    console.log('Enabling unaccent extension...');
    await dataSource.query('CREATE EXTENSION IF NOT EXISTS unaccent;');
    console.log('✅ unaccent extension enabled successfully.');
    await dataSource.destroy();
  } catch (err) {
    console.error('❌ Error enabling unaccent extension:', err);
    process.exit(1);
  }
}

main();
