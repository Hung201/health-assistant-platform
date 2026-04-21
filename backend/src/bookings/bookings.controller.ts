import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { BookingsService } from './bookings.service';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateGuestBookingDto } from './dto/create-guest-booking.dto';

@Controller('bookings')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /** Khách không đăng nhập — lưu ý: giữ `guestLookupToken` bí mật để tra cứu. */
  @Public()
  @Post('guest')
  createGuest(@Body() dto: CreateGuestBookingDto) {
    return this.bookingsService.createGuestBooking(dto);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(user, dto);
  }

  @Get('me')
  myBookings(@CurrentUser() user: User) {
    return this.bookingsService.listMyBookings(user);
  }

  @Get('me/:id')
  myBookingDetail(@CurrentUser() user: User, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.bookingsService.getMyBookingDetail(user, id);
  }

  @Get('me/:id/payment')
  myBookingPayment(@CurrentUser() user: User, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.bookingsService.getMyBookingPayment(user, id);
  }

  @Patch('me/:id/cancel')
  cancelMyBooking(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancelMyBooking(user, id, dto);
  }
}

