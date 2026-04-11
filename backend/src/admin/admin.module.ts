import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { PatientProfile } from '../entities/patient-profile.entity';
import { DoctorProfile } from '../entities/doctor-profile.entity';
import { Post } from '../entities/post.entity';
import { Specialty } from '../entities/specialty.entity';
import { Booking } from '../entities/booking.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      PatientProfile,
      DoctorProfile,
      Post,
      Specialty,
      Booking,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService],
})
export class AdminModule {}
