import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { Request } from 'express';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { RejectPostDto } from './dto/reject-post.dto';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/summary')
  dashboardSummary(@Query('days') days?: string) {
    const parsedDays = days ? Number(days) : undefined;
    return this.adminService.dashboardSummary(Number.isFinite(parsedDays) ? parsedDays : undefined);
  }

  @Get('users')
  listUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.adminService.listUsers(page, limit);
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Post('users')
  createUser(@Body() dto: CreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Req() req: Request) {
    const dto = plainToInstance(UpdateUserDto, req.body ?? {});
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) {
      const messages = errors.flatMap((e) =>
        e.constraints ? Object.values(e.constraints) : [],
      );
      throw new BadRequestException(messages.length > 0 ? messages : errors);
    }
    return this.adminService.updateUser(id, dto);
  }

  @Get('doctors/pending')
  listPendingDoctors(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.adminService.listPendingDoctors(page, limit);
  }

  @Patch('doctors/:userId/approve')
  approveDoctor(@Param('userId') userId: string) {
    return this.adminService.approveDoctor(userId);
  }

  @Patch('doctors/:userId/reject')
  rejectDoctor(@Param('userId') userId: string) {
    return this.adminService.rejectDoctor(userId);
  }

  @Get('posts/pending')
  listPendingPosts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.adminService.listPendingPosts(page, limit);
  }

  @Get('posts/:id')
  getPost(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getPostDetail(id);
  }

  @Patch('posts/:id/approve')
  approvePost(@Param('id', ParseIntPipe) id: number, @CurrentUser() admin: User) {
    return this.adminService.approvePost(id, admin.id);
  }

  @Patch('posts/:id/reject')
  rejectPost(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: User,
    @Body() dto: RejectPostDto,
  ) {
    return this.adminService.rejectPost(id, admin.id, dto.reason);
  }

  @Get('questions/pending')
  listPendingQuestions(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.adminService.listPendingQuestions(page, limit);
  }

  @Patch('questions/:id/approve')
  approveQuestion(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.adminService.approveQuestion(id);
  }

  @Patch('questions/:id/reject')
  rejectQuestion(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: RejectPostDto) {
    return this.adminService.rejectQuestion(id, dto.reason);
  }

  @Get('specialties')
  listSpecialties(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.adminService.listSpecialties(page, limit);
  }

  @Post('specialties')
  createSpecialty(@Body() dto: CreateSpecialtyDto) {
    return this.adminService.createSpecialty(dto);
  }

  @Patch('specialties/:id')
  updateSpecialty(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSpecialtyDto) {
    return this.adminService.updateSpecialty(id, dto);
  }

  @Patch('specialties/:id/status')
  setSpecialtyStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { status: 'active' | 'inactive' },
  ) {
    return this.adminService.setSpecialtyStatus(id, dto.status);
  }
}
