import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '../entities/user.entity';
import { DoctorsService } from './doctors.service';
import { CreateSlotDto } from './dto/create-slot.dto';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  /** Danh sách bác sĩ công khai (chỉ bác sĩ đã được duyệt). */
  @Public()
  @Get()
  list(@Query('specialtyId') specialtyId?: string) {
    const sid = specialtyId ? Number(specialtyId) : undefined;
    return this.doctorsService.listPublicDoctors(
      sid != null && !Number.isNaN(sid) ? sid : undefined,
    );
  }

  /** Chi tiết bác sĩ (public). */
  @Public()
  @Get(':doctorUserId')
  detail(@Param('doctorUserId') doctorUserId: string) {
    return this.doctorsService.getPublicDoctorDetail(doctorUserId);
  }

  /** Slot công khai theo bác sĩ (để bệnh nhân chọn và đặt lịch). */
  @Public()
  @Get(':doctorUserId/slots')
  slots(
    @Param('doctorUserId') doctorUserId: string,
    @Query('specialtyId') specialtyId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const sid = specialtyId ? Number(specialtyId) : undefined;
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    return this.doctorsService.listPublicSlots({
      doctorUserId,
      specialtyId: sid != null && !Number.isNaN(sid) ? sid : undefined,
      from: fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : undefined,
      to: toDate && !Number.isNaN(toDate.getTime()) ? toDate : undefined,
    });
  }
}

