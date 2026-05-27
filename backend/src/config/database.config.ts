import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { getPostgresSslOption, shouldUsePostgresSsl } from './postgres-ssl';

export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  const ssl = getPostgresSslOption();
  const useSsl = shouldUsePostgresSsl();

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'health_assistant',
    entities: [join(__dirname, '..', 'entities', '*.entity{.ts,.js}')],
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.DB_LOGGING === 'true',
    retryAttempts: 2,
    retryDelay: 2000,
    ...(ssl && { ssl }),
    extra: {
      ...(ssl && { ssl }),
      options: '-c timezone=Asia/Ho_Chi_Minh',
    },
  };
};
