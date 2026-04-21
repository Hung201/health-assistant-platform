import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { DoctorsService } from '../doctors/doctors.service';
import { CreateSlotDto } from '../doctors/dto/create-slot.dto';
import { BookingsService } from '../bookings/bookings.service';
import { RejectBookingDto } from './dto/reject-booking.dto';

@Controller('doctor')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class DoctorPortalController {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly bookingsService: BookingsService,
  ) {}

  @Get('slots')
  mySlots(@CurrentUser() user: User) {
    return this.doctorsService.listMySlots(user);
  }

  @Post('slots')
  createSlot(@CurrentUser() user: User, @Body() dto: CreateSlotDto) {
    return this.doctorsService.createMySlot(user, dto);
  }

  @Patch('slots/:id/cancel')
  cancelSlot(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.doctorsService.cancelMySlot(user, id);
  }

  @Get('bookings')
  myBookings(@CurrentUser() user: User) {
    return this.bookingsService.listDoctorBookings(user);
  }

  @Patch('bookings/:bookingId/approve')
  approveBooking(@CurrentUser() user: User, @Param('bookingId', new ParseUUIDPipe()) bookingId: string) {
    return this.bookingsService.approveBookingByDoctor(user, bookingId);
  }

  @Patch('bookings/:bookingId/reject')
  rejectBooking(
    @CurrentUser() user: User,
    @Param('bookingId', new ParseUUIDPipe()) bookingId: string,
    @Body() dto: RejectBookingDto,
  ) {
    return this.bookingsService.rejectBookingByDoctor(user, bookingId, dto.reason);
  }
}

