import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { DoctorsService } from './doctors.service';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  /** Danh sách bác sĩ công khai (chỉ bác sĩ đã được duyệt). */
  @Public()
  @Get()
  list(
    @Query('specialtyId') specialtyId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const sid = specialtyId ? Number(specialtyId) : undefined;
    return this.doctorsService.listPublicDoctors({
      specialtyId: sid != null && !Number.isNaN(sid) ? sid : undefined,
      page,
      limit,
    });
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

