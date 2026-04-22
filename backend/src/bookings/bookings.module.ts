import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Booking } from '../entities/booking.entity';
import { BookingStatusLog } from '../entities/booking-status-log.entity';
import { DoctorAvailableSlot } from '../entities/doctor-available-slot.entity';
import { DoctorProfile } from '../entities/doctor-profile.entity';
import { PatientProfile } from '../entities/patient-profile.entity';
import { Payment } from '../entities/payment.entity';
import { Specialty } from '../entities/specialty.entity';
import { User } from '../entities/user.entity';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      BookingStatusLog,
      DoctorAvailableSlot,
      DoctorProfile,
      PatientProfile,
      Payment,
      Specialty,
      User,
    ]),
    PaymentsModule,
    NotificationsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}

