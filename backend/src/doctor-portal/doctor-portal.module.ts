import { Module } from '@nestjs/common';

import { DoctorsModule } from '../doctors/doctors.module';
import { BookingsModule } from '../bookings/bookings.module';
import { DoctorPortalController } from './doctor-portal.controller';

@Module({
  imports: [DoctorsModule, BookingsModule],
  controllers: [DoctorPortalController],
})
export class DoctorPortalModule {}

