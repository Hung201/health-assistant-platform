import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../entities/booking.entity';
import { BookingStatusLog } from '../entities/booking-status-log.entity';
import { Payment } from '../entities/payment.entity';
import { MomoService } from './momo.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Booking, BookingStatusLog])],
  controllers: [PaymentsController],
  providers: [MomoService, PaymentsService],
  exports: [PaymentsService, MomoService],
})
export class PaymentsModule {}
