import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DoctorQuestion } from '../entities/doctor-question.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { QaController } from './qa.controller';
import { QaService } from './qa.service';

@Module({
  imports: [TypeOrmModule.forFeature([DoctorQuestion]), NotificationsModule],
  controllers: [QaController],
  providers: [QaService],
  exports: [QaService],
})
export class QaModule {}
