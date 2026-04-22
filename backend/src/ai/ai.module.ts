import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MedicalProfile } from '../entities/medical-profile.entity';
import { PatientChronicCondition } from '../entities/patient-chronic-condition.entity';
import { Specialty } from '../entities/specialty.entity';
import { DoctorsModule } from '../doctors/doctors.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MedicalProfile, PatientChronicCondition, Specialty]),
    DoctorsModule,
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
