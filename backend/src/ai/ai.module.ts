import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MedicalProfile } from '../entities/medical-profile.entity';
import { PatientChronicCondition } from '../entities/patient-chronic-condition.entity';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalProfile, PatientChronicCondition])],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
