import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../entities/post.entity';
import { DoctorsModule } from '../doctors/doctors.module';
import { BookingsModule } from '../bookings/bookings.module';
import { DoctorPortalController } from './doctor-portal.controller';
import { DoctorPostsController } from './doctor-posts.controller';
import { DoctorPostsService } from './doctor-posts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Post]), DoctorsModule, BookingsModule],
  controllers: [DoctorPortalController, DoctorPostsController],
  providers: [DoctorPostsService],
})
export class DoctorPortalModule {}

