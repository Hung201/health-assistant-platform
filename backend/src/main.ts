import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

function isPostgresConnectionRefused(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  if ('code' in err && (err as { code: string }).code === 'ECONNREFUSED') return true;
  if (
    'errors' in err &&
    Array.isArray((err as { errors: unknown[] }).errors) &&
    (err as { errors: unknown[] }).errors.some(
      (e: unknown) => e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'ECONNREFUSED',
    )
  )
    return true;
  return false;
}

const POSTGRES_HELP =
  '\n[PostgreSQL] Không kết nối được tới database (ECONNREFUSED).\n' +
  '  • Cài và khởi động PostgreSQL (port 5432), hoặc dùng Docker:\n' +
  '    docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres --name pg postgres:16\n' +
  '  • Tạo database: docker exec -it pg psql -U postgres -c "CREATE DATABASE health_assistant;"\n' +
  '  • Chạy schema: psql -U postgres -h localhost -d health_assistant -f backend/database/schema.sql\n' +
  '  • Kiểm tra .env: DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE\n';

process.on('unhandledRejection', (reason: unknown) => {
  if (isPostgresConnectionRefused(reason)) {
    // eslint-disable-next-line no-console
    console.error(POSTGRES_HELP);
  }
});

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.use(cookieParser());
    app.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3001',
      credentials: true,
    });
    await app.listen(process.env.PORT ?? 4000);
  } catch (err: unknown) {
    if (isPostgresConnectionRefused(err)) {
      // eslint-disable-next-line no-console
      console.error(POSTGRES_HELP);
    }
    throw err;
  }
}
bootstrap();
