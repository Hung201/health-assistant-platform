import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { PatientProfile } from '../entities/patient-profile.entity';
import { DoctorProfile } from '../entities/doctor-profile.entity';
import { UserIdentity } from '../entities/user-identity.entity';
import { DoctorSpecialty } from '../entities/doctor-specialty.entity';
import { Specialty } from '../entities/specialty.entity';
import { CloudinaryService } from '../media/cloudinary.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, PatientProfile, DoctorProfile, UserIdentity, DoctorSpecialty, Specialty])],
  controllers: [UsersController],
  providers: [UsersService, CloudinaryService],
  exports: [UsersService],
})
export class UsersModule {}
