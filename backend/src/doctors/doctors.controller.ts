import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { Body, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '../entities/user.entity';
import { CreateDoctorReviewDto } from './dto/create-doctor-review.dto';
import { DoctorsService } from './doctors.service';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  /** Danh sách bác sĩ công khai (chỉ bác sĩ đã được duyệt). */
  @Public()
  @Get()
  list(
    @Query('specialtyId') specialtyId?: string,
    @Query('provinceCode') provinceCode?: string,
    @Query('districtCode') districtCode?: string,
    @Query('workplaceQuery') workplaceQuery?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const sid = specialtyId ? Number(specialtyId) : undefined;
    return this.doctorsService.listPublicDoctors({
      specialtyId: sid != null && !Number.isNaN(sid) ? sid : undefined,
      provinceCode: provinceCode?.trim() || undefined,
      districtCode: districtCode?.trim() || undefined,
      workplaceQuery: workplaceQuery?.trim() || undefined,
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

  @Public()
  @Get(':doctorUserId/reviews')
  reviews(
    @Param('doctorUserId') doctorUserId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.doctorsService.listDoctorReviews(doctorUserId, page, limit);
  }

  @Public()
  @Get(':doctorUserId/rating-summary')
  ratingSummary(@Param('doctorUserId') doctorUserId: string) {
    return this.doctorsService.getDoctorRatingSummary(doctorUserId);
  }

  @Post(':doctorUserId/reviews')
  createReview(
    @CurrentUser() currentUser: User,
    @Param('doctorUserId') doctorUserId: string,
    @Body() dto: CreateDoctorReviewDto,
  ) {
    return this.doctorsService.createDoctorReview(currentUser, doctorUserId, dto);
  }
}

