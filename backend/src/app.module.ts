import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { DoctorsModule } from './doctors/doctors.module';
import { BookingsModule } from './bookings/bookings.module';
import { DoctorPortalModule } from './doctor-portal/doctor-portal.module';
import { PostsModule } from './posts/posts.module';
import { AiModule } from './ai/ai.module';
import { MailModule } from './mail/mail.module';
import { LivestreamsModule } from './livestreams/livestreams.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(getDatabaseConfig()),
    MailModule,
    AuthModule,
    UsersModule,
    AdminModule,
    DoctorsModule,
    BookingsModule,
    DoctorPortalModule,
    PostsModule,
    AiModule,
    LivestreamsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
